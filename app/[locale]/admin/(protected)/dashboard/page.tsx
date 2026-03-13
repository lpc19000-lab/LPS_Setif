import { adminDb } from "@/lib/firebase-admin";
import { QueryDocumentSnapshot, DocumentData } from "firebase-admin/firestore";
import { DollarSign, Package, Users, ShoppingCart, Clock, Trophy, AlertTriangle, Bell, Activity } from "lucide-react";
import { getInventoryHealthScore } from "@/services/intelligence-service";
import SafeImage from "@/components/SafeImage";
import Link from "next/link";
import RealtimeReloader from "@/components/admin/RealtimeReloader";
import { getTranslations } from "next-intl/server";

export const dynamic = "force-dynamic";

export default async function AdminDashboard({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: "admin.dashboard" });
    const tc = await getTranslations({ locale, namespace: "common" });
    const ts = await getTranslations({ locale, namespace: "common.status" });
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // ... (rest of the code)

    // Fetch all data from Firebase
    // Fetch all data from Firebase
    let productsSnap: any, productsCountSnap: any, customersSnap: any, ordersSnap: any, notificationsSnap: any, inventoryHealthScore: number = 0;
    
    try {
        [productsCountSnap, productsSnap, customersSnap, ordersSnap, notificationsSnap, inventoryHealthScore] = await Promise.all([
            adminDb.collection("products").count().get(),
            adminDb.collection("products").limit(500).get(), // Capped for summary analysis
            adminDb.collection("customers").count().get(),
            adminDb.collection("orders").orderBy("createdAt", "desc").limit(100).get(), 
            adminDb.collection("notifications").where("isRead", "==", false).count().get(),
            getInventoryHealthScore(),
        ]);
    } catch (err) {
        console.error("Dashboard data fetch error:", err);
        return (
            <div className="p-8 text-center bg-white rounded-3xl border border-red-100 shadow-sm">
                <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <h2 className="text-xl font-bold text-gray-900 mb-2">Impossible de charger le tableau de bord</h2>
                <p className="text-gray-500 mb-6">Une erreur s'est produite lors de la récupération des données. Veuillez réessayer plus tard.</p>
                <Link href={`/${locale}/admin/dashboard`} className="px-6 py-2 bg-primary text-white rounded-xl hover:bg-primary-dark transition-colors">
                    Actualiser
                </Link>
            </div>
        );
    }

    const totalProducts = productsCountSnap.data().count;
    const totalCustomers = customersSnap.data().count;
    const unreadNotifications = notificationsSnap.data().count;

    // Process orders data
    const allOrders = ordersSnap.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => ({ id: doc.id, ...doc.data() as any }));
    const totalOrders = allOrders.length;
    const pendingOrders = allOrders.filter((o: any) => o.status === "PENDING").length;
    const nonCancelled = allOrders.filter((o: any) => o.status !== "CANCELLED");

    const revenue = nonCancelled.reduce((sum: number, o: any) => sum + Number(o.totalPrice || 0), 0);

    const unpaidOrders = nonCancelled.filter((o: any) => o.paymentStatus === "UNPAID" || o.paymentStatus === "PARTIALLY_PAID");
    const unpaidBalance = unpaidOrders.reduce((sum: number, o: any) => sum + Number(o.totalPrice || 0) - Number(o.amountPaid || 0), 0);
    const partiallyPaidOrders = allOrders.filter((o: any) => o.paymentStatus === "PARTIALLY_PAID").length;

    const dailyRevenue = nonCancelled
        .filter((o: any) => {
            const d = o.createdAt?.toDate ? o.createdAt.toDate() : new Date(o.createdAt);
            return d >= startOfDay;
        })
        .reduce((sum: number, o: any) => sum + Number(o.totalPrice || 0), 0);

    const monthlyRevenue = nonCancelled
        .filter((o: any) => {
            const d = o.createdAt?.toDate ? o.createdAt.toDate() : new Date(o.createdAt);
            return d >= startOfMonth;
        })
        .reduce((sum: number, o: any) => sum + Number(o.totalPrice || 0), 0);

    const lowStockProducts = productsSnap.docs.filter((doc: QueryDocumentSnapshot<DocumentData>) => {
        const d = doc.data();
        return (d.stockWeight || 0) <= (d.lowStockThreshold || 500) && (d.stockWeight || 0) > 0;
    }).length;

    // Best sellers from product sales data
    const bestSellers = productsSnap.docs
        .map((doc: QueryDocumentSnapshot<DocumentData>) => {
            const d = doc.data();
            return {
                id: doc.id,
                unitsSold: d.sales?.unitsSold || 0,
                revenue: d.sales?.revenue || 0,
                product: { id: doc.id, name: d.name, imageUrl: d.imageUrl, category: d.categoryId ? { name: d.categoryName || '' } : null }
            };
        })
        .filter((p: any) => p.unitsSold > 0)
        .sort((a: any, b: any) => b.unitsSold - a.unitsSold)
        .slice(0, 5);

    // Recent orders
    const recentOrders = await Promise.all(
        allOrders
            .sort((a: any, b: any) => {
                const aTime = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : new Date(a.createdAt).getTime();
                const bTime = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : new Date(b.createdAt).getTime();
                return bTime - aTime;
            })
            .slice(0, 5)
            .map(async (order: any) => {
                let customer = { shopName: "Unknown", name: "" };
                if (order.customerId) {
                    const custDoc = await adminDb.collection("customers").doc(order.customerId).get();
                    if (custDoc.exists) customer = custDoc.data() as any;
                }
                return {
                    ...order,
                    createdAt: order.createdAt?.toDate ? order.createdAt.toDate() : new Date(order.createdAt),
                    customer,
                };
            })
    );

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

            {/* Financial Overview Grid (Phase 6) */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Total Revenue */}
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

                {/* Unpaid Balance */}
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
                    <p className="text-xs text-gray-400 mt-2 font-medium">{t("unpaid_note", { count: partiallyPaidOrders })}</p>
                </div>

                {/* Daily Revenue */}
                <div className="bg-white p-6 rounded-2xl border border-primary/10 shadow-sm relative overflow-hidden group">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                            <Activity className="w-5 h-5" />
                        </div>
                        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider relative z-10">{t("daily_revenue")}</h3>
                    </div>
                    <p className="text-2xl font-bold text-primary-dark relative z-10">{formatCurrency(dailyRevenue)}</p>
                </div>

                {/* Monthly Revenue */}
                <div className="bg-white p-6 rounded-2xl border border-primary/10 shadow-sm relative overflow-hidden group">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
                            <Activity className="w-5 h-5" />
                        </div>
                        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider relative z-10">{t("monthly_revenue")}</h3>
                    </div>
                    <p className="text-2xl font-bold text-primary-dark relative z-10">{formatCurrency(monthlyRevenue)}</p>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
                {/* Inventory Health Score */}
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

                {/* Orders */}
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

                {/* Pending Orders */}
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

                {/* Customers */}
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
                    <p className="text-2xl font-bold text-primary-dark relative z-10">{totalCustomers}</p>
                </div>

                {/* Products */}
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
                    <p className="text-2xl font-bold text-primary-dark relative z-10">{totalProducts}</p>
                </div>
            </div>

            {/* Recent Orders Table */}
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

            {/* Alert Badges */}
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

            {/* Best Sellers */}
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
                                    <th className="px-6 py-4 font-medium">{tc("nav.categories") || "Category"}</th>
                                    <th className="px-6 py-4 font-medium">{t("units_sold")}</th>
                                    <th className="px-6 py-4 font-medium">{t("revenue")}</th>
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
                                        <td className="px-6 py-4 text-gray-500">{sale.product.category?.name}</td>
                                        <td className="px-6 py-4 font-semibold text-primary-dark">{sale.unitsSold}</td>
                                        <td className="px-6 py-4 font-semibold text-emerald-600">{formatCurrency(Number(sale.revenue))}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
