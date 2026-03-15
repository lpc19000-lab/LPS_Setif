"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingBag, ChevronRight, Trash2, ArrowRight, Loader2 } from "lucide-react";
import { useTranslations, useLocale } from "next-intl";
import { useCart } from "@/context/CartContext";
import SafeImage from "@/components/SafeImage";

export default function CartPage() {
    const { items, totalPrice, updateQuantity, removeItem } = useCart();
    const [mounted, setMounted] = useState(false);
    const t = useTranslations("cart");
    const com = useTranslations("common");
    const locale = useLocale();
    const isRtl = locale === 'ar';

    useEffect(() => {
        setMounted(true);
    }, []);

    const handleUpdateQuantity = (cartItemId: string, newQuantity: number) => {
        const result = updateQuantity(cartItemId, newQuantity);
        if (!result.success && result.error) {
            alert(result.error);
        }
    };

    if (!mounted) {
        return (
            <div className="pt-24 min-h-screen flex items-center justify-center bg-[#FAFAF8]">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
        );
    }

    return (
        <main className={`pt-24 pb-20 min-h-screen bg-[#FAFAF8] ${isRtl ? "rtl" : "ltr"}`}>
            <div className="max-w-7xl mx-auto px-6">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
                    <div className={isRtl ? "text-right" : "text-left"}>
                        <h1 className="text-4xl md:text-5xl font-serif text-primary-dark font-bold mb-4">
                            {t("title")}
                        </h1>
                        <div className={`flex items-center gap-2 text-sm text-gray-400 ${isRtl ? "justify-end" : "justify-start"}`}>
                            <ShoppingBag className="w-4 h-4" />
                            <span>{items.length} {t("subtotal_products").toLowerCase()}</span>
                        </div>
                    </div>
                    <Link
                        href={`/${locale}/catalog`}
                        className={`text-sm font-bold text-primary hover:text-primary-dark transition-colors flex items-center gap-2 group w-fit ${isRtl ? "flex-row-reverse" : "flex-row"}`}
                    >
                        <ChevronRight className={`w-4 h-4 ${isRtl ? "rotate-180 group-hover:translate-x-1" : "group-hover:-translate-x-1"} transition-transform`} />
                        {t("back_to_catalog")}
                    </Link>
                </div>

                {items.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white rounded-[2.5rem] border border-gray-100 p-16 md:p-24 text-center shadow-xl shadow-gray-100/50"
                    >
                        <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-8 text-gray-200">
                            <ShoppingBag className="w-12 h-12" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">{t("empty")}</h2>
                        <p className="text-gray-500 mb-10 max-w-sm mx-auto leading-relaxed">
                            {t("empty_subtitle")}
                        </p>
                        <Link
                            href={`/${locale}/catalog`}
                            className="inline-flex items-center justify-center bg-primary text-white px-10 py-4 rounded-2xl font-bold hover:bg-primary-dark transition-all shadow-lg shadow-primary/20 hover:-translate-y-1 active:translate-y-0"
                        >
                            {t("continue_shopping")}
                        </Link>
                    </motion.div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-start">
                        {/* Cart Items */}
                        <div className="lg:col-span-2 space-y-6">
                            <AnimatePresence mode="popLayout">
                                {items.map((item, i) => (
                                    <motion.div
                                        layout
                                        key={item.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        transition={{ duration: 0.4, delay: i * 0.05 }}
                                        className={`bg-white rounded-3xl p-6 flex flex-col sm:flex-row items-center gap-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow relative group ${isRtl ? "sm:flex-row-reverse text-right" : "text-left"}`}
                                    >
                                        <div className="w-24 h-24 sm:w-32 sm:h-32 bg-gray-50 rounded-2xl p-2 border border-gray-100 flex-shrink-0 relative overflow-hidden">
                                            <SafeImage
                                                src={item.product.imageUrl || ""}
                                                alt={item.product.name}
                                                fill
                                                className="object-contain group-hover:scale-110 transition-transform duration-700"
                                            />
                                        </div>

                                        <div className="flex-1 min-w-0 w-full">
                                            <div className={`flex items-start justify-between mb-4 ${isRtl ? "flex-row-reverse" : "flex-row"}`}>
                                                <div className="min-w-0">
                                                    <h3 className="font-serif text-2xl text-gray-900 font-bold truncate mb-1">
                                                        {item.product.name}
                                                    </h3>
                                                    <div className={`flex flex-wrap items-center gap-3 ${isRtl ? "flex-row-reverse" : "flex-row"}`}>
                                                        <p className="text-gray-400 text-[10px] font-black uppercase tracking-[0.2em]">{item.product.brand}</p>
                                                        <span className="w-1 h-3 border-l border-gray-200 shrink-0"></span>
                                                        <p className="text-[#D4AF37] text-[10px] font-black uppercase tracking-[0.2em]">
                                                            {item.product.weight >= 1000 ? (item.product.weight / 1000).toLocaleString(isRtl ? 'ar-DZ' : 'fr-FR') + "kg" : item.product.weight + "g"} {t("edition")}
                                                        </p>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => removeItem(item.id)}
                                                    className="w-10 h-10 rounded-xl flex items-center justify-center text-gray-200 hover:text-red-500 hover:bg-red-50 transition-all border border-transparent hover:border-red-100 shrink-0"
                                                    aria-label="Remove item"
                                                >
                                                    <Trash2 className="w-5 h-5" />
                                                </button>
                                            </div>

                                            <div className={`flex flex-wrap items-end justify-between gap-6 ${isRtl ? "flex-row-reverse" : "flex-row"}`}>
                                                <div className={`flex items-center bg-gray-50 rounded-2xl overflow-hidden border border-gray-100 p-1 flex-row`}>
                                                    <button
                                                        onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                                                        disabled={item.quantity <= 1}
                                                        className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-primary hover:bg-white rounded-xl disabled:opacity-20 transition-all font-bold text-lg"
                                                    >
                                                        −
                                                    </button>
                                                    <div className="px-5 text-center min-w-[100px]">
                                                        <span className="block text-base font-black text-gray-900 leading-none">{item.quantity}</span>
                                                        <span className="text-[8px] text-gray-400 uppercase font-black tracking-tighter mt-1 block">
                                                            {t("units_of")} {item.product.weight >= 1000 ? `${item.product.weight / 1000}kg` : `${item.product.weight}g`}
                                                        </span>
                                                    </div>
                                                    <button
                                                        onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                                                        className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-primary hover:bg-white rounded-xl transition-all font-bold text-lg"
                                                    >
                                                        +
                                                    </button>
                                                </div>

                                                <div className={isRtl ? "text-left" : "text-right"}>
                                                    <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest mb-1">{t("subtotal")}</p>
                                                    <p className="font-bold text-gray-900 text-2xl">
                                                        {(Number(item.product.basePrice) * item.quantity).toLocaleString(isRtl ? 'ar-DZ' : 'fr-FR')} <span className="text-sm text-gray-400 font-normal">{com('labels.currency')}</span>
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>

                        {/* Order Summary */}
                        <div className="lg:col-span-1">
                            <div className="bg-[#111111] text-white rounded-[2.5rem] p-8 md:p-10 shadow-2xl shadow-gray-200 sticky top-28 overflow-hidden group border border-white/5">
                                <h2 className={`text-2xl font-serif font-bold mb-10 italic flex items-center gap-3 ${isRtl ? "flex-row-reverse" : "flex-row"}`}>
                                    <div className="w-10 h-10 rounded-xl bg-[#D4AF37]/10 flex items-center justify-center">
                                        <ShoppingBag className="w-5 h-5 text-[#D4AF37]" />
                                    </div>
                                    {t("order_summary")}
                                </h2>

                                <div className="space-y-5 mb-10">
                                    <div className={`flex justify-between items-center text-sm ${isRtl ? "flex-row-reverse" : "flex-row"}`}>
                                        <span className="text-gray-400">{t("subtotal_products")}</span>
                                        <span className={`font-bold leading-none ${isRtl ? "flex flex-row-reverse items-center gap-1" : ""}`}>{totalPrice.toLocaleString(isRtl ? 'ar-DZ' : 'fr-FR')} <span className="text-[10px] text-gray-600 font-normal">{com('labels.currency')}</span></span>
                                    </div>
                                    <div className={`flex justify-between items-center text-sm ${isRtl ? "flex-row-reverse" : "flex-row"}`}>
                                        <span className="text-gray-400">{t("shipping_fees")}</span>
                                        <span className="text-[#D4AF37] font-bold text-xs bg-[#D4AF37]/10 px-3 py-1 rounded-full">{t("shipping_standard")}</span>
                                    </div>

                                    <div className="h-px bg-white/5 my-8"></div>

                                    <div className={`flex justify-between items-end ${isRtl ? "flex-row-reverse" : "flex-row"}`}>
                                        <div className={isRtl ? "text-right" : "text-left"}>
                                            <p className="text-[9px] font-black uppercase tracking-[0.4em] text-[#D4AF37] mb-2">{t("grand_total")}</p>
                                            <p className="text-5xl font-serif font-bold tracking-tight">{totalPrice.toLocaleString(isRtl ? 'ar-DZ' : 'fr-FR')}</p>
                                        </div>
                                        <span className="text-sm text-gray-500 mb-2 font-bold">{com('labels.currency')}</span>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <Link
                                        href={`/${locale}/checkout`}
                                        className="group relative flex items-center justify-center w-full py-5 rounded-2xl font-bold overflow-hidden transition-all bg-[#D4AF37] text-black hover:bg-white active:scale-[0.98] shadow-xl shadow-[#D4AF37]/10"
                                    >
                                        <span className={`relative z-10 flex items-center gap-2 ${isRtl ? "flex-row-reverse" : "flex-row"}`}>
                                            {t("checkout_now")}
                                            <ArrowRight className={`w-5 h-5 group-hover:${isRtl ? "-translate-x-2 rotate-180" : "translate-x-2"} transition-transform duration-300 ${isRtl ? "rotate-180" : ""}`} />
                                        </span>
                                        <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500"></div>
                                    </Link>

                                    <p className="text-[10px] text-white/20 text-center uppercase tracking-[0.2em] leading-relaxed px-4">
                                        {t("terms_agree")}
                                    </p>
                                </div>

                                {/* Decoration */}
                                <div className={`absolute -right-20 -bottom-20 w-64 h-64 bg-[#D4AF37]/5 rounded-full blur-[80px] pointer-events-none group-hover:bg-[#D4AF37]/10 transition-colors duration-1000 ${isRtl ? "-left-20 -right-auto" : ""}`}></div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </main>
    );
}
