import prisma from "@/lib/db";
import { OrderStatus, Prisma } from "@prisma/client";
import { getTieredPrice } from "./cart-service";
import { notifyNewOrder, notifyLowStock } from "./notification-service";
import { Errors } from "@/lib/errors";

// ── TYPES ─────────────────────────────────────────────────────────────────
interface OrderItemInput {
    productId: string;
    quantity: number;
}

interface CreateOrderInput {
    customerId: string;
    items: OrderItemInput[];
    createdBy?: "CUSTOMER" | "ADMIN" | "SYSTEM";
    notes?: string;
}

// ── CONSTANTS ─────────────────────────────────────────────────────────────
const MIN_ORDER_BILL = 5000;

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
            include: { priceTiers: { orderBy: { minQuantity: "desc" } } },
        });

        if (products.length !== productIds.length) {
            const found = products.map((p) => p.id);
            const missing = productIds.filter((id) => !found.includes(id));
            throw Errors.invalidInput(`Products not found: ${missing.join(", ")}`);
        }

        // Step 2: Validate minimum order quantity
        for (const item of input.items) {
            const product = products.find((p) => p.id === item.productId)!;
            if (item.quantity < product.minimumOrderQuantity) {
                throw Errors.minimumNotMet(product.name, product.minimumOrderQuantity, item.quantity);
            }
        }

        // Step 3: Validate units per box
        for (const item of input.items) {
            const product = products.find((p) => p.id === item.productId)!;
            if (item.quantity % product.unitsPerBox !== 0) {
                throw Errors.unitsPerBoxMismatch(product.name, product.unitsPerBox, item.quantity);
            }
        }

        // Step 4: Validate and update stock
        for (const item of input.items) {
            const product = products.find((p) => p.id === item.productId)!;
            if (product.stockQuantity < item.quantity) {
                throw Errors.outOfStock(product.name, product.stockQuantity, item.quantity);
            }
            await tx.product.update({
                where: { id: item.productId },
                data: { stockQuantity: { decrement: item.quantity } },
            });
        }

        // Step 5: Calculate total with tiered pricing
        let totalPrice = 0;
        const orderItemsData = input.items.map((item) => {
            const product = products.find((p) => p.id === item.productId)!;

            // Apply best matching tier
            let unitPrice = Number(product.wholesalePrice);
            for (const tier of product.priceTiers) {
                if (item.quantity >= tier.minQuantity) {
                    unitPrice = Number(tier.price);
                    break; // Already sorted desc, first match is best
                }
            }

            const lineTotal = unitPrice * item.quantity;
            totalPrice += lineTotal;
            return {
                productId: item.productId,
                quantity: item.quantity,
                price: unitPrice,
            };
        });

        // Step 5.5: Validate Total Bill Minimum
        if (totalPrice < MIN_ORDER_BILL) {
            throw Errors.invalidInput(`Minimum order total is ${MIN_ORDER_BILL.toLocaleString()} DA. Your total is ${totalPrice.toLocaleString()} DA.`);
        }

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
        for (const item of input.items) {
            const product = products.find((p) => p.id === item.productId)!;
            let unitPrice = Number(product.wholesalePrice);
            for (const tier of product.priceTiers) {
                if (item.quantity >= tier.minQuantity) {
                    unitPrice = Number(tier.price);
                    break;
                }
            }
            await tx.productSales.upsert({
                where: { productId: item.productId },
                update: {
                    unitsSold: { increment: item.quantity },
                    revenue: { increment: unitPrice * item.quantity },
                },
                create: {
                    productId: item.productId,
                    unitsSold: item.quantity,
                    revenue: unitPrice * item.quantity,
                },
            });
        }

        for (const item of input.items) {
            await tx.inventoryLog.create({
                data: {
                    productId: item.productId,
                    changeType: "SALE",
                    quantity: -item.quantity,
                    source: "ORDER",
                    reason: `Sale from order ${order.id}`,
                },
            });
        }

        return order;
    });

    // Post-transaction: Trigger notifications
    try {
        await notifyNewOrder(order.id, order.customer.shopName, Number(order.totalPrice));

        // Check for low stock alerts
        for (const item of order.items) {
            const product = await prisma.product.findUnique({ where: { id: item.productId } });
            if (product && product.stockQuantity <= product.lowStockThreshold) {
                await notifyLowStock(product.id, product.name, product.stockQuantity);
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
                await tx.product.update({
                    where: { id: item.productId },
                    data: { stockQuantity: { increment: item.quantity } },
                });

                await tx.inventoryLog.create({
                    data: {
                        productId: item.productId,
                        changeType: "CANCEL",
                        quantity: item.quantity,
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

export const getOrdersByCustomer = async (customerId: string, limit = 50) => {
    return await prisma.order.findMany({
        where: { customerId },
        take: limit,
        include: {
            items: { include: { product: true } },
            invoice: true,
            logs: { orderBy: { createdAt: "desc" } }
        },
        orderBy: { createdAt: "desc" },
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
        name: item.product.name,
        quantity: item.quantity,
        currentPrice: Number(item.product.wholesalePrice),
    }));
};
