import { adminDb } from "@/lib/firebase-admin";
import { QueryDocumentSnapshot, DocumentData } from "firebase-admin/firestore";

// ── SMART RESTOCK SYSTEM ──────────────────────────────────────────────────
export const getRestockSuggestions = async () => {
    const productsQuery = await adminDb.collection("products").get();
    const products = productsQuery.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => ({ id: doc.id, ...doc.data() as any }));

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentOrdersQuery = await adminDb.collection("orders")
        .where("createdAt", ">=", thirtyDaysAgo)
        .where("status", "!=", "CANCELLED")
        .get();

    const recentDemandMap = new Map<string, number>();
    recentOrdersQuery.docs.forEach((doc: QueryDocumentSnapshot<DocumentData>) => {
        const order = doc.data() as any;
        if (order.items && Array.isArray(order.items)) {
            order.items.forEach((item: any) => {
                // Approximate weight since we don't eager load volume here
                // We could derive weight from quantity * 100 for now if volume is missing
                const weight = item.volume?.weight || 100; // default 100g 
                const totalWeight = (item.quantity || 0) * weight;
                recentDemandMap.set(item.productId, (recentDemandMap.get(item.productId) || 0) + totalWeight);
            });
        }
    });

    return products.map((product: any) => {
        const weightSold30d = recentDemandMap.get(product.id) || 0;
        const avgDailyWeightSales = weightSold30d / 30;

        const currentStock = product.stockWeight || 0;
        const estimatedDaysLeft = avgDailyWeightSales > 0 ? Math.floor(currentStock / avgDailyWeightSales) : 999;

        const lowStockThreshold = product.lowStockThreshold || 500;

        let recommendation = "Healthy";
        let status = "NORMAL";
        if (currentStock <= lowStockThreshold || estimatedDaysLeft < 7) {
            recommendation = "Restock Soon";
            status = "WARNING";
            if (currentStock === 0) {
                recommendation = "Restock Immediately (OOS)";
                status = "CRITICAL";
            }
        } else if (estimatedDaysLeft > 60 && currentStock > 5000) { 
            recommendation = "Overstock";
            status = "INFO";
        } else if (avgDailyWeightSales === 0 && currentStock > 0) {
            recommendation = "No Recent Sales";
            status = "INFO";
        }

        return {
            id: product.id,
            name: product.name,
            brand: product.brand,
            imageUrl: product.imageUrl,
            currentStockWeight: currentStock,
            weightSold30d,
            avgDailyWeightSales: Number(avgDailyWeightSales.toFixed(2)),
            estimatedDaysLeft,
            recommendation,
            status
        };
    }).sort((a: any, b: any) => a.estimatedDaysLeft - b.estimatedDaysLeft);
};

// ── DEAD STOCK DETECTION ──────────────────────────────────────────────────
export const getDeadStock = async () => {
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

    const recentOrdersQuery = await adminDb.collection("orders")
        .where("createdAt", ">=", sixtyDaysAgo)
        .where("status", "!=", "CANCELLED")
        .get();

    const activeProductIds = new Set<string>();
    recentOrdersQuery.docs.forEach((doc: QueryDocumentSnapshot<DocumentData>) => {
        const order = doc.data() as any;
        if (order.items && Array.isArray(order.items)) {
            order.items.forEach((item: any) => activeProductIds.add(item.productId));
        }
    });

    const productsQuery = await adminDb.collection("products").where("stockWeight", ">", 0).get();
    
    const deadProducts = productsQuery.docs
        .map((doc: QueryDocumentSnapshot<DocumentData>) => ({ id: doc.id, ...doc.data() as any }))
        .filter((p: any) => !activeProductIds.has(p.id));

    return deadProducts.map((p: any) => {
        const basePrice = Number(p.basePrice || 0);
        const stockWeight = p.stockWeight || 0;
        const createdAt = p.createdAt?.toDate ? p.createdAt.toDate() : new Date(p.createdAt || Date.now());
        
        const valueTieUp = basePrice * (stockWeight / 100); 
        return {
            ...p,
            valueTieUp,
            daysSinceAdded: Math.floor((new Date().getTime() - createdAt.getTime()) / (1000 * 3600 * 24))
        };
    }).filter((p: any) => p.daysSinceAdded > 60) 
        .sort((a: any, b: any) => b.valueTieUp - a.valueTieUp);
};

// ── PROFIT ANALYTICS ──────────────────────────────────────────────────────
export const getProfitAnalytics = async () => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const validOrdersQuery = await adminDb.collection("orders")
        .where("status", "!=", "CANCELLED")
        .get();

    const dailyMap = new Map<string, { revenue: number, cost: number, profit: number }>();

    for (let i = 29; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        dailyMap.set(dateStr, { revenue: 0, cost: 0, profit: 0 });
    }

    let overallRevenue = 0;
    let overallCost = 0; 

    // Compute on all orders for global margin
    validOrdersQuery.docs.forEach((doc: QueryDocumentSnapshot<DocumentData>) => {
        const order = doc.data() as any;
        const createdAt = order.createdAt?.toDate ? order.createdAt.toDate() : new Date(order.createdAt);
        const dStr = createdAt.toISOString().split('T')[0];

        let orderRevenue = Number(order.totalPrice || 0);
        let orderCost = 0;

        if (order.items && Array.isArray(order.items)) {
            order.items.forEach((item: any) => {
                orderCost += (Number(item.price || 0) * 0.7) * (item.quantity || 0);
            });
        }

        const orderProfit = orderRevenue - orderCost;

        overallRevenue += orderRevenue;
        overallCost += orderCost;

        if (createdAt >= thirtyDaysAgo) {
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
    const productsQuery = await adminDb.collection("products").get();
    
    const productsProfit = productsQuery.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => {
        const p = doc.data();
        const sales = p.sales || { unitsSold: 0, revenue: 0 };
        
        const avgSellPrice = sales.unitsSold > 0 ? Number(sales.revenue) / sales.unitsSold : Number(p.basePrice || 0);
        const unitProfit = avgSellPrice * 0.3; 
        const totalProfit = unitProfit * sales.unitsSold;
        const marginPercent = 30;

        return {
            id: doc.id,
            name: p.name,
            imageUrl: p.imageUrl,
            totalProfit,
            marginPercent,
            unitsSold: sales.unitsSold
        };
    }).sort((a: any, b: any) => b.totalProfit - a.totalProfit).slice(0, 10);

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

    const productsQuery = await adminDb.collection("products").get();
    const products = productsQuery.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => doc.data());

    const lowStockCount = products.filter((p: any) => (p.stockWeight || 0) <= (p.lowStockThreshold || 500)).length;
    score -= (lowStockCount * 2); 

    const deadStock = await getDeadStock();
    score -= (deadStock.length * 5); 

    const oosCount = products.filter((p: any) => (p.stockWeight || 0) === 0).length;
    score -= (oosCount * 5); 

    return Math.max(0, score);
};

// ── SMART ALERTS ──────────────────────────────────────────────────────────
export const getSmartAlerts = async () => {
    const alerts = [];

    const healthScore = await getInventoryHealthScore();
    if (healthScore < 50) {
        alerts.push({ type: "CRITICAL", message: `Inventory Health Score is critically low (${healthScore}%). Immediate action required.` });
    }

    const restock = await getRestockSuggestions();
    const urgentRestock = restock.filter((r: any) => r.status === "CRITICAL");
    if (urgentRestock.length > 0) {
        alerts.push({ type: "WARNING", message: `${urgentRestock.length} products are out of stock and need immediate restocking.` });
    }

    const warningRestock = restock.filter((r: any) => r.status === "WARNING" && r.currentStockWeight > 0);
    if (warningRestock.length > 0) {
        alerts.push({ type: "INFO", message: `${warningRestock.length} products are running low and will stock out within 7 days.` });
    }

    const deadStock = await getDeadStock();
    if (deadStock.length > 0) {
        alerts.push({ type: "INFO", message: `${deadStock.length} products have seen zero sales in 60+ days.` });
    }

    return alerts;
};

