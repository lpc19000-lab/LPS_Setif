import { requireCustomerSession } from "@/lib/customer-auth";
import { getOrderById } from "@/services/order-service";
import {
    ChevronRight,
    Package,
    Truck,
    CheckCircle2,
    Clock,
    ShieldCheck,
    Hash,
    Calendar,
    ArrowLeft,
    FileText,
    Boxes,
    ShoppingCart,
    MapPin
} from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import ReorderButton from "@/components/shop/ReorderButton";
import CancelOrderButton from "@/components/shop/CancelOrderButton";
import SafeImage from "@/components/SafeImage";
import { getTranslations } from "next-intl/server";

export const dynamic = "force-dynamic";

const STATUS_STEPS = ["PENDING", "CONFIRMED", "PACKED", "SHIPPED", "DELIVERED"];

export default async function OrderDetailsPage({ params }: { params: Promise<{ id: string, locale: string }> }) {
    const { id, locale } = await params;
    const t = await getTranslations({ locale, namespace: "account" });
    const com = await getTranslations({ locale, namespace: "common" });
    const ch = await getTranslations({ locale, namespace: "checkout" });
    const customer = await requireCustomerSession();
    const order = await getOrderById(id);

    if (!order) notFound();
    if (!order.customer || order.customer.id !== customer.id) {
        redirect(`/${locale}/account/orders`);
    }

    const currentStepIndex = STATUS_STEPS.indexOf(order.status);
    const isCancelled = order.status === "CANCELLED";
    const canCancel = order.status === "PENDING";

    return (
        <div className={`max-w-7xl mx-auto px-6 pt-32 pb-20 ${locale === 'ar' ? 'rtl' : 'ltr'}`}>
            {/* Header / Breadcrumb */}
            <div className={`flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12 ${locale === 'ar' ? 'md:flex-row-reverse' : ''}`}>
                <div className={`flex items-center gap-4 ${locale === 'ar' ? 'flex-row-reverse' : ''}`}>
                    <Link
                        href={`/${locale}/account/orders`}
                        className="w-10 h-10 rounded-full border border-gray-100 flex items-center justify-center text-gray-400 hover:text-primary hover:border-primary/20 transition-all font-bold"
                    >
                        {locale === 'ar' ? <ChevronRight className="w-5 h-5 font-bold" /> : <ChevronRight className="w-5 h-5 font-bold rotate-180" />}
                    </Link>
                    <div className={locale === 'ar' ? 'text-right' : 'text-left'}>
                        <div className={`flex items-center gap-2 mb-1 ${locale === 'ar' ? 'flex-row-reverse' : ''}`}>
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">{t("order_info")}</span>
                            <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">#{order.id.slice(-8).toUpperCase()}</span>
                        </div>
                        <h1 className="text-3xl font-serif font-bold text-primary-dark">{t("shipment_tracking")}</h1>
                    </div>
                </div>
                <div className={`flex items-center gap-3 ${locale === 'ar' ? 'flex-row-reverse' : ''}`}>
                    {order.invoice && (
                        <Link
                            href={`/${locale}/account/orders/${order.id}/invoice`}
                            target="_blank"
                            className={`flex items-center gap-2 px-5 py-2.5 rounded-full border border-gray-200 text-sm font-bold text-gray-600 hover:bg-gray-50 transition-all ${locale === 'ar' ? 'flex-row-reverse' : ''}`}
                        >
                            <FileText className="w-4 h-4" />
                            {t("download_invoice")}
                        </Link>
                    )}
                    {canCancel && <CancelOrderButton orderId={order.id} />}
                    <ReorderButton orderId={order.id} />
                </div>
            </div>

            {/* Tracking Progress Bar */}
            <div className="bg-white p-8 md:p-12 rounded-3xl border border-gray-100 shadow-sm mb-12 relative overflow-hidden">
                {isCancelled ? (
                    <div className="flex flex-col items-center justify-center py-10 text-center">
                        <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center text-red-600 mb-4 animate-pulse">
                            <Truck className="w-10 h-10 opacity-20" />
                        </div>
                        <h3 className="text-2xl font-serif font-bold text-red-600">{t("order_cancelled")}</h3>
                        <p className="text-gray-500 mt-2 max-w-md">{t("order_cancelled_desc")}</p>
                    </div>
                ) : (
                    <div className="relative">
                        {/* Progress Line */}
                        <div className={`absolute top-1/2 w-full h-0.5 bg-gray-100 -translate-y-1/2 hidden md:block ${locale === 'ar' ? 'right-0' : 'left-0'}`}></div>
                        <div
                            className={`absolute top-1/2 h-0.5 bg-primary -translate-y-1/2 transition-all duration-1000 ease-out hidden md:block ${locale === 'ar' ? 'right-0' : 'left-0'}`}
                            style={{ width: `${(currentStepIndex / (STATUS_STEPS.length - 1)) * 100}%` }}
                        ></div>

                        {/* Steps */}
                        <div className={`flex flex-col md:flex-row justify-between items-start md:items-center relative z-10 gap-8 md:gap-0 ${locale === 'ar' ? 'md:flex-row-reverse' : ''}`}>
                            {STATUS_STEPS.map((step, index) => {
                                const isCompleted = index <= currentStepIndex;
                                const isActive = index === currentStepIndex;
                                const StepIcon = index === 0 ? Clock : index === 1 ? ShieldCheck : index === 2 ? Package : index === 3 ? Truck : CheckCircle2;

                                return (
                                    <div key={step} className="flex md:flex-col items-center gap-4 md:gap-4 relative group">
                                        <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-500 ${isCompleted ? "bg-primary text-white shadow-lg shadow-primary/30" : "bg-white border-2 border-gray-100 text-gray-300"
                                            } ${isActive ? "ring-4 ring-primary/10 scale-110" : ""}`}>
                                            <StepIcon className="w-5 h-5 shadow-inner" />
                                        </div>
                                        <div className={locale === 'ar' ? 'text-right md:text-center' : 'text-left md:text-center'}>
                                            <p className={`text-[10px] font-black uppercase tracking-widest ${isCompleted ? "text-primary" : "text-gray-400"}`}>
                                                {t(`status.${step}`)}
                                            </p>
                                            {isActive && (
                                                <p className="text-[9px] font-medium text-gray-400 mt-0.5 hidden md:block">{t("current_status")}</p>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Order Items */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className={`p-6 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between ${locale === 'ar' ? 'flex-row-reverse' : ''}`}>
                            <h3 className={`font-bold text-gray-900 flex items-center gap-2 ${locale === 'ar' ? 'flex-row-reverse' : ''}`}>
                                <Boxes className="w-5 h-5 text-primary" />
                                {t("products_ordered")}
                            </h3>
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{t("items_count", { count: order.items.length })}</span>
                        </div>
                        <div className="divide-y divide-gray-50">
                            {order.items.map((item) => (
                                <div key={item.id} className={`p-6 flex items-center gap-6 ${locale === 'ar' ? 'flex-row-reverse' : ''}`}>
                                    <div className="w-20 h-20 bg-gray-50 rounded-2xl border border-gray-100 flex items-center justify-center overflow-hidden p-2 shrink-0 relative">
                                        <SafeImage
                                            src={item.product?.imageUrl || ""}
                                            alt={item.product?.name || ""}
                                            fill
                                            className="object-contain"
                                        />
                                    </div>
                                    <div className={`flex-1 min-w-0 ${locale === 'ar' ? 'text-right' : 'text-left'}`}>
                                        <h4 className="font-bold text-gray-900 truncate">{item.product?.name || "Product"}</h4>
                                        <p className="text-xs text-gray-500 mt-1">{item.product?.brand || ""}</p>
                                        <div className={`flex items-center gap-4 mt-3 ${locale === 'ar' ? 'flex-row-reverse' : ''}`}>
                                            <div className="bg-gray-100 px-3 py-1 rounded-full">
                                                <p className="text-[10px] font-bold text-gray-500">{ch("qty")}: {item.quantity}</p>
                                            </div>
                                            <div className="bg-primary/5 px-3 py-1 rounded-full border border-primary/10">
                                                <p className="text-[10px] font-black text-primary uppercase tracking-widest">
                                                    {(() => {
                                                        const weight = (item.volume && item.volume.weight) || (typeof item.volumeId === 'string' && item.volumeId.startsWith('v') ? parseInt(item.volumeId.replace('v', '')) : null);
                                                        if (!weight) return null;
                                                        return weight >= 1000 ? `${weight / 1000}kg` : `${weight}g`;
                                                    })()}
                                                </p>
                                            </div>
                                            <p className={`text-sm font-bold text-gray-900 ${locale === 'ar' ? 'flex flex-row-reverse gap-1 justify-end' : ''}`}>
                                                <span>{Number(item.price).toLocaleString(locale === 'ar' ? 'ar-DZ' : 'fr-FR')}</span>
                                                <span>{com("labels.currency")}</span>
                                                <span className="text-[10px] font-normal text-gray-400">{t("per_unit_label")}</span>
                                            </p>
                                        </div>
                                    </div>
                                    <div className={`text-right hidden sm:block ${locale === 'ar' ? 'text-left' : 'text-right'}`}>
                                        <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">{t("subtotal")}</p>
                                        <p className={`text-lg font-bold text-primary ${locale === 'ar' ? 'flex flex-row-reverse gap-1 justify-end' : ''}`}>
                                            <span>{(Number(item.price) * item.quantity).toLocaleString(locale === 'ar' ? 'ar-DZ' : 'fr-FR')}</span>
                                            <span>{com("labels.currency")}</span>
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Summary Sidebar */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-[#1A1A1A] text-white p-8 rounded-3xl relative overflow-hidden group">
                        <h3 className={`text-xl font-serif font-bold mb-8 italic flex items-center gap-2 relative z-10 ${locale === 'ar' ? 'flex-row-reverse' : ''}`}>
                            <ShoppingCart className="w-6 h-6 text-[#D4AF37]" />
                            {t("order_summary")}
                        </h3>

                        <div className="space-y-4 relative z-10">
                            <div className={`flex justify-between text-sm ${locale === 'ar' ? 'flex-row-reverse' : ''}`}>
                                <span className="text-gray-400">{t("subtotal")}</span>
                                <span className={`font-bold ${locale === 'ar' ? 'flex flex-row-reverse gap-1' : ''}`}>
                                    <span>{Number(order.totalPrice).toLocaleString(locale === 'ar' ? 'ar-DZ' : 'fr-FR')}</span>
                                    <span>{com("labels.currency")}</span>
                                </span>
                            </div>
                            <div className={`flex justify-between flex-wrap gap-2 text-sm ${locale === 'ar' ? 'flex-row-reverse' : ''}`}>
                                <span className="text-gray-400">{locale === 'ar' ? 'التوصيل (Yalidine)' : 'Shipping (Yalidine)'}</span>
                                <span className="font-bold text-amber-500 text-xs sm:text-sm text-right max-w-[150px]">{locale === 'ar' ? 'تُحسب عند الاستلام' : 'Calculated on Delivery'}</span>
                            </div>
                            <div className="h-px bg-white/10 my-6"></div>
                            <div className={`flex justify-between items-end ${locale === 'ar' ? 'flex-row-reverse' : ''}`}>
                                <div className={locale === 'ar' ? 'text-right' : 'text-left'}>
                                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#D4AF37] mb-1">{t("total_amount_label")}</p>
                                    <p className="text-4xl font-serif font-bold">{Number(order.totalPrice).toLocaleString(locale === 'ar' ? 'ar-DZ' : 'fr-FR')}</p>
                                </div>
                                <span className="text-xs text-gray-400 mb-1">{com("labels.currency")}</span>
                            </div>

                            {/* Payment Info */}
                            <div className="pt-4 border-t border-white/10 space-y-3">
                                <div className={`flex justify-between text-sm ${locale === 'ar' ? 'flex-row-reverse' : ''}`}>
                                    <span className="text-gray-400">{locale === 'ar' ? 'المبلغ المدفوع' : 'Amount Paid'}</span>
                                    <span className="font-bold text-emerald-400">{Number(order.amountPaid || 0).toLocaleString(locale === 'ar' ? 'ar-DZ' : 'fr-FR')} {com("labels.currency")}</span>
                                </div>
                                {Number(order.totalPrice) - Number(order.amountPaid || 0) > 0 && (
                                    <div className={`flex justify-between text-sm ${locale === 'ar' ? 'flex-row-reverse' : ''}`}>
                                        <span className="text-gray-400">{locale === 'ar' ? 'المبلغ المتبقي' : 'Balance Due'}</span>
                                        <span className="font-bold text-red-400">{(Number(order.totalPrice) - Number(order.amountPaid || 0)).toLocaleString(locale === 'ar' ? 'ar-DZ' : 'fr-FR')} {com("labels.currency")}</span>
                                    </div>
                                )}
                                <div className={`flex justify-between text-sm ${locale === 'ar' ? 'flex-row-reverse' : ''}`}>
                                    <span className="text-gray-400">{locale === 'ar' ? 'حالة الدفع' : 'Payment'}</span>
                                    <span className={`font-bold text-xs px-2 py-0.5 rounded-full ${order.paymentStatus === 'PAID' ? 'bg-emerald-500/20 text-emerald-400' : order.paymentStatus === 'PARTIAL' ? 'bg-amber-500/20 text-amber-400' : 'bg-red-500/20 text-red-400'}`}>
                                        {order.paymentStatus === 'PAID' ? (locale === 'ar' ? 'مدفوع' : 'Paid') : order.paymentStatus === 'PARTIAL' ? (locale === 'ar' ? 'دفع جزئي' : 'Partial') : (locale === 'ar' ? 'غير مدفوع' : 'Unpaid')}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Background Decoration */}
                        <div className={`absolute top-0 opacity-5 blur-3xl group-hover:opacity-10 transition-opacity ${locale === 'ar' ? 'left-0' : 'right-0'}`}>
                            <div className={`w-48 h-48 bg-[#D4AF37] rounded-full -translate-y-12 ${locale === 'ar' ? '-translate-x-12' : 'translate-x-12'}`}></div>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                        <h4 className={`font-bold text-gray-900 mb-4 text-sm ${locale === 'ar' ? 'text-right' : 'text-left'}`}>{t("delivery_info")}</h4>
                        <div className={`space-y-4 text-xs ${locale === 'ar' ? 'text-right' : 'text-left'}`}>
                            <div className={`flex gap-3 ${locale === 'ar' ? 'flex-row-reverse' : ''}`}>
                                <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                <div>
                                    <p className="font-bold text-gray-900 mb-1">{customer.shopName}</p>
                                    <p className="text-gray-500 leading-relaxed">{customer.address}, {order.wilayaName || order.customer?.wilaya || customer.wilaya}</p>
                                </div>
                            </div>
                            {order.shipping?.trackingNumber && (
                                <div className={`p-3 bg-blue-50 rounded-xl border border-blue-100 ${locale === 'ar' ? 'text-right' : 'text-left'}`}>
                                    <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-1">{t("tracking_number_label")}</p>
                                    <p className="text-sm font-bold text-blue-900">{order.shipping.trackingNumber}</p>
                                    <p className="text-[10px] text-blue-400 mt-1">{t("ship_with_label", { company: order.shipping.company || "" })}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
