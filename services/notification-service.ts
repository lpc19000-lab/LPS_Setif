import { adminDb } from "@/lib/firebase-admin";
import { QueryDocumentSnapshot, DocumentData } from "firebase-admin/firestore";

// ── CREATE NOTIFICATION ───────────────────────────────────────────────────
export const createNotification = async (
    type: string,
    title: string,
    message: string,
    metadata?: Record<string, any>
) => {
    const docRef = await adminDb.collection("notifications").add({
        type,
        title,
        message,
        metadata: metadata || null,
        isRead: false,
        createdAt: new Date(),
    });
    return { id: docRef.id, type, title, message, metadata, isRead: false };
};

// ── GET ALL NOTIFICATIONS ────────────────────────────────────────────────
export const getNotifications = async (limit = 30) => {
    const query = await adminDb.collection("notifications")
        .orderBy("createdAt", "desc")
        .limit(limit)
        .get();
    return query.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate()
    }));
};

// ── GET UNREAD COUNT ─────────────────────────────────────────────────────
export const getUnreadCount = async () => {
    const result = await adminDb.collection("notifications")
        .where("isRead", "==", false)
        .count()
        .get();
    return result.data().count;
};

// ── MARK AS READ ─────────────────────────────────────────────────────────
export const markAsRead = async (id: string) => {
    await adminDb.collection("notifications").doc(id).update({ isRead: true });
    return { id, isRead: true };
};

// ── MARK ALL AS READ ─────────────────────────────────────────────────────
export const markAllAsRead = async () => {
    const unread = await adminDb.collection("notifications")
        .where("isRead", "==", false)
        .get();
    const batch = adminDb.batch();
    unread.docs.forEach(doc => batch.update(doc.ref, { isRead: true }));
    await batch.commit();
    return { count: unread.size };
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
