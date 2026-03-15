"use client";

import { useCart } from "@/context/CartContext";
import { motion, AnimatePresence } from "framer-motion";
import { X, ShoppingBag, ArrowRight, Trash2 } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";
import SafeImage from "@/components/SafeImage";
import { useTranslations, useLocale } from "next-intl";

export default function MiniCart() {
    const { isCartOpen, setIsCartOpen, items, totalQuantity, totalPrice, removeItem, updateQuantity } = useCart();
    const t = useTranslations("cart");
    const com = useTranslations("common");
    const locale = useLocale();
    const isRtl = locale === "ar";

    // Prevent body scroll when open
    useEffect(() => {
        if (isCartOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "unset";
        }
        return () => {
            document.body.style.overflow = "unset";
        };
    }, [isCartOpen]);

    return (
        <AnimatePresence>
            {isCartOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsCartOpen(false)}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
                    />

                    {/* Drawer */}
                    <motion.div
                        initial={{ x: isRtl ? "-100%" : "100%" }}
                        animate={{ x: 0 }}
                        exit={{ x: isRtl ? "-100%" : "100%" }}
                        transition={{ type: "spring", damping: 25, stiffness: 200 }}
                        className={`fixed top-0 ${isRtl ? "left-0" : "right-0"} h-full w-full max-w-md bg-white shadow-2xl z-50 flex flex-col`}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-white/50 backdrop-blur-md sticky top-0 z-10">
                            <h2 className="text-xl font-serif font-bold text-primary-dark flex items-center gap-2">
                                <ShoppingBag className="w-5 h-5 text-primary" />
                                {t("title")}
                                <span className="text-sm font-sans font-normal text-gray-400">({totalQuantity})</span>
                            </h2>
                            <button
                                onClick={() => setIsCartOpen(false)}
                                className="w-10 h-10 rounded-full flex items-center justify-center text-gray-300 hover:bg-gray-50 hover:text-red-500 transition-all duration-300"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Items */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-gray-100">
                            {items.length === 0 ? (
                                <div className="text-center py-20 px-4">
                                    <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6 text-gray-200">
                                        <ShoppingBag className="w-10 h-10" />
                                    </div>
                                    <h3 className="text-lg font-bold text-gray-900 mb-2">{t("empty")}</h3>
                                    <p className="text-gray-400 text-sm mb-8 max-w-[240px] mx-auto">
                                        {t("empty_subtitle")}
                                    </p>
                                    <button
                                        onClick={() => setIsCartOpen(false)}
                                        className="bg-primary text-white px-8 py-3 rounded-xl font-bold hover:bg-primary-dark transition-all shadow-lg shadow-primary/20 text-sm"
                                    >
                                        {t("continue_shopping")}
                                    </button>
                                </div>
                            ) : (
                                items.map((item) => (
                                    <motion.div
                                        layout
                                        key={item.id}
                                        className="flex gap-4 items-center group relative p-4 rounded-2xl hover:bg-gray-50/50 transition-colors border border-transparent hover:border-gray-100"
                                    >
                                        <div className="w-20 h-20 bg-gray-50 rounded-xl p-2 border border-gray-100 flex-shrink-0 relative overflow-hidden">
                                            <SafeImage
                                                src={item.product.imageUrl}
                                                alt={item.product.name}
                                                fill
                                                className="object-contain group-hover:scale-110 transition-transform duration-500"
                                            />
                                        </div>
                                        <div className="flex-1 min-w-0 pr-2">
                                            <div className="flex items-start justify-between gap-2 mb-1">
                                                <h3 className="font-bold text-gray-900 text-sm truncate group-hover:text-primary transition-colors">
                                                    {item.product.name}
                                                </h3>
                                                <button
                                                    onClick={() => removeItem(item.id)}
                                                    className="p-1.5 hover:bg-red-50 text-gray-200 hover:text-red-500 rounded-lg transition-all flex-shrink-0"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                            <div className="flex items-center gap-2 mb-3">
                                                <p className="text-[10px] text-gray-400 font-serif italic truncate">{item.product.brand}</p>
                                                <span className="w-1 h-1 rounded-full bg-gray-200"></span>
                                                <p className="text-[10px] font-black uppercase tracking-widest text-[#D4AF37]">
                                                    {item.product.weight >= 1000 ? `${item.product.weight / 1000}kg` : `${item.product.weight}g`}
                                                </p>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center bg-white rounded-lg p-0.5 border border-gray-200 shadow-sm">
                                                    <button
                                                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                                        className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-primary transition-colors font-bold disabled:opacity-20"
                                                        disabled={item.quantity <= 1}
                                                    >
                                                        −
                                                    </button>
                                                    <span className="w-8 text-center text-xs font-black text-gray-900">
                                                        {item.quantity}
                                                    </span>
                                                    <button
                                                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                                        className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-primary transition-colors font-bold"
                                                    >
                                                        +
                                                    </button>
                                                </div>
                                                <p className="text-sm font-bold text-gray-950">
                                                    {(Number(item.product.basePrice) * item.quantity).toLocaleString()} <span className="text-[10px] text-gray-400 font-normal">{com('labels.currency')}</span>
                                                </p>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))
                            )}
                        </div>

                        {/* Footer */}
                        {items.length > 0 && (
                            <div className="p-6 border-t border-gray-100 bg-white/80 backdrop-blur-md">
                                <div className="space-y-3 mb-6">
                                    <div className="flex justify-between items-center text-sm">
                                        <p className="text-gray-400 font-medium">{t("subtotal_products")}</p>
                                        <p className="font-bold text-gray-900">{totalPrice.toLocaleString()} {com('labels.currency')}</p>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                        <p className="text-gray-400 font-medium">{t("shipping_fees")}</p>
                                        <p className="text-[#D4AF37] font-bold text-xs">{t("shipping_standard")}</p>
                                    </div>
                                    <div className="pt-3 border-t border-gray-100 flex justify-between items-end">
                                        <p className="text-gray-900 font-bold">{t("grand_total")}</p>
                                        <p className="text-2xl font-serif font-bold text-primary-dark">
                                            {totalPrice.toLocaleString()} <span className="text-xs text-gray-400 font-sans">{com('labels.currency')}</span>
                                        </p>
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <Link
                                        href={`/${locale}/cart`}
                                        onClick={() => setIsCartOpen(false)}
                                        className="flex items-center justify-center w-full py-3.5 bg-gray-50 border border-gray-200 text-gray-900 font-bold rounded-xl hover:bg-gray-100 hover:border-gray-300 transition-all text-sm"
                                    >
                                        {t("view_cart")}
                                    </Link>
                                    <Link
                                        href={`/${locale}/checkout`}
                                        onClick={() => setIsCartOpen(false)}
                                        className="flex items-center justify-center gap-2 w-full py-4 bg-primary text-white font-bold rounded-xl hover:bg-primary-dark transition-all shadow-lg shadow-primary/20 group relative overflow-hidden"
                                    >
                                        <span className="relative z-10">{t("checkout_now")}</span>
                                        <ArrowRight className={`w-4 h-4 relative z-10 group-hover:${isRtl ? "-translate-x-1" : "translate-x-1"} transition-transform`} />
                                        <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                                    </Link>
                                </div>
                                <p className="text-[9px] text-gray-400 text-center mt-6 uppercase tracking-widest leading-relaxed">
                                    {t("terms_agree")}
                                </p>
                            </div>
                        )}
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
