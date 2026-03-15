import { supabaseAdmin } from "@/lib/supabase-admin";

// ── LOGGING ─────────────────────────────────────────────────────────────────
export const logAdminAction = async (data: {
    adminId: string;
    action: string;
    targetType: string;
    targetId?: string;
    metadata?: Record<string, unknown>;
}) => {
    try {
        await supabaseAdmin.from('admin_logs').insert([{
            admin_id: data.adminId,
            action: data.action,
            target_type: data.targetType,
            target_id: data.targetId || null,
            metadata: data.metadata || null
        }]);
    } catch (e) {
        console.error("Failed to log admin action:", e);
    }
};

export const logSystemError = async (data: {
    message: string;
    path?: string;
    method?: string;
    stackTrace?: string;
    metadata?: Record<string, unknown>;
}) => {
    try {
        await supabaseAdmin.from('system_errors').insert([{
            message: data.message,
            path: data.path || null,
            method: data.method || null,
            stack_trace: data.stackTrace || null,
            metadata: data.metadata || null
        }]);
    } catch (e) {
        console.error("Failed to log system error:", e);
    }
};

// ── READ LOGS ─────────────────────────────────────────────────────────────
export const getAdminLogs = async (limit = 100) => {
    try {
        const { data, error } = await supabaseAdmin
            .from('admin_logs')
            .select('*, admin:customers(name, email)')
            .order('created_at', { ascending: false })
            .limit(limit);

        if (error) {
            console.error("Failed to fetch admin logs:", error);
            return [];
        }

        return (data || []).map(log => ({
            id: log.id,
            adminId: log.admin_id,
            action: log.action,
            targetType: log.target_type,
            targetId: log.target_id,
            metadata: log.metadata,
            createdAt: new Date(log.created_at),
            admin: log.admin ? { name: log.admin.name, email: log.admin.email } : { name: 'System', email: '' }
        }));
    } catch (e) {
        console.error("getAdminLogs failed:", e);
        return [];
    }
};

export const getSystemErrors = async (limit = 100) => {
    try {
        const { data, error } = await supabaseAdmin
            .from('system_errors')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(limit);

        if (error) {
            console.error("Failed to fetch system errors:", error);
            return [];
        }

        return (data || []).map(err => ({
            id: err.id,
            ...err,
            createdAt: new Date(err.created_at),
            stackTrace: err.stack_trace
        }));
    } catch (e) {
        console.error("getSystemErrors failed:", e);
        return [];
    }
};

// ── SYSTEM HEALTH DASHBOARD ───────────────────────────────────────────────
export const getSystemHealth = async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);

    try {
        const [
            productsCount,
            customersCount,
            ordersCount,
            ordersToday,
            recentErrors
        ] = await Promise.all([
            supabaseAdmin.from('products').select('id', { count: 'exact', head: true }),
            supabaseAdmin.from('customers').select('id', { count: 'exact', head: true }),
            supabaseAdmin.from('orders').select('id', { count: 'exact', head: true }),
            supabaseAdmin.from('orders').select('id', { count: 'exact', head: true }).gte('created_at', today.toISOString()),
            supabaseAdmin.from('system_errors').select('id', { count: 'exact', head: true }).gte('created_at', yesterday.toISOString())
        ]);

        const { data: inventoryHealth } = await supabaseAdmin
            .from('products')
            .select('stock_weight')
            .gt('stock_weight', 0);

        let lowStockProducts = 0;
        
        inventoryHealth?.forEach((p: any) => {
            if (p.stock_weight <= 500) lowStockProducts++;
        });

        const errorCount = recentErrors.count || 0;

        return {
            metrics: {
                totalProducts: productsCount.count || 0,
                totalCustomers: customersCount.count || 0,
                totalOrders: ordersCount.count || 0,
                ordersToday: ordersToday.count || 0,
            },
            inventory: {
                lowStockProducts,
                deadProducts: 0,
            },
            stability: {
                recentErrors24h: errorCount,
                status: errorCount > 10 ? "DEGRADED" : errorCount > 0 ? "WARNING" : "HEALTHY",
            }
        };
    } catch (e) {
        console.error("System health check failed", e);
        return {
            metrics: { totalProducts: 0, totalCustomers: 0, totalOrders: 0, ordersToday: 0 },
            inventory: { lowStockProducts: 0, deadProducts: 0 },
            stability: { recentErrors24h: 0, status: "UNKNOWN" }
        };
    }
};
