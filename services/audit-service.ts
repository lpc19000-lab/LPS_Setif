import prisma from "@/lib/db";

// ── LOGGING ─────────────────────────────────────────────────────────────────
export const logAdminAction = async (data: {
    adminId: string;
    action: string;
    targetType: string;
    targetId?: string;
    metadata?: Record<string, unknown>;
}) => {
    try {
        await prisma.adminLog.create({
            data: {
                adminId: data.adminId,
                action: data.action,
                targetType: data.targetType,
                targetId: data.targetId,
                metadata: data.metadata ? JSON.stringify(data.metadata) : null,
            },
        });
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
        await prisma.systemError.create({
            data: {
                message: data.message,
                path: data.path,
                method: data.method,
                stackTrace: data.stackTrace,
                metadata: data.metadata ? JSON.stringify(data.metadata) : null,
            },
        });
    } catch (e) {
        console.error("Failed to log system error:", e);
    }
};

// ── READ LOGS ─────────────────────────────────────────────────────────────
export const getAdminLogs = async (limit = 100) => {
    return await prisma.adminLog.findMany({
        orderBy: { createdAt: "desc" },
        take: limit,
        include: { admin: { select: { name: true, email: true } } },
    });
};

export const getSystemErrors = async (limit = 100) => {
    return await prisma.systemError.findMany({
        orderBy: { createdAt: "desc" },
        take: limit,
    });
};

// ── SYSTEM HEALTH DASHBOARD ───────────────────────────────────────────────
export const getSystemHealth = async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
        totalProducts,
        totalCustomers,
        totalOrders,
        ordersToday,
        lowStockProducts,
        deadProductsQuery,
        recentErrors
    ] = await Promise.all([
        // System metrics
        prisma.product.count(),
        prisma.customer.count(),
        prisma.order.count(),
        prisma.order.count({
            where: { createdAt: { gte: today } }
        }),

        // Inventory Health
        prisma.$queryRaw<[{ count: bigint }]>`SELECT COUNT(*) as count FROM products WHERE stock_weight <= low_stock_threshold AND stock_weight > 0`.then(
            (r: any) => Number(r[0]?.count ?? 0)
        ).catch(() => 0),

        // Dead Products (no active sales array OR no sales at all)
        prisma.product.count({
            where: {
                OR: [
                    { sales: null },
                    { sales: { unitsSold: 0 } }
                ],
                stockWeight: { gt: 0 }
            }
        }),

        // System Stability (Errors in last 24h)
        prisma.systemError.count({
            where: { createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } }
        })
    ]);

    // Construct response
    return {
        metrics: {
            totalProducts,
            totalCustomers,
            totalOrders,
            ordersToday,
        },
        inventory: {
            lowStockProducts,
            deadProducts: deadProductsQuery,
        },
        stability: {
            recentErrors24h: recentErrors,
            status: recentErrors > 10 ? "DEGRADED" : recentErrors > 0 ? "WARNING" : "HEALTHY",
        }
    };
};

