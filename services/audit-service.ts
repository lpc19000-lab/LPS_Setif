import { adminDb } from "@/lib/firebase-admin";
import { QueryDocumentSnapshot, DocumentData } from "firebase-admin/firestore";

// ── LOGGING ─────────────────────────────────────────────────────────────────
export const logAdminAction = async (data: {
    adminId: string;
    action: string;
    targetType: string;
    targetId?: string;
    metadata?: Record<string, unknown>;
}) => {
    try {
        await adminDb.collection("admin_logs").add({
            adminId: data.adminId,
            action: data.action,
            targetType: data.targetType,
            targetId: data.targetId || null,
            metadata: data.metadata ? JSON.stringify(data.metadata) : null,
            createdAt: new Date(),
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
        await adminDb.collection("system_errors").add({
            message: data.message,
            path: data.path || null,
            method: data.method || null,
            stackTrace: data.stackTrace || null,
            metadata: data.metadata ? JSON.stringify(data.metadata) : null,
            createdAt: new Date(),
        });
    } catch (e) {
        console.error("Failed to log system error:", e);
    }
};

// ── READ LOGS ─────────────────────────────────────────────────────────────
export const getAdminLogs = async (limit = 100) => {
    const logsQuery = await adminDb.collection("admin_logs")
        .orderBy("createdAt", "desc")
        .limit(limit)
        .get();

    const logs = [];
    for (const doc of logsQuery.docs) {
        const logData = doc.data();
        let adminInfo = null;
        if (logData.adminId) {
            const adminDoc = await adminDb.collection("admins").doc(logData.adminId).get();
            if (adminDoc.exists) {
                const aData = adminDoc.data();
                adminInfo = { name: aData?.name, email: aData?.email };
            }
        }
        logs.push({
            id: doc.id,
            ...logData,
            createdAt: logData.createdAt?.toDate ? logData.createdAt.toDate() : new Date(logData.createdAt),
            admin: adminInfo
        });
    }
    return logs;
};

export const getSystemErrors = async (limit = 100) => {
    const errsQuery = await adminDb.collection("system_errors")
        .orderBy("createdAt", "desc")
        .limit(limit)
        .get();

    return errsQuery.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => ({
        id: doc.id,
        ...doc.data() as any,
        createdAt: doc.data().createdAt?.toDate ? doc.data().createdAt.toDate() : new Date(doc.data().createdAt)
    }));
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
            ordersTodayQuery,
            recentErrorsQuery
        ] = await Promise.all([
            adminDb.collection("products").count().get(),
            adminDb.collection("customers").count().get(),
            adminDb.collection("orders").count().get(),
            adminDb.collection("orders").where("createdAt", ">=", today).count().get(),
            adminDb.collection("system_errors").where("createdAt", ">=", yesterday).count().get()
        ]);

        let lowStockProducts = 0;
        let deadProducts = 0;
        
        try {
            const lowStockQuery = await adminDb.collection("products").where("stockWeight", ">", 0).get();
            lowStockQuery.docs.forEach((doc: QueryDocumentSnapshot<DocumentData>) => {
                const data = doc.data();
                if (data.stockWeight <= (data.lowStockThreshold || 500)) {
                    lowStockProducts++;
                }
                if (!data.sales || (data.sales && data.sales.unitsSold === 0)) {
                    deadProducts++;
                }
            });
        } catch(e) { console.error("Could not fetch inventory health", e); }

        const recentErrors = recentErrorsQuery.data().count;

        return {
            metrics: {
                totalProducts: productsCount.data().count,
                totalCustomers: customersCount.data().count,
                totalOrders: ordersCount.data().count,
                ordersToday: ordersTodayQuery.data().count,
            },
            inventory: {
                lowStockProducts,
                deadProducts,
            },
            stability: {
                recentErrors24h: recentErrors,
                status: recentErrors > 10 ? "DEGRADED" : recentErrors > 0 ? "WARNING" : "HEALTHY",
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
