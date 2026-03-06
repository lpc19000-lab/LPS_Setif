import prisma from "@/lib/db";
import { OrderStatus } from "@prisma/client";

// ── SMART RESTOCK SYSTEM ──────────────────────────────────────────────────
export const getRestockSuggestions = async () => {
    const products = await prisma.product.findMany({
        select: {
            id: true,
            name: true,
            brand: true,
            imageUrl: true,
            stockQuantity: true,
            lowStockThreshold: true,
        }
    });

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

    return products.map(product => {
        const unitsSold30d = recentDemandMap.get(product.id) || 0;
        const avgDailySales = unitsSold30d / 30;

        // Handle infinity if avgDailySales is 0
        const estimatedDaysLeft = avgDailySales > 0 ? Math.floor(product.stockQuantity / avgDailySales) : 999;

        let recommendation = "Healthy";
        let status = "NORMAL";
        if (product.stockQuantity <= product.lowStockThreshold || estimatedDaysLeft < 7) {
            recommendation = "Restock Soon";
            status = "WARNING";
            if (product.stockQuantity === 0) {
                recommendation = "Restock Immediately (OOS)";
                status = "CRITICAL";
            }
        } else if (estimatedDaysLeft > 60 && product.stockQuantity > 50) {
            recommendation = "Overstock";
            status = "INFO";
        } else if (avgDailySales === 0 && product.stockQuantity > 0) {
            recommendation = "No Recent Sales";
            status = "INFO";
        }

        return {
            id: product.id,
            name: product.name,
            brand: product.brand,
            imageUrl: product.imageUrl,
            currentStock: product.stockQuantity,
            unitsSold30d,
            avgDailySales: Number(avgDailySales.toFixed(2)),
            estimatedDaysLeft,
            recommendation,
            status
        };
    }).sort((a, b) => a.estimatedDaysLeft - b.estimatedDaysLeft);
};

// ── DEAD STOCK DETECTION ──────────────────────────────────────────────────
export const getDeadStock = async () => {
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

    // Get all products that have NO order items in the last 60 days
    const activeProductIdsList = await prisma.orderItem.findMany({
        where: {
            order: {
                createdAt: { gte: sixtyDaysAgo },
                status: { not: OrderStatus.CANCELLED }
            }
        },
        select: { productId: true },
        distinct: ['productId']
    });

    const activeProductIds = new Set(activeProductIdsList.map(p => p.productId));

    const deadProducts = await prisma.product.findMany({
        where: {
            id: { notIn: Array.from(activeProductIds) },
            stockQuantity: { gt: 0 } // Only care if we actually have it in stock
        },
        select: {
            id: true,
            name: true,
            brand: true,
            imageUrl: true,
            stockQuantity: true,
            wholesalePrice: true,
            costPrice: true,
            createdAt: true
        }
    });

    return deadProducts.map(p => {
        const valueTieUp = Number(p.costPrice) * p.stockQuantity;
        return {
            ...p,
            valueTieUp,
            daysSinceAdded: Math.floor((new Date().getTime() - p.createdAt.getTime()) / (1000 * 3600 * 24))
        };
    }).filter(p => p.daysSinceAdded > 60) // Ensure it's actually old, not just a newly added product with no sales yet
        .sort((a, b) => b.valueTieUp - a.valueTieUp);
};

// ── PROFIT ANALYTICS ──────────────────────────────────────────────────────
export const getProfitAnalytics = async () => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const validOrders = await prisma.order.findMany({
        where: { status: { not: OrderStatus.CANCELLED } },
        include: {
            items: {
                include: { product: { select: { costPrice: true } } }
            }
        },
        orderBy: { createdAt: "asc" }
    });

    // Daily Profit (last 30 days)
    const dailyMap = new Map<string, { revenue: number, cost: number, profit: number }>();

    // Initialize last 30 days
    for (let i = 29; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        dailyMap.set(dateStr, { revenue: 0, cost: 0, profit: 0 });
    }

    let overallRevenue = 0;
    let overallCost = 0;

    validOrders.forEach(order => {
        const dStr = order.createdAt.toISOString().split('T')[0];

        let orderCost = 0;
        let orderRevenue = Number(order.totalPrice);

        order.items.forEach(item => {
            orderCost += Number(item.product.costPrice) * item.quantity;
        });

        const orderProfit = orderRevenue - orderCost;

        overallRevenue += orderRevenue;
        overallCost += orderCost;

        // Daily
        if (order.createdAt >= thirtyDaysAgo) {
            if (dailyMap.has(dStr)) {
                const current = dailyMap.get(dStr)!;
                dailyMap.set(dStr, {
                    revenue: current.revenue + orderRevenue,
                    cost: current.cost + orderCost,
                    profit: current.profit + orderProfit
                });
            }
        }
    });

    const dailyProfit = Array.from(dailyMap.entries()).map(([date, data]) => ({
        date,
        revenue: data.revenue,
        cost: data.cost,
        profit: data.profit,
        marginPercent: data.revenue > 0 ? (data.profit / data.revenue) * 100 : 0
    }));

    const globalMarginPercent = overallRevenue > 0 ? ((overallRevenue - overallCost) / overallRevenue) * 100 : 0;

    // Top Profitable Products
    const sales = await prisma.productSales.findMany({
        include: { product: { select: { id: true, name: true, imageUrl: true, costPrice: true, wholesalePrice: true } } }
    });

    const productsProfit = sales.map(s => {
        const costPrice = Number(s.product.costPrice);
        const avgSellPrice = s.unitsSold > 0 ? Number(s.revenue) / s.unitsSold : Number(s.product.wholesalePrice);
        const unitProfit = Math.max(0, avgSellPrice - costPrice); // avoid negative if cost > wholesale (shouldnt happen but just in case)
        const totalProfit = unitProfit * s.unitsSold;
        const marginPercent = avgSellPrice > 0 ? (unitProfit / avgSellPrice) * 100 : 0;

        return {
            id: s.product.id,
            name: s.product.name,
            imageUrl: s.product.imageUrl,
            totalProfit,
            marginPercent,
            unitsSold: s.unitsSold
        };
    }).sort((a, b) => b.totalProfit - a.totalProfit).slice(0, 10);

    return {
        dailyProfit,
        globalMarginPercent,
        overallProfit: overallRevenue - overallCost,
        topProfitableProducts: productsProfit
    };
};

// ── INVENTORY HEALTH SCORE ────────────────────────────────────────────────
export const getInventoryHealthScore = async () => {
    let score = 100;

    // Low stock penalty
    const lowStockCount = await prisma.product.count({
        where: { stockQuantity: { lte: prisma.product.fields.lowStockThreshold } }
    });
    score -= (lowStockCount * 2); // 2 points per low stock item

    // Dead stock penalty
    const deadStock = await getDeadStock();
    score -= (deadStock.length * 5); // 5 points per dead stock item

    // OOS penalty
    const oosCount = await prisma.product.count({
        where: { stockQuantity: 0 }
    });
    score -= (oosCount * 5); // 5 points per OOS item

    return Math.max(0, score); // clamp to 0
};

// ── SMART ALERTS ──────────────────────────────────────────────────────────
export const getSmartAlerts = async () => {
    const alerts = [];

    const healthScore = await getInventoryHealthScore();
    if (healthScore < 50) {
        alerts.push({ type: "CRITICAL", message: `Inventory Health Score is critically low (${healthScore}%). Immediate action required.` });
    }

    const restock = await getRestockSuggestions();
    const urgentRestock = restock.filter(r => r.status === "CRITICAL");
    if (urgentRestock.length > 0) {
        alerts.push({ type: "WARNING", message: `${urgentRestock.length} products are out of stock and need immediate restocking.` });
    }

    const warningRestock = restock.filter(r => r.status === "WARNING" && r.currentStock > 0);
    if (warningRestock.length > 0) {
        alerts.push({ type: "INFO", message: `${warningRestock.length} products are running low and will stock out within 7 days.` });
    }

    const deadStock = await getDeadStock();
    if (deadStock.length > 0) {
        alerts.push({ type: "INFO", message: `${deadStock.length} products have seen zero sales in 60+ days.` });
    }

    return alerts;
};
