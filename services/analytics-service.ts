import { adminDb } from "@/lib/firebase-admin";

// ── PRODUCT PERFORMANCE & DEMAND FORECAST ─────────────────────────────────
export const getProductAnalytics = async () => {
    // In Firebase we assume sales is embedded inside product document
    const productsQuery = await adminDb.collection("products").get();
    let productsWithSales = productsQuery.docs.map(doc => {
        const p = doc.data();
        return {
            id: doc.id,
            ...p,
            sales: p.sales || { unitsSold: 0, revenue: 0 }
        };
    }).sort((a, b) => b.sales.revenue - a.sales.revenue);

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentOrdersQuery = await adminDb.collection("orders")
        .where("createdAt", ">=", thirtyDaysAgo)
        .where("status", "!=", "CANCELLED")
        .get();

    const recentDemandMap = new Map<string, number>();

    recentOrdersQuery.docs.forEach(doc => {
        const orderData = doc.data();
        if (orderData.items && Array.isArray(orderData.items)) {
            orderData.items.forEach((item: any) => {
                const currentQty = recentDemandMap.get(item.productId) || 0;
                recentDemandMap.set(item.productId, currentQty + (item.quantity || 0));
            });
        }
    });

    const getDemandLabel = (qty: number) => {
        if (qty > 50) return "High Demand";
        if (qty >= 20) return "Medium Demand";
        return "Low Demand";
    };

    return productsWithSales.map(p => {
        const recentQty = recentDemandMap.get(p.id) || 0;
        return {
            id: p.id,
            name: p.name,
            brand: p.brand,
            imageUrl: p.imageUrl,
            totalUnitsSold: p.sales.unitsSold,
            totalRevenue: Number(p.sales.revenue),
            recentUnits30d: recentQty,
            demandForecast: getDemandLabel(recentQty),
        };
    });
};

// ── REVENUE ANALYTICS ─────────────────────────────────────────────────────
export const getRevenueMetrics = async () => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Get all orders (without limits is a risk at scale, but ok for migration start)
    const validOrdersQuery = await adminDb.collection("orders")
        .where("status", "!=", "CANCELLED")
        .get();

    // Daily Revenue (last 30 days)
    const dailyMap = new Map<string, { revenue: number, orders: number }>();

    // Initialize last 30 days
    for (let i = 29; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        dailyMap.set(dateStr, { revenue: 0, orders: 0 });
    }

    const monthlyMap = new Map<string, number>();

    validOrdersQuery.docs.forEach(doc => {
        const order = doc.data();
        const createdAt = order.createdAt?.toDate ? order.createdAt.toDate() : new Date(order.createdAt);
        
        const dStr = createdAt.toISOString().split('T')[0];
        const mStr = createdAt.toISOString().slice(0, 7); // YYYY-MM
        const amount = Number(order.totalPrice || 0);

        // Daily
        if (createdAt >= thirtyDaysAgo) {
            if (dailyMap.has(dStr)) {
                const current = dailyMap.get(dStr)!;
                dailyMap.set(dStr, { revenue: current.revenue + amount, orders: current.orders + 1 });
            }
        }

        // Monthly
        monthlyMap.set(mStr, (monthlyMap.get(mStr) || 0) + amount);
    });

    const dailyRevenue = Array.from(dailyMap.entries()).map(([date, data]) => ({
        date,
        revenue: data.revenue,
        orders: data.orders
    }));

    const monthlyRevenue = Array.from(monthlyMap.entries()).map(([month, revenue]) => ({
        month,
        revenue
    }))
    .sort((a, b) => a.month.localeCompare(b.month))
    .slice(-12);

    return {
        dailyRevenue,
        monthlyRevenue
    };
};

// ── TOP CUSTOMERS ─────────────────────────────────────────────────────────
export const getTopCustomers = async (limit = 10) => {
    const customersQuery = await adminDb.collection("customers").get();
    
    // We also need all valid orders to compute LTV
    const validOrdersQuery = await adminDb.collection("orders")
        .where("status", "!=", "CANCELLED")
        .get();
        
    const customerSpentMap = new Map<string, { totalSpent: number, count: number }>();
    
    validOrdersQuery.docs.forEach(doc => {
        const order = doc.data();
        if (order.customerId) {
            const current = customerSpentMap.get(order.customerId) || { totalSpent: 0, count: 0 };
            customerSpentMap.set(order.customerId, {
                totalSpent: current.totalSpent + Number(order.totalPrice || 0),
                count: current.count + 1
            });
        }
    });

    const customerLTV = customersQuery.docs.map(doc => {
        const c = doc.data();
        const stats = customerSpentMap.get(doc.id) || { totalSpent: 0, count: 0 };
        return {
            id: doc.id,
            name: c.name,
            shopName: c.shopName,
            phone: c.phone,
            orderCount: stats.count,
            totalSpent: stats.totalSpent
        };
    })
    .filter(c => c.totalSpent > 0)
    .sort((a, b) => b.totalSpent - a.totalSpent)
    .slice(0, limit);

    return customerLTV;
};
