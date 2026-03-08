import prisma from "@/lib/db";
import { OrderStatus, Prisma } from "@prisma/client";
import { notifyNewOrder, notifyLowStock } from "./notification-service";
import { Errors } from "@/lib/errors";
import { unstable_cache, revalidateTag } from "next/cache";

// ── TYPES ─────────────────────────────────────────────────────────────────
interface OrderItemInput {
    productId: string;
    quantity: number;
    selectedVolume: number;
}

interface CreateOrderInput {
    customerId: string;
    items: OrderItemInput[];
    createdBy?: "CUSTOMER" | "ADMIN" | "SYSTEM";
    notes?: string;
}

// ── CONSTANTS ─────────────────────────────────────────────────────────────

// ── ATOMIC ORDER CREATION (with Tiered Pricing + Notifications + Logs) ─────
export const createOrder = async (input: CreateOrderInput) => {
    const order = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        // Step 0: Validate items
        if (!input.items || input.items.length === 0) {
            throw Errors.invalidInput("Cannot create an order without items.");
        }

        // Step 1: Validate products exist and fetch prices
        const productIds = input.items.map((i) => i.productId);
        const products = await tx.product.findMany({
            where: { id: { in: productIds } },
        });

        if (products.length !== productIds.length) {
            const found = products.map((p) => p.id);
            const missing = productIds.filter((id) => !found.includes(id));
            throw Errors.invalidInput(`Products not found: ${missing.join(", ")}`);
        }

        // Legacy validations removed

        // Step 4: Validate and update stock (ml-based)
        for (const item of input.items) {
            const product = products.find((p) => p.id === item.productId)!;
            const requiredMl = item.quantity * item.selectedVolume;

            if ((product as any).stockMl < requiredMl) {
                throw Errors.outOfStock(product.name, (product as any).stockMl, requiredMl);
            }

            await tx.product.update({
                where: { id: item.productId },
                data: { stockMl: { decrement: requiredMl } } as any,
            });
        }

        // Step 5: Calculate total with volume prices
        let totalPrice = 0;
        const orderItemsData = input.items.map((item) => {
            const product = products.find((p) => p.id === item.productId)!;

            // Calculate unit price from basePrice (per 100ml)
            const unitPrice = (Number((product as any).basePrice) / 100) * item.selectedVolume;

            const lineTotal = unitPrice * item.quantity;
            totalPrice += lineTotal;
            return {
                productId: item.productId,
                quantity: item.quantity,
                selectedVolume: item.selectedVolume,
                price: unitPrice,
            };
        });

        // Step 5.5: Validate Total Bill Minimum (Removed as per Phase 4)

        // Step 6: Create order with items (Status: PENDING by default for System 7)
        const order = await tx.order.create({
            data: {
                customerId: input.customerId,
                totalPrice,
                status: OrderStatus.PENDING,
                items: {
                    create: orderItemsData,
                },
                logs: {
                    create: {
                        status: OrderStatus.PENDING,
                        changedBy: input.createdBy || "CUSTOMER",
                        message: input.notes || "Order placed successfully.",
                    },
                },
            },
            include: { items: { include: { product: true } }, customer: true },
        });

        // Step 7: Clear customer cart
        const cart = await tx.cart.findUnique({
            where: { customerId: input.customerId },
        });
        if (cart) {
            await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
        }

        // Step 8: Create invoice
        const invoiceCount = await tx.invoice.count();
        const invoiceNumber = `INV-${new Date().getFullYear()}-${(invoiceCount + 1)
            .toString()
            .padStart(4, "0")}`;

        await tx.invoice.create({
            data: {
                orderId: order.id,
                invoiceNumber,
                totalAmount: totalPrice,
            },
        });

        // Step 9: Update ProductSales aggregation
        for (const item of orderItemsData) {
            await tx.productSales.upsert({
                where: { productId: item.productId },
                update: {
                    unitsSold: { increment: item.quantity },
                    revenue: { increment: Number(item.price) * item.quantity },
                },
                create: {
                    productId: item.productId,
                    unitsSold: item.quantity,
                    revenue: Number(item.price) * item.quantity,
                },
            });
        }

        for (const item of orderItemsData) {
            await tx.inventoryLog.create({
                data: {
                    productId: item.productId,
                    changeType: "SALE",
                    quantity: -(item.quantity * item.selectedVolume), // Log in ml
                    source: "ORDER",
                    reason: `Sale from order ${order.id}`,
                },
            });
        }

        // After order creation
        revalidateTag(`orders:${input.customerId}`);
        revalidateTag("orders");

        return order;
    });

    // Post-transaction: Trigger notifications
    try {
        await notifyNewOrder(order.id, order.customer.shopName, Number(order.totalPrice));

        // Check for low stock alerts
        for (const item of order.items) {
            const product = await prisma.product.findUnique({ where: { id: item.productId } });
            if (product && (product as any).stockMl <= product.lowStockThreshold) {
                await notifyLowStock(product.id, product.name, (product as any).stockMl);
            }
        }
    } catch (e) {
        console.error("Notification error (non-critical):", e);
    }

    return order;
};

// ── UPDATE ORDER STATUS (with Logging + Stock Management) ─────────────────
export const updateOrderStatus = async (
    orderId: string,
    status: OrderStatus,
    changedBy: "ADMIN" | "CUSTOMER" | "SYSTEM" = "ADMIN",
    message?: string
) => {
    return await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        const order = await tx.order.findUnique({
            where: { id: orderId },
            include: { items: true },
        });

        if (!order) throw new Error("Order not found");

        const oldStatus = order.status;

        // Stock automation: restore stock if cancelling a non-cancelled order
        if (status === OrderStatus.CANCELLED && oldStatus !== OrderStatus.CANCELLED) {
            for (const item of order.items) {
                const totalMl = item.quantity * (item as any).selectedVolume;
                await tx.product.update({
                    where: { id: item.productId },
                    data: { stockMl: { increment: totalMl } } as any,
                });

                await tx.inventoryLog.create({
                    data: {
                        productId: item.productId,
                        changeType: "CANCEL",
                        quantity: totalMl, // restored in ml
                        source: changedBy === "CUSTOMER" ? "ORDER" : "ADMIN",
                        reason: `Restock from cancelled order ${orderId}`,
                    },
                });
            }
            // Reverse the sales aggregation
            for (const item of order.items) {
                await tx.productSales.updateMany({
                    where: { productId: item.productId },
                    data: {
                        unitsSold: { decrement: item.quantity },
                        revenue: { decrement: Number(item.price) * item.quantity },
                    },
                });
            }
        }

        // Create log entry
        const logMessage = message || `Status changed from ${oldStatus} to ${status}.`;

        await tx.orderLog.create({
            data: {
                orderId,
                status,
                changedBy,
                message: logMessage,
            },
        });

        // After status update
        revalidateTag(`orders:${order.customerId}`);
        revalidateTag("orders");

        return await tx.order.update({
            where: { id: orderId },
            data: { status },
            include: {
                items: { include: { product: true } },
                customer: true,
                logs: { orderBy: { createdAt: "desc" } }
            },
        });
    });
};

// ── UPDATE SHIPPING INFO ──────────────────────────────────────────────────
export const updateOrderShipping = async (
    orderId: string,
    data: { shippingCompany?: string; trackingNumber?: string; shippingDate?: Date }
) => {
    const order = await prisma.order.update({
        where: { id: orderId },
        data: {
            ...data,
        },
    });

    // Log the change
    await prisma.orderLog.create({
        data: {
            orderId,
            status: order.status,
            changedBy: "ADMIN",
            message: `Shipping information updated: ${data.shippingCompany || ''} ${data.trackingNumber || ''}`,
        },
    });

    return order;
};

// ── READ ──────────────────────────────────────────────────────────────────
export const getOrders = async (limit = 50) => {
    return await prisma.order.findMany({
        take: limit,
        include: {
            customer: true,
            items: { include: { product: true } },
            invoice: true,
            logs: { orderBy: { createdAt: "desc" } }
        },
        orderBy: { createdAt: "desc" },
    });
};

export const getOrderById = async (id: string) => {
    return await prisma.order.findUnique({
        where: { id },
        include: {
            customer: true,
            items: { include: { product: true } },
            invoice: true,
            logs: { orderBy: { createdAt: "desc" } }
        },
    });
};

export const getOrdersByCustomer = (customerId: string, limit = 50, skip = 0) => {
    return unstable_cache(
        async () => {
            return await prisma.order.findMany({
                where: { customerId },
                take: limit,
                skip: skip,
                include: {
                    items: { include: { product: true } },
                    invoice: true,
                    logs: { orderBy: { createdAt: "desc" } }
                },
                orderBy: { createdAt: "desc" },
            });
        },
        [`orders-${customerId}-${limit}-${skip}`],
        { tags: [`orders:${customerId}`, "orders"], revalidate: 3600 }
    )();
};

export const countOrdersByCustomer = async (customerId: string) => {
    return await prisma.order.count({
        where: { customerId },
    });
};

// ── BEST SELLERS ──────────────────────────────────────────────────────────
export const getBestSellers = async (limit = 10) => {
    return await prisma.productSales.findMany({
        orderBy: { unitsSold: "desc" },
        take: limit,
        include: { product: { include: { category: true } } },
    });
};

// ── REORDER ───────────────────────────────────────────────────────────────
export const getReorderItems = async (orderId: string) => {
    const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: { items: { include: { product: true } } },
    });
    if (!order) throw new Error("Order not found");
    return order.items.map((item) => ({
        productId: item.productId,
        name: (item as any).product.name,
        quantity: item.quantity,
        selectedVolume: (item as any).selectedVolume,
        currentPrice: (Number((item as any).product.basePrice) / 100) * (item as any).selectedVolume,
    }));
};
