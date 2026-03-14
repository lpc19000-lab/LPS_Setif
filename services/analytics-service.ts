import { supabaseAdmin } from "@/lib/supabase-admin";

// ── PRODUCT PERFORMANCE & DEMAND FORECAST ─────────────────────────────────
export const getProductAnalytics = async () => {
    const { data: products, error: pError } = await supabaseAdmin
        .from('products')
        .select('id, name, brand, image_url, sales')
        .order('sales->revenue', { ascending: false });

    if (pError) throw pError;

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Fetch orders from last 30 days to calculate demand
    const { data: recentOrders, error: oError } = await supabaseAdmin
        .from('orders')
        .select('order_items(product_id, quantity)')
        .neq('status', 'CANCELLED')
        .gte('created_at', thirtyDaysAgo.toISOString());

    if (oError) throw oError;

    const recentDemandMap = new Map<string, number>();
    recentOrders?.forEach((order: any) => {
        order.order_items?.forEach((item: any) => {
            const currentQty = recentDemandMap.get(item.product_id) || 0;
            recentDemandMap.set(item.product_id, currentQty + (item.quantity || 0));
        });
    });

    const getDemandLabel = (qty: number) => {
        if (qty > 50) return "High Demand";
        if (qty >= 20) return "Medium Demand";
        return "Low Demand";
    };

    return (products || []).map((p: any) => {
        const recentQty = recentDemandMap.get(p.id) || 0;
        const sales = p.sales || { unitsSold: 0, revenue: 0 };
        return {
            id: p.id,
            name: p.name,
            brand: p.brand,
            imageUrl: p.image_url,
            totalUnitsSold: sales.unitsSold || 0,
            totalRevenue: Number(sales.revenue || 0),
            recentUnits30d: recentQty,
            demandForecast: getDemandLabel(recentQty),
        };
    });
};

// ── REVENUE ANALYTICS ─────────────────────────────────────────────────────
export const getRevenueMetrics = async () => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: validOrders, error } = await supabaseAdmin
        .from('orders')
        .select('total_price, created_at')
        .neq('status', 'CANCELLED')
        .order('created_at', { ascending: true });

    if (error) throw error;

    const dailyMap = new Map<string, { revenue: number, orders: number }>();
    for (let i = 29; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        dailyMap.set(dateStr, { revenue: 0, orders: 0 });
    }

    const monthlyMap = new Map<string, number>();

    validOrders?.forEach((order: any) => {
        const createdAt = new Date(order.created_at);
        const dStr = createdAt.toISOString().split('T')[0];
        const mStr = createdAt.toISOString().slice(0, 7); // YYYY-MM
        const amount = Number(order.total_price || 0);

        if (createdAt >= thirtyDaysAgo) {
            if (dailyMap.has(dStr)) {
                const current = dailyMap.get(dStr)!;
                dailyMap.set(dStr, { revenue: current.revenue + amount, orders: current.orders + 1 });
            }
        }

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
    .sort((a: any, b: any) => a.month.localeCompare(b.month))
    .slice(-12);

    return { dailyRevenue, monthlyRevenue };
};

// ── TOP CUSTOMERS ─────────────────────────────────────────────────────────
export const getTopCustomers = async (limit = 10) => {
    const { data: customers, error: cError } = await supabaseAdmin
        .from('customers')
        .select('id, name, shop_name, phone');

    if (cError) throw cError;

    const { data: validOrders, error: oError } = await supabaseAdmin
        .from('orders')
        .select('customer_id, total_price')
        .neq('status', 'CANCELLED');

    if (oError) throw oError;
        
    const customerSpentMap = new Map<string, { totalSpent: number, count: number }>();
    validOrders?.forEach((order: any) => {
        if (order.customer_id) {
            const current = customerSpentMap.get(order.customer_id) || { totalSpent: 0, count: 0 };
            customerSpentMap.set(order.customer_id, {
                totalSpent: current.totalSpent + Number(order.total_price || 0),
                count: current.count + 1
            });
        }
    });

    return (customers || []).map((c: any) => {
        const stats = customerSpentMap.get(c.id) || { totalSpent: 0, count: 0 };
        return {
            id: c.id,
            name: c.name || "Unknown",
            shopName: c.shop_name || "Customer",
            phone: c.phone || "",
            orderCount: stats.count,
            totalSpent: stats.totalSpent
        };
    })
    .filter((c: any) => c.totalSpent > 0)
    .sort((a: any, b: any) => b.totalSpent - a.totalSpent)
    .slice(0, limit);
};

// ── EXPORTS ───────────────────────────────────────────────────────────────
export const exportOrdersReport = async (dateFrom?: string, dateTo?: string) => {
    const { data, error } = await supabaseAdmin.functions.invoke('export-reports', {
        body: { 
            reportType: 'orders',
            dateFrom,
            dateTo 
        }
    });

    if (error) throw error;
    return data; // This will be the CSV string
};
