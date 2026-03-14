import { supabaseAdmin } from "@/lib/supabase-admin";

// ── CREATE NOTIFICATION ───────────────────────────────────────────────────
export const createNotification = async (
    type: string,
    title: string,
    message: string,
    metadata?: Record<string, any>
) => {
    const { data: notification, error } = await supabaseAdmin
        .from('notifications')
        .insert([{
            type,
            title,
            message,
            metadata: metadata || null,
            is_read: false
        }])
        .select()
        .single();

    if (error) throw error;
    return { ...notification, id: notification.id, isRead: notification.is_read };
};

// ── GET ALL NOTIFICATIONS ────────────────────────────────────────────────
export const getNotifications = async (limit = 30) => {
    const { data, error } = await supabaseAdmin
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

    if (error) throw error;

    return (data || []).map(n => ({
        id: n.id,
        ...n,
        isRead: n.is_read,
        createdAt: new Date(n.created_at)
    }));
};

// ── GET UNREAD COUNT ─────────────────────────────────────────────────────
export const getUnreadCount = async () => {
    const { count, error } = await supabaseAdmin
        .from('notifications')
        .select('id', { count: 'exact', head: true })
        .eq('is_read', false);

    if (error) throw error;
    return count || 0;
};

// ── MARK AS READ ─────────────────────────────────────────────────────────
export const markAsRead = async (id: string) => {
    const { error } = await supabaseAdmin
        .from('notifications')
        .update({ is_read: true })
        .eq('id', id);

    if (error) throw error;
    return { id, isRead: true };
};

// ── MARK ALL AS READ ─────────────────────────────────────────────────────
export const markAllAsRead = async () => {
    const { count, error } = await supabaseAdmin
        .from('notifications')
        .update({ is_read: true })
        .eq('is_read', false); // Optional filter to optimize

    if (error) throw error;
    return { count: count || 0 };
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
