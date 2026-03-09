import prisma from "@/lib/db";
import { OrderStatus, Prisma } from "@prisma/client";
import { notifyNewOrder, notifyLowStock } from "./notification-service";
import { Errors } from "@/lib/errors";
import { unstable_cache, revalidateTag } from "next/cache";

// ── TYPES ─────────────────────────────────────────────────────────────────
interface OrderItemInput {
    productId: string;
    quantity: number;
    volumeId: string;
}

interface CreateOrderInput {
    customerId: string;
    items: OrderItemInput[];
    createdBy?: "CUSTOMER" | "ADMIN" | "SYSTEM";
    notes?: string;
    wilayaNumber?: string;
    wilayaName?: string;
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
        const uniqueProductIds = Array.from(new Set(productIds));
        const products = await tx.product.findMany({
            where: { id: { in: uniqueProductIds } },
            include: { volumes: true }
        });

        if (products.length !== uniqueProductIds.length) {
            const foundIds = products.map((p) => p.id);
            const missingIds = uniqueProductIds.filter((id) => !foundIds.includes(id));
            throw Errors.invalidInput(`Products not found: ${missingIds.join(", ")}`);
        }

        // Step 1.5: Validate volumes
        const volumeIds = input.items.map(i => i.volumeId);
        const volumes = await tx.productVolume.findMany({
            where: { id: { in: volumeIds } }
        });

        // Step 4: Validate and update stock (weight-based)
        for (const item of input.items) {
            const product = products.find((p) => p.id === item.productId)!;
            const volume = volumes.find(v => v.id === item.volumeId)!;
            const itemWeight = volume.weight || 0;
            const requiredWeight = item.quantity * itemWeight;

            if (product.stockWeight < requiredWeight) {
                throw Errors.outOfStock(product.name, product.stockWeight, requiredWeight);
            }

            await tx.product.update({
                where: { id: item.productId },
                data: { stockWeight: { decrement: requiredWeight } },
            });
        }

        // Step 5: Calculate total with weight prices
        let totalPrice = 0;
        const orderItemsData = input.items.map((item) => {
            const product = products.find((p) => p.id === item.productId)!;
            const volume = volumes.find(v => v.id === item.volumeId)!;

            // Use volume price OR calculate from basePrice (per 100g)
            const unitPrice = volume.price
                ? Number(volume.price)
                : (Number(product.basePrice) / 100) * (volume.weight || 0);

            const lineTotal = unitPrice * item.quantity;
            totalPrice += lineTotal;
            return {
                productId: item.productId,
                quantity: item.quantity,
                volumeId: item.volumeId,
                price: unitPrice,
            };
        });

        // Step 6: Create order with items
        const order = await tx.order.create({
            data: {
                customerId: input.customerId,
                totalPrice,
                status: OrderStatus.PENDING,
                wilayaNumber: input.wilayaNumber,
                wilayaName: input.wilayaName,
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
            } as any,
            include: { items: { include: { product: true, volume: true } }, customer: true },
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
        const invoiceNumber = `INV-${new Date().getFullYear()}-${(invoiceCount + 1).toString().padStart(4, "0")}-${Math.floor(Math.random() * 1000)}`;

        await tx.invoice.create({
            data: {
                orderId: order.id,
                invoiceNumber,
                totalAmount: totalPrice,
            },
        });

        // Step 9: Update ProductSales and InventoryLog
        for (const item of orderItemsData) {
            const volume = volumes.find(v => v.id === item.volumeId)!;
            const itemWeight = (volume.weight || 0);

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

            await tx.inventoryLog.create({
                data: {
                    productId: item.productId,
                    changeType: "SALE",
                    quantity: -(item.quantity * itemWeight),
                    source: "ORDER",
                    reason: `Sale from order ${order.id}`,
                },
            });
        }

        return order;
    });

    // Post-transaction: Clear cache
    revalidateTag(`orders:${input.customerId}`);
    revalidateTag("orders");

    // Post-transaction: Trigger notifications
    try {
        const fullOrder = await prisma.order.findUnique({
            where: { id: order.id },
            include: {
                customer: true,
                items: { include: { product: true } }
            }
        });

        if (fullOrder) {
            await notifyNewOrder(fullOrder.id, fullOrder.customer.shopName, Number(fullOrder.totalPrice));

            for (const item of fullOrder.items) {
                const product = item.product;
                if (product && product.stockWeight <= product.lowStockThreshold) {
                    await notifyLowStock(product.id, product.name, product.stockWeight);
                }
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
            include: { items: { include: { volume: true } } },
        });

        if (!order) throw new Error("Order not found");

        const oldStatus = order.status;

        // Stock automation: restore stock if cancelling a non-cancelled order
        if (status === OrderStatus.CANCELLED && oldStatus !== OrderStatus.CANCELLED) {
            for (const item of order.items) {
                const totalWeight = item.quantity * (item.volume.weight || 0);
                await tx.product.update({
                    where: { id: item.productId },
                    data: { stockWeight: { increment: totalWeight } },
                });

                await tx.inventoryLog.create({
                    data: {
                        productId: item.productId,
                        changeType: "CANCEL",
                        quantity: totalWeight,
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
                items: { include: { product: true, volume: true } },
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
                    items: { include: { product: true, volume: true } },
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
        include: { items: { include: { product: true, volume: true } } },
    });
    if (!order) throw new Error("Order not found");
    return order.items.map((item) => ({
        productId: item.productId,
        name: (item.product as any).name,
        quantity: item.quantity,
        volumeId: item.volumeId,
        currentPrice: Number(item.volume?.price || 0),
    }));
};
