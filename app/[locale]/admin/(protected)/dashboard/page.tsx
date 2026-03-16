import { supabaseAdmin } from "@/lib/supabase-admin";
import { DollarSign, Package, Users, ShoppingCart, Clock, Trophy, AlertTriangle, Bell, Activity } from "lucide-react";
import { getInventoryHealthScore } from "@/services/intelligence-service";
import SafeImage from "@/components/SafeImage";
import Link from "next/link";
import RealtimeReloader from "@/components/admin/RealtimeReloader";
import ResetProfitButton from "@/components/admin/ResetProfitButton";
import { getTranslations } from "next-intl/server";

export const dynamic = "force-dynamic";

export default async function AdminDashboard({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: "admin.dashboard" });
    const tc = await getTranslations({ locale, namespace: "common" });
    const ts = await getTranslations({ locale, namespace: "common.status" });
    
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    let productsCount: number = 0, 
        customersCount: number = 0, 
        unreadNotifications: number = 0, 
        inventoryHealthScore: number = 0;
    
    let allOrders: any[] = [];
    let productsList: any[] = [];

    try {
        const [
            { count: pCount },
            { data: pData },
            { count: cCount },
            { data: oData },
            { count: nCount },
            healthScore
        ] = await Promise.all([
            supabaseAdmin.from("products").select("id", { count: 'exact', head: true }),
            supabaseAdmin.from("products").select("*").limit(500),
            supabaseAdmin.from("customers").select("id", { count: 'exact', head: true }),
            supabaseAdmin.from("orders").select("*, customers(shop_name, name)").order("created_at", { ascending: false }).limit(200),
            supabaseAdmin.from("notifications").select("id", { count: 'exact', head: true }).eq("is_read", false),
            getInventoryHealthScore(),
        ]);

        productsCount = pCount || 0;
        productsList = pData || [];
        customersCount = cCount || 0;
        allOrders = oData || [];
        unreadNotifications = nCount || 0;
        inventoryHealthScore = healthScore;

    } catch (err) {
        console.error("Dashboard data fetch error:", err);
        return (
            <div className="p-8 text-center bg-white rounded-3xl border border-red-100 shadow-sm">
                <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <h2 className="text-xl font-bold text-gray-900 mb-2">Impossible de charger le tableau de bord</h2>
                <p className="text-gray-500 mb-6">Une erreur s'est produite lors de la récupération des données.</p>
                <Link href={`/${locale}/admin/dashboard`} className="px-6 py-2 bg-primary text-white rounded-xl hover:bg-primary-dark transition-colors">
                    Actualiser
                </Link>
            </div>
        );
    }

    const totalOrders = allOrders.length;
    const pendingOrders = allOrders.filter((o: any) => o.status === "PENDING").length;
    const nonCancelled = allOrders.filter((o: any) => o.status !== "CANCELLED");

    const revenue = nonCancelled.reduce((sum: number, o: any) => sum + Number(o.total_price || 0), 0);
    const unpaidBalance = nonCancelled
        .filter((o: any) => o.payment_status === "UNPAID" || o.payment_status === "PARTIALLY_PAID")
        .reduce((sum: number, o: any) => sum + (Number(o.total_price || 0) - Number(o.amount_paid || 0)), 0);
    
    const partiallyPaidCount = allOrders.filter((o: any) => o.payment_status === "PARTIALLY_PAID").length;

    const dailyRevenue = nonCancelled
        .filter((o: any) => o.created_at >= startOfDay)
        .reduce((sum: number, o: any) => sum + Number(o.total_price || 0), 0);

    const monthlyRevenue = nonCancelled
        .filter((o: any) => o.created_at >= startOfMonth)
        .reduce((sum: number, o: any) => sum + Number(o.total_price || 0), 0);

    const lowStockProducts = productsList.filter((p: any) => {
        return (Number(p.stock_weight || 0) <= Number(p.low_stock_threshold || 500)) && (Number(p.stock_weight || 0) > 0);
    }).length;

    const totalCost = productsList.reduce((sum: number, p: any) => sum + (Number(p.purchase_price || 0) * Number(p.sales_units_sold || 0)), 0);
    const totalProfit = revenue - totalCost;
    const profitMargin = revenue > 0 ? (totalProfit / revenue) * 100 : 0;

    const stockForecast = productsList
        .filter((p: any) => Number(p.sales_units_sold || 0) > 0 && Number(p.stock_weight || 0) > 0)
        .map((p: any) => {
            const dailyVelocity = Number(p.sales_units_sold) / 30; // 30-day average assumption
            // Simplification: Assume average unit is 100g if not specified
            const unitsLeft = Number(p.stock_weight) / 100; 
            const daysLeft = Math.round(unitsLeft / (dailyVelocity || 0.1));
            return { ...p, daysLeft };
        })
        .filter(p => p.daysLeft < 14)
        .sort((a, b) => a.daysLeft - b.daysLeft)
        .slice(0, 5);

    const bestSellers = productsList
        .filter((p: any) => Number(p.sales_units_sold || 0) > 0)
        .sort((a: any, b: any) => Number(b.sales_units_sold) - Number(a.sales_units_sold))
        .slice(0, 5)
        .map((p: any) => ({
            id: p.id,
            unitsSold: Number(p.sales_units_sold),
            revenue: Number(p.sales_revenue),
            profit: (Number(p.base_price) - Number(p.purchase_price || 0)) * Number(p.sales_units_sold),
            product: { 
                id: p.id, 
                name: p.name, 
                imageUrl: p.image_url, 
            }
        }));

    const recentOrders = allOrders.slice(0, 5).map((o: any) => ({
        ...o,
        totalPrice: Number(o.total_price),
        paymentStatus: o.payment_status,
        createdAt: new Date(o.created_at),
        customer: {
            shopName: o.customers?.shop_name || "Unknown",
            name: o.customers?.name || ""
        }
    }));

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat(locale === "ar" ? "ar-DZ" : "fr-FR", {
            style: "currency",
            currency: "DZD"
        }).format(amount).replace("DZD", "DA").replace("د.ج.‏", "د.ج");
    };

    const formatDate = (date: Date) => {
        return new Intl.DateTimeFormat(locale === "ar" ? "ar-DZ" : "fr-FR", { dateStyle: "medium", timeStyle: "short" }).format(date);
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case "PENDING": return "bg-amber-100 text-amber-700 border-amber-200";
            case "CONFIRMED": return "bg-blue-100 text-blue-700 border-blue-200";
            case "PROCESSING": return "bg-indigo-100 text-indigo-700 border-indigo-200";
            case "SHIPPED": return "bg-purple-100 text-purple-700 border-purple-200";
            case "DELIVERED": return "bg-emerald-100 text-emerald-700 border-emerald-200";
            case "CANCELLED": return "bg-red-100 text-red-700 border-red-200";
            default: return "bg-gray-100 text-gray-700 border-gray-200";
        }
    };

    const getPaymentStatusColor = (status: string) => {
        switch (status) {
            case "PAID": return "bg-emerald-100 text-emerald-700 border-emerald-200";
            case "PARTIALLY_PAID": return "bg-amber-100 text-amber-700 border-amber-200";
            case "UNPAID": return "bg-red-100 text-red-700 border-red-200";
            default: return "bg-gray-100 text-gray-700 border-gray-200";
        }
    };

    return (
        <div className={`space-y-8 animate-in fade-in duration-500 ${locale === 'ar' ? 'rtl' : 'ltr'}`}>
            <div>
                <h1 className="text-3xl font-serif font-bold text-primary-dark tracking-tight">{t("title")}</h1>
                <p className="text-gray-500 mt-1 tracking-wide">{t("subtitle")}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
                <div className="bg-white p-6 rounded-2xl border border-primary/10 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform duration-300">
                        <DollarSign className="w-16 h-16 text-[#D4AF37]" strokeWidth={1} />
                    </div>
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                            <DollarSign className="w-5 h-5" />
                        </div>
                        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider relative z-10">{t("total_revenue")}</h3>
                    </div>
                    <p className="text-2xl font-bold text-primary-dark relative z-10">{formatCurrency(revenue)}</p>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-primary/10 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform duration-300">
                        <AlertTriangle className="w-16 h-16 text-red-500" strokeWidth={1} />
                    </div>
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-red-50 text-red-600 rounded-xl">
                            <AlertTriangle className="w-5 h-5" />
                        </div>
                        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider relative z-10">{t("unpaid_balance")}</h3>
                    </div>
                    <p className="text-2xl font-bold text-red-600 relative z-10">{formatCurrency(unpaidBalance)}</p>
                    <p className="text-xs text-gray-400 mt-2 font-medium">{t("unpaid_note", { count: partiallyPaidCount })}</p>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-primary/10 shadow-sm relative overflow-hidden group">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                            <Activity className="w-5 h-5" />
                        </div>
                        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider relative z-10">{t("daily_revenue")}</h3>
                    </div>
                    <p className="text-2xl font-bold text-primary-dark relative z-10">{formatCurrency(dailyRevenue)}</p>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-primary/10 shadow-sm relative overflow-hidden group">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
                            <Activity className="w-5 h-5" />
                        </div>
                        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider relative z-10">{t("monthly_revenue")}</h3>
                    </div>
                    <p className="text-2xl font-bold text-primary-dark relative z-10">{formatCurrency(monthlyRevenue)}</p>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-emerald-100 shadow-sm relative overflow-hidden group">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                            <Trophy className="w-5 h-5" />
                        </div>
                        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider relative z-10">{t("total_profit")}</h3>
                    </div>
                    <p className="text-2xl font-bold text-emerald-600 relative z-10">{formatCurrency(totalProfit)}</p>
                    <div className="flex items-center justify-between mt-2">
                        <p className="text-xs text-gray-400 font-medium">{t("avg_margin")}: {profitMargin.toFixed(1)}%</p>
                        <ResetProfitButton />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
                <div className="bg-white p-6 rounded-2xl border border-primary/10 shadow-sm relative overflow-hidden group flex flex-col justify-between">
                    <div className="flex items-center gap-4 mb-4">
                        <div className={`p-3 rounded-xl ${inventoryHealthScore >= 90 ? "bg-emerald-50 text-emerald-600" :
                            inventoryHealthScore >= 70 ? "bg-amber-50 text-amber-600" :
                                "bg-red-50 text-red-600"
                            }`}>
                            <Activity className="w-5 h-5" />
                        </div>
                        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider relative z-10">{t("health_score")}</h3>
                    </div>
                    <p className={`text-2xl font-bold font-serif relative z-10 ${inventoryHealthScore >= 90 ? "text-emerald-600" :
                        inventoryHealthScore >= 70 ? "text-amber-600" :
                            "text-red-600"
                        }`}>
                        {inventoryHealthScore}%
                    </p>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-primary/10 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform duration-300">
                        <ShoppingCart className="w-16 h-16 text-[#D4AF37]" strokeWidth={1} />
                    </div>
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                            <ShoppingCart className="w-5 h-5" />
                        </div>
                        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider relative z-10">{t("total_orders")}</h3>
                    </div>
                    <p className="text-2xl font-bold text-primary-dark relative z-10">{totalOrders}</p>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-primary/10 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform duration-300">
                        <Clock className="w-16 h-16 text-[#D4AF37]" strokeWidth={1} />
                    </div>
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
                            <Clock className="w-5 h-5" />
                        </div>
                        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider relative z-10">{t("pending")}</h3>
                    </div>
                    <p className="text-2xl font-bold text-primary-dark relative z-10">{pendingOrders}</p>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-primary/10 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform duration-300">
                        <Users className="w-16 h-16 text-[#D4AF37]" strokeWidth={1} />
                    </div>
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
                            <Users className="w-5 h-5" />
                        </div>
                        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider relative z-10">{t("customers")}</h3>
                    </div>
                    <p className="text-2xl font-bold text-primary-dark relative z-10">{customersCount}</p>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-primary/10 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform duration-300">
                        <Package className="w-16 h-16 text-[#D4AF37]" strokeWidth={1} />
                    </div>
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
                            <Package className="w-5 h-5" />
                        </div>
                        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider relative z-10">{t("products")}</h3>
                    </div>
                    <p className="text-2xl font-bold text-primary-dark relative z-10">{productsCount}</p>
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-primary/10 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                    <h2 className="text-lg font-bold text-primary-dark">{t("recent_orders")}</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-gray-500 uppercase tracking-wider bg-gray-50/50">
                            <tr>
                                <th className="px-6 py-4 font-medium">{t("order_id")}</th>
                                <th className="px-6 py-4 font-medium">{t("customer")}</th>
                                <th className="px-6 py-4 font-medium">{t("date")}</th>
                                <th className="px-6 py-4 font-medium">{t("total")}</th>
                                <th className="px-6 py-4 font-medium">{t("payment")}</th>
                                <th className="px-6 py-4 font-medium">{t("status")}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {recentOrders.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                                        {t("no_orders")}
                                    </td>
                                </tr>
                            ) : (
                                recentOrders.map((order) => (
                                    <tr key={order.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-4 font-mono text-xs font-medium text-gray-600">
                                            #{order.id.slice(0, 8).toUpperCase()}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-gray-900">{order.customer.shopName}</div>
                                            <div className="text-xs text-gray-500">{order.customer.name}</div>
                                        </td>
                                        <td className="px-6 py-4 text-gray-500 whitespace-nowrap">
                                            {formatDate(order.createdAt)}
                                        </td>
                                        <td className="px-6 py-4 font-medium text-gray-900">
                                            {formatCurrency(Number(order.totalPrice))}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-3 py-1 text-[10px] font-bold rounded-full border ${getPaymentStatusColor(order.paymentStatus)}`}>
                                                {ts(order.paymentStatus)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-3 py-1 text-[10px] font-bold rounded-full border ${getStatusColor(order.status)}`}>
                                                {ts(order.status)}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {(unreadNotifications > 0 || lowStockProducts > 0) && (
                <div className="flex gap-4">
                    {unreadNotifications > 0 && (
                        <Link href={`/${locale}/admin/notifications`} prefetch={true} className="flex items-center gap-2 px-4 py-2.5 bg-blue-50 border border-blue-100 rounded-xl hover:bg-blue-100 transition-colors">
                            <Bell className="w-4 h-4 text-blue-600" />
                            <span className="text-sm font-semibold text-blue-700">{t("notifications.unread", { count: unreadNotifications })}</span>
                        </Link>
                    )}
                    {lowStockProducts > 0 && (
                        <Link href={`/${locale}/admin/inventory`} prefetch={true} className="flex items-center gap-2 px-4 py-2.5 bg-amber-50 border border-amber-100 rounded-xl hover:bg-amber-100 transition-colors">
                            <AlertTriangle className="w-4 h-4 text-amber-600" />
                            <span className="text-sm font-semibold text-amber-700">{t("inventory_alerts.low_stock", { count: lowStockProducts })}</span>
                        </Link>
                    )}
                </div>
            )}

            {bestSellers.length > 0 && (
                <div className="bg-white rounded-2xl border border-primary/10 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-gray-100 flex items-center gap-3">
                        <Trophy className="w-5 h-5 text-[#D4AF37]" />
                        <h2 className="text-lg font-bold text-primary-dark">{t("best_sellers")}</h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-gray-500 uppercase tracking-wider bg-gray-50/50">
                                <tr>
                                    <th className="px-6 py-4 font-medium">#</th>
                                    <th className="px-6 py-4 font-medium">{t("products")}</th>
                                    <th className="px-6 py-4 font-medium">{t("units_sold")}</th>
                                    <th className="px-6 py-4 font-medium">{t("revenue")}</th>
                                    <th className="px-6 py-4 font-medium">{t("profit")}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {bestSellers.map((sale: any, index: number) => (
                                    <tr key={sale.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${index === 0 ? 'bg-[#D4AF37]/20 text-[#D4AF37]' :
                                                index === 1 ? 'bg-gray-200 text-gray-600' :
                                                    index === 2 ? 'bg-amber-100 text-amber-700' :
                                                        'bg-gray-100 text-gray-500'
                                                }`}>
                                                {index + 1}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg overflow-hidden bg-gray-100 relative shrink-0">
                                                    <SafeImage src={sale.product.imageUrl} alt={sale.product.name} fill className="object-cover" />
                                                </div>
                                                <div className="font-medium text-gray-900">{sale.product.name}</div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 font-semibold text-primary-dark">{sale.unitsSold}</td>
                                        <td className="px-6 py-4 font-semibold text-emerald-600">{formatCurrency(Number(sale.revenue))}</td>
                                        <td className="px-6 py-4 font-semibold text-indigo-600">{formatCurrency(Number(sale.profit))}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {stockForecast.length > 0 && (
                <div className="bg-white rounded-2xl border border-red-100 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-gray-100 flex items-center gap-3">
                        <Clock className="w-5 h-5 text-red-500" />
                        <h2 className="text-lg font-bold text-gray-900">{t("stock_forecast.title")}</h2>
                        <span className="px-2 py-0.5 bg-red-50 text-red-600 text-[10px] font-bold rounded-full uppercase">{t("stock_forecast.action")}</span>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-gray-500 uppercase tracking-wider bg-gray-50/50">
                                <tr>
                                    <th className="px-6 py-4 font-medium">{t("stock_forecast.table.product")}</th>
                                    <th className="px-6 py-4 font-medium">{t("stock_forecast.table.current")}</th>
                                    <th className="px-6 py-4 font-medium">{t("stock_forecast.table.forecast")}</th>
                                    <th className="px-6 py-4 font-medium text-right">{t("status")}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {stockForecast.map((p: any) => (
                                    <tr key={p.id} className="hover:bg-red-50/20 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-gray-900">{p.name}</div>
                                        </td>
                                        <td className="px-6 py-4 font-medium text-gray-700">
                                            {p.stock_weight >= 1000 ? `${(p.stock_weight / 1000).toFixed(1)}kg` : `${p.stock_weight}g`}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <span className={`font-bold ${p.daysLeft < 3 ? 'text-red-600' : 'text-amber-600'}`}>
                                                    {t("stock_forecast.days_remaining", { count: p.daysLeft })}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${p.daysLeft < 3 ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'}`}>
                                                {p.daysLeft < 3 ? t("stock_forecast.critical") : t("stock_forecast.restock")}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
            <RealtimeReloader />
        </div>
    );
}
