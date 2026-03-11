import { requireCustomerSession } from "@/lib/customer-auth";
import { getOrdersByCustomer, countOrdersByCustomer } from "@/services/order-service";
import {
    ShoppingBag,
    Calendar,
    Hash,
    CreditCard,
    ChevronRight,
    Clock,
    CheckCircle2,
    Truck,
    XCircle,
    Package,
    ArrowLeft,
    ArrowRight,
    ChevronLeft
} from "lucide-react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";

export const dynamic = "force-dynamic";

const getStatusStyles = (status: string) => {
    switch (status) {
        case "DELIVERED":
            return "bg-emerald-50 text-emerald-600 border-emerald-100";
        case "CANCELLED":
            return "bg-red-50 text-red-600 border-red-100";
        case "SHIPPED":
            return "bg-blue-50 text-blue-600 border-blue-100";
        case "PACKED":
        case "CONFIRMED":
            return "bg-indigo-50 text-indigo-600 border-indigo-100";
        default:
            return "bg-amber-50 text-amber-600 border-amber-100";
    }
};

const getStatusIcon = (status: string) => {
    switch (status) {
        case "DELIVERED": return CheckCircle2;
        case "SHIPPED": return Truck;
        case "CANCELLED": return XCircle;
        case "PACKED": return Package;
        default: return Clock;
    }
};

interface PageProps {
    params: Promise<{ locale: string }>;
    searchParams: Promise<{ page?: string }>;
}

export default async function OrderHistoryPage({ params, searchParams }: PageProps) {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: "account" });
    const com = await getTranslations({ locale, namespace: "common" });
    const customer = await requireCustomerSession();
    const resolvedSearchParams = await searchParams;
    const page = parseInt(resolvedSearchParams.page || "1");
    const limit = 10;
    const skip = (page - 1) * limit;

    const [orders, totalOrders] = await Promise.all([
        getOrdersByCustomer(customer.id, limit, skip),
        countOrdersByCustomer(customer.id)
    ]);

    const totalPages = Math.ceil(totalOrders / limit);

    return (
        <div className={`max-w-7xl mx-auto px-6 pt-32 pb-20 ${locale === 'ar' ? 'rtl' : 'ltr'}`}>
            <div className={`flex items-center gap-4 mb-10 ${locale === 'ar' ? 'flex-row-reverse' : ''}`}>
                <Link
                    href={`/${locale}/account`}
                    className="w-10 h-10 rounded-full border border-gray-100 flex items-center justify-center text-gray-400 hover:text-primary hover:border-primary/20 transition-all"
                >
                    {locale === "ar" ? <ChevronLeft className="w-5 h-5 rotate-180" /> : <ChevronLeft className="w-5 h-5" />}
                </Link>
                <div className={locale === 'ar' ? 'text-right' : 'text-left'}>
                    <h1 className="text-3xl font-serif font-bold text-primary-dark">{t("order_history")}</h1>
                    <p className="text-sm text-gray-500 mt-1">{t("order_history_subtitle")}</p>
                </div>
            </div>

            {orders.length === 0 ? (
                <div className="bg-white rounded-3xl border border-gray-100 p-20 text-center shadow-sm">
                    <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6 text-gray-200">
                        <ShoppingBag className="w-10 h-10" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 mb-2">{t("no_orders_found")}</h2>
                    <p className="text-gray-500 mb-8 max-w-sm mx-auto">{t("no_orders_hint")}</p>
                    <Link href={`/${locale}/catalog`} className="bg-primary text-white px-8 py-3 rounded-full font-bold hover:bg-primary-dark transition-all shadow-lg shadow-primary/20">
                        {t("start_shopping")}
                    </Link>
                </div>
            ) : (
                <div className="space-y-8">
                    {/* Desktop View Table */}
                    <div className="hidden md:block bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                        <table className={`w-full ${locale === 'ar' ? 'text-right' : 'text-left'}`}>
                            <thead>
                                <tr className="bg-gray-50/50 border-b border-gray-100">
                                    <th className={`px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 ${locale === 'ar' ? 'text-right' : 'text-left'}`}>{t("order_id_label")}</th>
                                    <th className={`px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 ${locale === 'ar' ? 'text-right' : 'text-left'}`}>{t("date_label")}</th>
                                    <th className={`px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 ${locale === 'ar' ? 'text-right' : 'text-left'}`}>{t("status_label")}</th>
                                    <th className={`px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 ${locale === 'ar' ? 'text-left' : 'text-right'}`}>{t("total_amount_label")}</th>
                                    <th className={`px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 ${locale === 'ar' ? 'text-left' : 'text-right'}`}>{t("action_label")}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {orders.map((order) => {
                                    const StatusIcon = getStatusIcon(order.status);
                                    return (
                                        <tr key={order.id} className="hover:bg-gray-50/50 transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className={`flex items-center gap-2 ${locale === 'ar' ? 'flex-row-reverse' : ''}`}>
                                                    <Hash className="w-3 h-3 text-gray-300" />
                                                    <span className="text-sm font-bold text-gray-900 uppercase">
                                                        {order.id.slice(-8)}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className={`flex items-center gap-2 text-gray-500 ${locale === 'ar' ? 'flex-row-reverse' : ''}`}>
                                                    <Calendar className="w-4 h-4" />
                                                    <span className="text-sm">
                                                        {new Date(order.createdAt).toLocaleDateString(locale === 'ar' ? 'ar-DZ' : 'en-GB', {
                                                            day: "2-digit",
                                                            month: "short",
                                                            year: "numeric"
                                                        })}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[10px] font-black uppercase tracking-widest ${getStatusStyles(order.status)} ${locale === 'ar' ? 'flex-row-reverse' : ''}`}>
                                                    <StatusIcon className="w-3 h-3" />
                                                    {order.status}
                                                </div>
                                            </td>
                                            <td className={`px-6 py-4 ${locale === 'ar' ? 'text-left' : 'text-right'}`}>
                                                <div className={`flex items-center gap-2 text-gray-900 font-bold ${locale === 'ar' ? 'flex-row-reverse justify-start' : 'justify-end'}`}>
                                                    <span className="text-sm">{Number(order.totalPrice).toLocaleString(locale === 'ar' ? 'ar-DZ' : 'fr-FR')}</span>
                                                    <span className="text-[10px] text-gray-400">{com("labels.currency")}</span>
                                                </div>
                                            </td>
                                            <td className={`px-6 py-4 ${locale === 'ar' ? 'text-left' : 'text-right'}`}>
                                                <Link
                                                    href={`/${locale}/account/orders/${order.id}`}
                                                    className={`inline-flex items-center gap-1 text-xs font-bold text-primary hover:text-primary-dark transition-colors ${locale === 'ar' ? 'flex-row-reverse' : ''}`}
                                                >
                                                    {t("details_label")}
                                                    {locale === "ar" ? <ChevronRight className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform rotate-180" /> : <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />}
                                                </Link>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile View List */}
                    <div className="md:hidden space-y-4">
                        {orders.map((order) => {
                            const StatusIcon = getStatusIcon(order.status);
                            return (
                                <Link
                                    key={order.id}
                                    href={`/${locale}/account/orders/${order.id}`}
                                    className={`block bg-white p-5 rounded-2xl border border-gray-100 shadow-sm active:scale-[0.98] transition-all ${locale === 'ar' ? 'text-right' : 'text-left'}`}
                                >
                                    <div className={`flex items-center justify-between mb-4 ${locale === 'ar' ? 'flex-row-reverse' : ''}`}>
                                        <div className={`flex items-center gap-2 ${locale === 'ar' ? 'flex-row-reverse' : ''}`}>
                                            <span className="text-xs font-black text-gray-300 uppercase">#{order.id.slice(-6)}</span>
                                            <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full border text-[9px] font-black uppercase tracking-widest ${getStatusStyles(order.status)} ${locale === 'ar' ? 'flex-row-reverse' : ''}`}>
                                                <StatusIcon className="w-2.5 h-2.5" />
                                                {order.status}
                                            </div>
                                        </div>
                                        <p className="text-xs text-gray-400 font-medium">
                                            {new Date(order.createdAt).toLocaleDateString(locale === 'ar' ? 'ar-DZ' : 'fr-FR')}
                                        </p>
                                    </div>
                                    <div className={`flex items-end justify-between ${locale === 'ar' ? 'flex-row-reverse' : ''}`}>
                                        <div className={locale === 'ar' ? 'text-right' : 'text-left'}>
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{t("total_amount_label")}</p>
                                            <p className={`text-lg font-bold text-gray-900 ${locale === 'ar' ? 'flex flex-row-reverse gap-1' : ''}`}>
                                                <span>{Number(order.totalPrice).toLocaleString(locale === 'ar' ? 'ar-DZ' : 'fr-FR')}</span>
                                                <span className="text-xs font-normal text-gray-400">{com("labels.currency")}</span>
                                            </p>
                                        </div>
                                        <div className={`flex items-center gap-1 text-xs font-bold text-primary ${locale === 'ar' ? 'flex-row-reverse' : ''}`}>
                                            {t("manage_label")}
                                            {locale === "ar" ? <ChevronRight className="w-4 h-4 rotate-180" /> : <ChevronRight className="w-4 h-4" />}
                                        </div>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className={`flex items-center justify-between pt-6 border-t border-gray-100 ${locale === 'ar' ? 'flex-row-reverse' : ''}`}>
                            <p className="text-xs text-gray-500 font-medium">
                                {t("pagination_showing", {
                                    start: skip + 1,
                                    end: Math.min(skip + limit, totalOrders),
                                    total: totalOrders
                                })}
                            </p>
                            <div className={`flex items-center gap-2 ${locale === 'ar' ? 'flex-row-reverse' : ''}`}>
                                <Link
                                    href={`/${locale}/account/orders?page=${page - 1}`}
                                    className={`w-10 h-10 rounded-xl border border-gray-100 flex items-center justify-center transition-all ${page <= 1 ? "opacity-30 pointer-events-none" : "hover:bg-gray-50 hover:border-gray-200 active:scale-95"}`}
                                >
                                    {locale === "ar" ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
                                </Link>
                                <div className={`flex items-center gap-1 ${locale === 'ar' ? 'flex-row-reverse' : ''}`}>
                                    {[...Array(totalPages)].map((_, i) => (
                                        <Link
                                            key={i}
                                            href={`/${locale}/account/orders?page=${i + 1}`}
                                            className={`w-10 h-10 rounded-xl flex items-center justify-center text-xs font-bold transition-all ${page === i + 1 ? "bg-primary text-white shadow-lg shadow-primary/20" : "hover:bg-gray-50 text-gray-500"}`}
                                        >
                                            {i + 1}
                                        </Link>
                                    ))}
                                </div>
                                <Link
                                    href={`/${locale}/account/orders?page=${page + 1}`}
                                    className={`w-10 h-10 rounded-xl border border-gray-100 flex items-center justify-center transition-all ${page >= totalPages ? "opacity-30 pointer-events-none" : "hover:bg-gray-50 hover:border-gray-200 active:scale-95"}`}
                                >
                                    {locale === "ar" ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
                                </Link>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
