import prisma from "@/lib/db";

// ── CREATE NOTIFICATION ───────────────────────────────────────────────────
export const createNotification = async (
    type: string,
    title: string,
    message: string,
    metadata?: Record<string, any>
) => {
    return await prisma.notification.create({
        data: {
            type,
            title,
            message,
            metadata: metadata ? JSON.stringify(metadata) : null,
        },
    });
};

// ── GET ALL NOTIFICATIONS ────────────────────────────────────────────────
export const getNotifications = async (limit = 30) => {
    return await prisma.notification.findMany({
        orderBy: { createdAt: "desc" },
        take: limit,
    });
};

// ── GET UNREAD COUNT ─────────────────────────────────────────────────────
export const getUnreadCount = async () => {
    return await prisma.notification.count({
        where: { isRead: false },
    });
};

// ── MARK AS READ ─────────────────────────────────────────────────────────
export const markAsRead = async (id: string) => {
    return await prisma.notification.update({
        where: { id },
        data: { isRead: true },
    });
};

// ── MARK ALL AS READ ─────────────────────────────────────────────────────
export const markAllAsRead = async () => {
    return await prisma.notification.updateMany({
        where: { isRead: false },
        data: { isRead: true },
    });
};

// ── TRIGGER HELPERS ──────────────────────────────────────────────────────
export const notifyNewOrder = async (orderId: string, customerName: string, total: number) => {
    return await createNotification(
        "NEW_ORDER",
        "New Order Received",
        `${customerName} placed an order worth ${total.toFixed(2)} DZD.`,
        { orderId }
    );
};

export const notifyLowStock = async (productId: string, productName: string, stock: number) => {
    return await createNotification(
        "LOW_STOCK",
        "Low Stock Alert",
        `"${productName}" is running low — only ${stock} units remaining.`,
        { productId }
    );
};

export const notifyNewCustomer = async (customerId: string, shopName: string) => {
    return await createNotification(
        "NEW_CUSTOMER",
        "New Customer Registered",
        `${shopName} has just registered as a new B2B customer.`,
        { customerId }
    );
};
