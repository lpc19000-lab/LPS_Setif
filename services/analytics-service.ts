import prisma from "@/lib/db";
import { OrderStatus } from "@prisma/client";

// ── PRODUCT PERFORMANCE & DEMAND FORECAST ─────────────────────────────────
export const getProductAnalytics = async () => {
    // We already have ProductSales model automatically updated via order-service
    const sales = await prisma.productSales.findMany({
        include: { product: true },
        orderBy: { revenue: "desc" },
    });

    // Demand Forecast logic (using last 30 days of order items)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentItems = await prisma.orderItem.groupBy({
        by: ['productId'],
        _sum: { quantity: true },
        where: {
            order: {
                createdAt: { gte: thirtyDaysAgo },
                status: { not: OrderStatus.CANCELLED }
            }
        }
    });

    const recentDemandMap = new Map(recentItems.map(item => [item.productId, item._sum.quantity || 0]));

    const getDemandLabel = (qty: number) => {
        if (qty > 50) return "High Demand";
        if (qty >= 20) return "Medium Demand";
        return "Low Demand";
    };

    return sales.map(s => {
        const recentQty = recentDemandMap.get(s.productId) || 0;
        return {
            id: s.product.id,
            name: s.product.name,
            brand: s.product.brand,
            imageUrl: s.product.imageUrl,
            totalUnitsSold: s.unitsSold,
            totalRevenue: Number(s.revenue),
            recentUnits30d: recentQty,
            demandForecast: getDemandLabel(recentQty),
        };
    });
};

// ── REVENUE ANALYTICS ─────────────────────────────────────────────────────
export const getRevenueMetrics = async () => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const validOrders = await prisma.order.findMany({
        where: { status: { not: OrderStatus.CANCELLED } },
        select: { id: true, totalPrice: true, createdAt: true },
        orderBy: { createdAt: "asc" }
    });

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

    validOrders.forEach(order => {
        const dStr = order.createdAt.toISOString().split('T')[0];
        const mStr = order.createdAt.toISOString().slice(0, 7); // YYYY-MM
        const amount = Number(order.totalPrice);

        // Daily
        if (order.createdAt >= thirtyDaysAgo) {
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
    })).slice(-12); // Keep last 12 months if there are many

    return {
        dailyRevenue,
        monthlyRevenue
    };
};

// ── TOP CUSTOMERS ─────────────────────────────────────────────────────────
export const getTopCustomers = async (limit = 10) => {
    const customers = await prisma.customer.findMany({
        include: {
            orders: {
                where: { status: { not: OrderStatus.CANCELLED } },
                select: { totalPrice: true }
            }
        }
    });

    const customerLTV = customers.map(c => {
        const totalSpent = c.orders.reduce((sum, order) => sum + Number(order.totalPrice), 0);
        return {
            id: c.id,
            name: c.name,
            shopName: c.shopName,
            phone: c.phone,
            orderCount: c.orders.length,
            totalSpent
        };
    }).filter(c => c.totalSpent > 0)
        .sort((a, b) => b.totalSpent - a.totalSpent)
        .slice(0, limit);

    return customerLTV;
};
