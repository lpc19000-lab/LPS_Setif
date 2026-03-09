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
            stockWeight: true,
            lowStockThreshold: true,
        }
    });

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentItems = await prisma.orderItem.findMany({
        where: {
            order: {
                createdAt: { gte: thirtyDaysAgo },
                status: { not: OrderStatus.CANCELLED }
            }
        },
        include: {
            volume: { select: { weight: true } }
        }
    });

    const recentDemandMap = new Map<string, number>();
    recentItems.forEach(item => {
        const weight = item.volume?.weight || 0;
        const totalWeight = (item.quantity || 0) * weight;
        recentDemandMap.set(item.productId, (recentDemandMap.get(item.productId) || 0) + totalWeight);
    });

    return products.map(product => {
        const weightSold30d = recentDemandMap.get(product.id) || 0;
        const avgDailyWeightSales = weightSold30d / 30;

        // Handle infinity if avgDailyWeightSales is 0
        const estimatedDaysLeft = avgDailyWeightSales > 0 ? Math.floor(product.stockWeight / avgDailyWeightSales) : 999;

        let recommendation = "Healthy";
        let status = "NORMAL";
        if (product.stockWeight <= product.lowStockThreshold || estimatedDaysLeft < 7) {
            recommendation = "Restock Soon";
            status = "WARNING";
            if (product.stockWeight === 0) {
                recommendation = "Restock Immediately (OOS)";
                status = "CRITICAL";
            }
        } else if (estimatedDaysLeft > 60 && product.stockWeight > 5000) { // 5kg overstock
            recommendation = "Overstock";
            status = "INFO";
        } else if (avgDailyWeightSales === 0 && product.stockWeight > 0) {
            recommendation = "No Recent Sales";
            status = "INFO";
        }

        return {
            id: product.id,
            name: product.name,
            brand: product.brand,
            imageUrl: product.imageUrl,
            currentStockWeight: product.stockWeight,
            weightSold30d,
            avgDailyWeightSales: Number(avgDailyWeightSales.toFixed(2)),
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
            stockWeight: { gt: 0 } // Only care if we actually have it in stock
        },
        select: {
            id: true,
            name: true,
            brand: true,
            imageUrl: true,
            stockWeight: true,
            basePrice: true,
            createdAt: true
        }
    });

    return deadProducts.map(p => {
        const valueTieUp = Number(p.basePrice) * (p.stockWeight / 100); // Rough estimate based on base price per 100g
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
                include: { product: { select: { basePrice: true } } }
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
    let overallCost = 0; // Since costPrice is missing, we'll estimate cost as 70% of basePrice for analytics purposes if needed, or just track revenue

    validOrders.forEach(order => {
        const dStr = order.createdAt.toISOString().split('T')[0];

        let orderRevenue = Number(order.totalPrice);
        let orderCost = 0;

        order.items.forEach(item => {
            // Placeholder: Estimate cost as 70% of price if costPrice is missing from schema
            orderCost += (Number(item.price) * 0.7) * item.quantity;
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
        include: { product: { select: { id: true, name: true, imageUrl: true, basePrice: true } } }
    });

    const productsProfit = sales.map(s => {
        const avgSellPrice = s.unitsSold > 0 ? Number(s.revenue) / s.unitsSold : Number(s.product.basePrice);
        const unitProfit = avgSellPrice * 0.3; // Estimating 30% margin
        const totalProfit = unitProfit * s.unitsSold;
        const marginPercent = 30;

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
    const products = await prisma.product.findMany({
        select: { stockWeight: true, lowStockThreshold: true }
    });

    const lowStockCount = products.filter(p => p.stockWeight <= p.lowStockThreshold).length;
    score -= (lowStockCount * 2); // 2 points per low stock item

    // Dead stock penalty
    const deadStock = await getDeadStock();
    score -= (deadStock.length * 5); // 5 points per dead stock item

    // OOS penalty
    const oosCount = products.filter(p => p.stockWeight === 0).length;
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

    const warningRestock = restock.filter(r => r.status === "WARNING" && r.currentStockWeight > 0);
    if (warningRestock.length > 0) {
        alerts.push({ type: "INFO", message: `${warningRestock.length} products are running low and will stock out within 7 days.` });
    }

    const deadStock = await getDeadStock();
    if (deadStock.length > 0) {
        alerts.push({ type: "INFO", message: `${deadStock.length} products have seen zero sales in 60+ days.` });
    }

    return alerts;
};

