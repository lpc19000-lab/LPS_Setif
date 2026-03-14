import { supabaseAdmin } from "@/lib/supabase-admin";

// ── SMART RESTOCK SYSTEM ──────────────────────────────────────────────────
export const getRestockSuggestions = async () => {
    const { data: products, error: pError } = await supabaseAdmin
        .from('products')
        .select('*');

    if (pError) throw pError;

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: recentOrders, error: oError } = await supabaseAdmin
        .from('orders')
        .select('order_items(product_id, quantity, volume_data)')
        .neq('status', 'CANCELLED')
        .gte('created_at', thirtyDaysAgo.toISOString());

    if (oError) throw oError;

    const recentDemandMap = new Map<string, number>();
    recentOrders?.forEach((order: any) => {
        order.order_items?.forEach((item: any) => {
            const weight = item.volume_data?.weight || 100;
            const totalWeight = (item.quantity || 0) * weight;
            recentDemandMap.set(item.product_id, (recentDemandMap.get(item.product_id) || 0) + totalWeight);
        });
    });

    return (products || []).map((product: any) => {
        const weightSold30d = recentDemandMap.get(product.id) || 0;
        const avgDailyWeightSales = weightSold30d / 30;

        const currentStock = product.stock_weight || 0;
        const estimatedDaysLeft = avgDailyWeightSales > 0 ? Math.floor(currentStock / avgDailyWeightSales) : 999;

        const lowStockThreshold = 500; // Simplified internal threshold

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
            imageUrl: product.image_url,
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

    const { data: recentOrders, error: oError } = await supabaseAdmin
        .from('orders')
        .select('order_items(product_id)')
        .neq('status', 'CANCELLED')
        .gte('created_at', sixtyDaysAgo.toISOString());

    if (oError) throw oError;

    const activeProductIds = new Set<string>();
    recentOrders?.forEach((order: any) => {
        order.order_items?.forEach((item: any) => activeProductIds.add(item.product_id));
    });

    const { data: products, error: pError } = await supabaseAdmin
        .from('products')
        .select('*')
        .gt('stock_weight', 0);

    if (pError) throw pError;
    
    const deadProducts = (products || [])
        .filter((p: any) => !activeProductIds.has(p.id));

    return deadProducts.map((p: any) => {
        const basePrice = Number(p.base_price || 0);
        const stockWeight = p.stock_weight || 0;
        const createdAt = new Date(p.created_at);
        
        const valueTieUp = basePrice * (stockWeight / 100); 
        return {
            ...p,
            stockWeight: p.stock_weight,
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

    const { data: validOrders, error: oError } = await supabaseAdmin
        .from('orders')
        .select('*, order_items(*)')
        .neq('status', 'CANCELLED');

    if (oError) throw oError;

    const dailyMap = new Map<string, { revenue: number, cost: number, profit: number }>();
    for (let i = 29; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        dailyMap.set(dateStr, { revenue: 0, cost: 0, profit: 0 });
    }

    let overallRevenue = 0;
    let overallCost = 0; 

    validOrders?.forEach((order: any) => {
        const createdAt = new Date(order.created_at);
        const dStr = createdAt.toISOString().split('T')[0];

        let orderRevenue = Number(order.total_price || 0);
        let orderCost = 0;

        order.order_items?.forEach((item: any) => {
            orderCost += (Number(item.price || 0) * 0.7) * (item.quantity || 0);
        });

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

    const { data: products, error: pError } = await supabaseAdmin
        .from('products')
        .select('*')
        .order('sales->revenue', { ascending: false })
        .limit(10);

    if (pError) throw pError;
    
    const productsProfit = (products || []).map((p: any) => {
        const sales = p.sales || { unitsSold: 0, revenue: 0 };
        const avgSellPrice = sales.unitsSold > 0 ? Number(sales.revenue) / sales.unitsSold : Number(p.base_price || 0);
        const unitProfit = avgSellPrice * 0.3; 
        const totalProfit = unitProfit * sales.unitsSold;
        const marginPercent = 30;

        return {
            id: p.id,
            name: p.name,
            imageUrl: p.image_url,
            totalProfit,
            marginPercent,
            unitsSold: sales.unitsSold
        };
    }).sort((a: any, b: any) => b.totalProfit - a.totalProfit);

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
    const { data: products } = await supabaseAdmin.from('products').select('stock_weight');
    if (!products) return 100;

    const lowStockCount = products.filter((p: any) => (p.stock_weight || 0) <= 500).length;
    score -= (lowStockCount * 2); 

    const deadStock = await getDeadStock();
    score -= (deadStock.length * 5); 

    const oosCount = products.filter((p: any) => (p.stock_weight || 0) === 0).length;
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

    const deadStock = await getDeadStock();
    if (deadStock.length > 0) {
        alerts.push({ type: "INFO", message: `${deadStock.length} products have seen zero sales in 60+ days.` });
    }

    return alerts;
};
