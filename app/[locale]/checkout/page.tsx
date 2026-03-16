"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useCart } from "@/context/CartContext";
import { useTranslations, useLocale } from "next-intl";
import WilayaSelector from "@/components/WilayaSelector";

export default function CheckoutPage() {
    const router = useRouter();
    const t = useTranslations("checkout");
    const tCommon = useTranslations("common.labels");
    const tCart = useTranslations("cart");
    const locale = useLocale();
    const { items, totalPrice, clearCart } = useCart();
    const [mounted, setMounted] = useState(false);
    const [placing, setPlacing] = useState(false);
    const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
    const [errorMsg, setErrorMsg] = useState("");

    const [form, setForm] = useState({
        name: "",
        phone: "",
        wilayaNumber: "",
        wilayaName: "",
        address: "",
        notes: "",
    });

    useEffect(() => {
        setMounted(true);

        // Auto-fill from customer account if logged in
        fetch("/api/customers/me")
            .then(r => r.json())
            .then(json => {
                if (json.success && json.data) {
                    const c = json.data;
                    setForm(prev => ({
                        ...prev,
                        name: prev.name || c.shopName || c.name || "",
                        phone: prev.phone || c.phone || "",
                        address: prev.address || c.address || "",
                        wilayaNumber: prev.wilayaNumber || (c.wilaya && c.wilaya.includes(" - ") ? c.wilaya.split(" - ")[0] : c.wilayaNumber || ""),
                        wilayaName: prev.wilayaName || (c.wilaya && c.wilaya.includes(" - ") ? c.wilaya.split(" - ")[1] : c.wilayaName || ""),
                    }));
                }
            })
            .catch(() => {}); // Silently fail — user might not be logged in
    }, []);

    const MIN_ORDER_AMOUNT = 5000;
    const isValidOrder = totalPrice >= MIN_ORDER_AMOUNT;

    const handleWilayaChange = (number: string, name: string) => {
        setForm(prev => ({ ...prev, wilayaNumber: number, wilayaName: name }));
    };

    const placeOrder = async () => {
        setPlacing(true);
        setStatus("idle");
        setErrorMsg("");
        try {
            const orderItems = items.map((item) => ({
                productId: item.product.id,
                quantity: item.quantity,
                volumeId: item.product.volumeId,
            }));
            const res = await fetch("/api/orders", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    items: orderItems,
                    shippingData: {
                        ...form,
                        wilaya: `${form.wilayaNumber} - ${form.wilayaName}` // For backward compatibility if needed, or update API
                    }
                }),
            });
            const json = await res.json();
            if (json.success) {
                clearCart();
                setStatus("success");
                // router.push(`/${locale}/order-confirmation`); // Optional: stay on page or redirect
            } else {
                setStatus("error");
                setErrorMsg(json.message || json.error || t("network_error"));
            }
        } catch {
            setStatus("error");
            setErrorMsg(t("network_error"));
        }
        setPlacing(false);
    };

    if (!mounted) {
        return (
            <main className="pt-24 min-h-screen flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            </main>
        );
    }

    if (status === "success") {
        return (
            <main className="pt-24 min-h-screen flex items-center justify-center bg-[#FAFAF8]">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-white rounded-2xl p-12 text-center max-w-md border border-gray-100 shadow-lg"
                >
                    <span className="text-5xl block mb-4">✓</span>
                    <h1 className="text-2xl font-serif text-primary-dark mb-3">
                        {t("order_success_title")}
                    </h1>
                    <p className="text-gray-500 mb-8">
                        {t("order_success_msg")}
                    </p>
                    <div className="flex flex-col gap-3">
                        <button
                            onClick={() => router.push(`/${locale}/account/orders`)}
                            className="btn-primary"
                        >
                            {t("view_history")}
                        </button>
                        <button
                            onClick={() => router.push(`/${locale}/catalog`)}
                            className="text-gray-400 text-sm hover:text-primary transition-colors"
                        >
                            {tCart("continue_shopping")}
                        </button>
                    </div>
                </motion.div>
            </main>
        );
    }

    return (
        <main className={`pt-24 pb-20 min-h-screen bg-[#FAFAF8] ${locale === 'ar' ? 'rtl' : 'ltr'}`}>
            <div className="max-w-7xl mx-auto px-6">
                <h1 className={`text-3xl md:text-4xl font-serif text-primary-dark mb-8 ${locale === 'ar' ? 'text-right' : 'text-left'}`}>
                    {t("title")}
                </h1>

                {items.length === 0 ? (
                    <div className="text-center py-20">
                        <p className="text-gray-400 text-lg mb-4">{t("no_items")}</p>
                        <button onClick={() => router.push(`/${locale}/catalog`)} className="btn-primary">
                            {t("browse_products")}
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                        {/* Order Details Column */}
                        <div className="space-y-6">
                            <div className="bg-white rounded-xl p-6 border border-gray-100">
                                <h2 className={`font-serif text-lg text-gray-800 mb-4 ${locale === 'ar' ? 'text-right' : 'text-left'}`}>{t("shipping_details")}</h2>
                                
                                {/* YALIDINE BANNER */}
                                <div className={`mb-6 p-4 rounded-xl bg-blue-50 border border-blue-100 flex items-start gap-3 ${locale === 'ar' ? 'flex-row-reverse text-right' : 'flex-row text-left'}`}>
                                    <div className="p-2 bg-blue-100 rounded-lg shrink-0">
                                        <svg className="w-5 h-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18H9"/><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14"/><circle cx="17" cy="18" r="2"/><circle cx="7" cy="18" r="2"/></svg>
                                    </div>
                                    <div>
                                        <p className="font-bold text-blue-900 text-sm">التوصيل عبر شركة ياليدين / Livraison via Yalidine</p>
                                        <p className="text-blue-700 text-xs mt-1">يتم التوصيل حصرياً وبشكل مضمون عبر شركة ياليدين لجميع الولايات.</p>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className={locale === 'ar' ? 'text-right' : 'text-left'}>
                                        <label htmlFor="name" className="block text-sm text-gray-500 mb-1">{t("company_name")}</label>
                                        <input
                                            id="name"
                                            name="name"
                                            type="text"
                                            required
                                            value={form.name}
                                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                                            className="input-luxury w-full"
                                            placeholder={t("placeholder_name")}
                                        />
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className={locale === 'ar' ? 'text-right' : 'text-left'}>
                                            <label htmlFor="phone" className="block text-sm text-gray-500 mb-1">{t("phone")}</label>
                                            <input
                                                id="phone"
                                                name="phone"
                                                type="text"
                                                required
                                                value={form.phone}
                                                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                                                className="input-luxury w-full"
                                                placeholder={t("placeholder_phone")}
                                            />
                                        </div>
                                        <div className={locale === 'ar' ? 'text-right' : 'text-left'}>
                                            <label htmlFor="wilaya" className="block text-sm text-gray-500 mb-1">{t("wilaya")}</label>
                                            <WilayaSelector
                                                id="wilaya"
                                                value={form.wilayaNumber}
                                                onChange={(wilaya) => handleWilayaChange(wilaya.id, wilaya.name)}
                                            />
                                        </div>
                                    </div>
                                    <div className={locale === 'ar' ? 'text-right' : 'text-left'}>
                                        <label htmlFor="address" className="block text-sm text-gray-500 mb-1">{t("address")}</label>
                                        <input
                                            id="address"
                                            name="address"
                                            type="text"
                                            required
                                            value={form.address}
                                            onChange={(e) => setForm({ ...form, address: e.target.value })}
                                            className="input-luxury w-full"
                                            placeholder={t("placeholder_address")}
                                        />
                                    </div>
                                    <div className={locale === 'ar' ? 'text-right' : 'text-left'}>
                                        <label htmlFor="notes" className="block text-sm text-gray-500 mb-1">{t("order_notes")}</label>
                                        <textarea
                                            id="notes"
                                            name="notes"
                                            value={form.notes}
                                            onChange={(e) => setForm({ ...form, notes: e.target.value })}
                                            className="input-luxury w-full min-h-[100px]"
                                            placeholder={t("placeholder_notes")}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Order Summary Column */}
                        <div className="space-y-6">
                            {/* Order Items */}
                            <div className="bg-white rounded-xl p-6 border border-gray-100">
                                <h2 className={`font-serif text-lg text-gray-800 mb-4 ${locale === 'ar' ? 'text-right' : 'text-left'}`}>{t("order_summary")}</h2>
                                <div className="divide-y divide-gray-50 max-h-60 overflow-y-auto pr-2">
                                    {items.map((item) => (
                                        <div
                                            key={item.id}
                                            className={`flex justify-between items-center py-3 ${locale === 'ar' ? 'flex-row-reverse' : 'flex-row'}`}
                                        >
                                            <div className={locale === 'ar' ? 'text-right' : 'text-left'}>
                                                <p className="text-gray-800 font-medium">
                                                    {item.product.name}
                                                </p>
                                                <p className="text-gray-400 text-sm">
                                                    {t("qty")}: {item.quantity} × {Number(item.product.basePrice).toLocaleString(locale === 'ar' ? 'ar-DZ' : 'fr-FR')} {tCommon("currency")}
                                                </p>
                                                <p className="text-[10px] text-primary font-bold">
                                                    {item.product.weight >= 1000 ? `${item.product.weight / 1000}kg` : `${item.product.weight}g`}
                                                </p>
                                            </div>
                                            <p className="font-bold text-gray-700">
                                                {(
                                                    Number(item.product.basePrice) * item.quantity
                                                ).toLocaleString(locale === 'ar' ? 'ar-DZ' : 'fr-FR')}{" "}
                                                {tCommon("currency")}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="bg-white rounded-xl p-6 border border-gray-100">
                                <div className={`flex justify-between items-center text-lg mb-4 ${locale === 'ar' ? 'flex-row-reverse' : 'flex-row'}`}>
                                    <span className="font-serif text-gray-800">{t("total")}</span>
                                    <span className="font-bold text-primary-dark text-2xl">
                                        {totalPrice.toLocaleString(locale === 'ar' ? 'ar-DZ' : 'fr-FR')} {tCommon("currency")}
                                    </span>
                                </div>
                                <div className={`text-sm ${locale === 'ar' ? 'text-right' : 'text-left'}`}>
                                    {isValidOrder ? (
                                        <p className="text-green-600 font-medium">✓ {t("min_order_met")}</p>
                                    ) : (
                                        <p className="text-red-500 font-medium">
                                            {t("min_order_error", { amount: (MIN_ORDER_AMOUNT - totalPrice).toLocaleString(locale === 'ar' ? 'ar-DZ' : 'fr-FR') })}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Error */}
                            {status === "error" && (
                                <div className={`bg-red-50 border border-red-200 rounded-xl p-4 text-red-600 text-sm ${locale === 'ar' ? 'text-right' : 'text-left'}`}>
                                    {errorMsg}
                                </div>
                            )}

                            {/* Place Order */}
                            <button
                                onClick={placeOrder}
                                disabled={placing || !isValidOrder || !form.name || !form.phone || !form.wilayaNumber || !form.address}
                                className="btn-primary w-full text-center text-lg py-4 disabled:opacity-50"
                            >
                                {placing ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        {t("placing_order")}
                                    </span>
                                ) : (
                                    t("place_order")
                                )}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </main>
    );
}
