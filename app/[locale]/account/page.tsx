import { requireCustomerSession } from "@/lib/customer-auth";
import { getOrdersByCustomer } from "@/services/order-service";
import {
    User,
    Phone,
    MapPin,
    ShoppingBag,
    TrendingUp,
    ArrowRight,
    LogOut,
    ShoppingCart,
    Trash2
} from "lucide-react";
import Link from "next/link";
import LogoutButton from "@/components/shop/LogoutButton";
import RealtimeOrderList from "@/components/shop/RealtimeOrderList";
import { getCart } from "@/services/cart-service";
import SafeImage from "@/components/SafeImage";
import { getTranslations } from "next-intl/server";
import { useTranslations } from "next-intl";

export const dynamic = "force-dynamic";

export default async function AccountPage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    const isRtl = locale === 'ar';
    const t = await getTranslations({ locale, namespace: "account" });
    const com = await getTranslations({ locale, namespace: "common" });
    const customer = await requireCustomerSession();
    const [rawOrders, cart] = await Promise.all([
        getOrdersByCustomer(customer.id),
        getCart(customer.id)
    ]);

    // Serialize Decimal values for Client Components
    const orders = rawOrders.map((order: any) => ({
        ...order,
        totalPrice: Number(order.totalPrice),
        items: (order.items || []).map((item: any) => ({
            ...item,
            price: Number(item.price),
            weight: (item as any).volume?.weight || 0
        }))
    }));

    const enrichedCartItems = (cart?.items || []).map((item: any) => ({
        ...item,
        unitPrice: Number(item.unitPrice),
        lineTotal: Number(item.lineTotal),
        weight: Number(item.weight)
    }));

    const totalSpent = orders
        .filter(o => o.status !== "CANCELLED")
        .reduce((sum, order) => sum + Number(order.totalPrice), 0);

    const stats = [
        { label: t("total_orders"), value: orders.length, icon: ShoppingBag, color: "text-[#2563EB]", bg: "bg-[#2563EB]/10" },
        { label: t("total_spent"), value: `${totalSpent.toLocaleString()} ${com("labels.currency")}`, icon: TrendingUp, color: "text-[#059669]", bg: "bg-[#059669]/10" },
    ];

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className={`flex flex-col md:flex-row md:items-center justify-between gap-6 ${isRtl ? 'md:flex-row-reverse' : ''}`}>
                <div className={isRtl ? 'text-right' : 'text-left'}>
                    <h1 className="text-3xl font-serif font-bold text-primary-dark">{t("trader_account")}</h1>
                    <p className="text-gray-500 mt-1">{t("welcome_back")} {customer.name}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Stats Section */}
                <div className="lg:col-span-12">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {stats.map((stat: any) => (
                            <div key={stat.label} className={`bg-white p-8 rounded-3xl border border-gray-100 shadow-sm flex items-center justify-between group hover:border-primary/20 transition-all ${isRtl ? 'flex-row-reverse' : ''}`}>
                                <div className={isRtl ? 'text-right' : 'text-left'}>
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2">{stat.label}</p>
                                    <p className="text-3xl font-bold text-gray-900 group-hover:text-primary transition-colors">{stat.value}</p>
                                </div>
                                <div className={`w-14 h-14 rounded-2xl ${stat.bg} flex items-center justify-center ${stat.color} group-hover:scale-110 transition-transform`}>
                                    <stat.icon className="w-7 h-7" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Main Content Split */}
                <div className="lg:col-span-4 space-y-8">
                    {/* Profile Card */}
                    <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-[100px] -z-0 transition-all group-hover:scale-110" />
                        
                        <div className={`relative z-10 flex items-center gap-4 mb-8 ${isRtl ? 'flex-row-reverse' : 'flex-row'}`}>
                            <div className="w-16 h-16 rounded-2xl bg-primary-dark text-white flex items-center justify-center text-2xl font-serif font-bold shadow-lg shadow-primary/20">
                                {(customer.name || "?").charAt(0)}
                            </div>
                            <div className={isRtl ? 'text-right' : 'text-left'}>
                                <h2 className="text-xl font-bold text-gray-900">{customer.shopName}</h2>
                                <p className="text-xs font-medium text-primary uppercase tracking-widest">{customer.wilaya}</p>
                            </div>
                        </div>

                        <div className="space-y-6 relative z-10">
                            <div className={`flex items-start gap-4 ${isRtl ? 'flex-row-reverse text-right' : 'text-left'}`}>
                                <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 shrink-0">
                                    <Phone className="w-5 h-5" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{t("phone_number")}</p>
                                    <p className="text-sm font-bold text-gray-900">{customer.phone}</p>
                                </div>
                            </div>

                            <div className={`flex items-start gap-4 ${isRtl ? 'flex-row-reverse text-right' : 'text-left'}`}>
                                <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 shrink-0">
                                    <MapPin className="w-5 h-5" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{t("business_address")}</p>
                                    <p className="text-sm font-bold text-gray-900 leading-relaxed">
                                        {customer.address}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Saved Cart Preview */}
                    {enrichedCartItems.length > 0 && (
                        <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
                            <div className={`flex items-center justify-between mb-8 ${isRtl ? 'flex-row-reverse' : ''}`}>
                                <h3 className={`font-bold text-gray-900 flex items-center gap-3 ${isRtl ? 'flex-row-reverse' : ''}`}>
                                    <ShoppingCart className="w-5 h-5 text-primary" />
                                    {t("saved_cart")}
                                </h3>
                                <span className="text-[10px] font-black bg-gray-100 px-3 py-1 rounded-full uppercase text-gray-400">
                                    {t("items_count", { count: enrichedCartItems.length })}
                                </span>
                            </div>
                            <div className="space-y-4 mb-8">
                                {enrichedCartItems.slice(0, 3).map((item: any) => (
                                    <div key={item.id} className={`flex items-center gap-4 group ${isRtl ? 'flex-row-reverse' : 'flex-row'}`}>
                                        <div className="w-14 h-14 bg-gray-50 rounded-2xl border border-gray-100 p-2 flex-shrink-0 relative overflow-hidden group-hover:border-primary/20 transition-all">
                                            <SafeImage src={item.product.imageUrl} alt={item.product.name} fill className="object-contain" />
                                        </div>
                                        <div className={`flex-1 min-w-0 ${isRtl ? 'text-right' : 'text-left'}`}>
                                            <h4 className="text-sm font-bold text-gray-950 truncate group-hover:text-primary transition-colors">
                                                {item.product.name}
                                            </h4>
                                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-0.5">
                                                {item.quantity} × {item.weight >= 1000 ? `${item.weight / 1000}kg` : `${item.weight}g`}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <Link
                                href={`/${locale}/cart`}
                                className={`w-full flex items-center justify-center gap-2 py-4 bg-gray-900 text-white rounded-2xl text-xs font-bold hover:bg-black transition-all hover:shadow-lg active:scale-95 ${isRtl ? 'flex-row-reverse' : ''}`}
                            >
                                <ShoppingCart className="w-4 h-4" />
                                {t("review_checkout")}
                            </Link>
                        </div>
                    )}
                </div>

                {/* Orders Section */}
                <div className="lg:col-span-8">
                    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className={`p-8 border-b border-gray-50 flex items-center justify-between ${isRtl ? 'flex-row-reverse' : ''}`}>
                            <div className={`flex items-center gap-3 ${isRtl ? 'flex-row-reverse' : ''}`}>
                                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                                    <ShoppingBag className="w-5 h-5" />
                                </div>
                                <h3 className="font-bold text-gray-900 text-lg">{t("recent_orders")}</h3>
                            </div>
                            <Link href={`/${locale}/account/orders`} className="text-sm font-bold text-primary hover:text-primary-dark transition-colors flex items-center gap-1 group">
                                {t("view_all")}
                                <ArrowRight className={`w-4 h-4 transition-transform group-hover:translate-x-1 ${isRtl ? 'rotate-180 group-hover:-translate-x-1' : ''}`} />
                            </Link>
                        </div>

                        <div className="p-2">
                             <RealtimeOrderList initialOrders={orders} customerId={customer.id} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
