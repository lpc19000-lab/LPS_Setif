"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { User, Phone, MapPin, Store, ArrowRight, Loader2 } from "lucide-react";
import { useTranslations, useLocale } from "next-intl";
import WilayaSelector from "@/components/WilayaSelector";

export default function RegisterPage() {
    const t = useTranslations("registration");
    const b = useTranslations("common.buttons");
    const locale = useLocale();
    const router = useRouter();

    const [formData, setFormData] = useState({
        name: "",
        phone: "",
        shopName: "",
        wilayaNumber: "",
        wilayaName: "",
        address: "",
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleWilayaChange = (wilaya: { id: string; name: string }) => {
        setFormData({
            ...formData,
            wilayaNumber: wilaya.id,
            wilayaName: wilaya.name
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const response = await fetch("/api/customers/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            const data = await response.json();

            if (data.success) {
                router.push(`/${locale}/account`);
                router.refresh();
            } else {
                setError(data.error || "Registration failed");
            }
        } catch (err) {
            setError("Something went wrong. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-6 pt-32 pb-20">
            <div className="max-w-xl w-full">
                {/* Header */}
                <div className="text-center mb-10">
                    <h1 className="text-4xl font-serif font-bold text-primary-dark mb-2">{t("title")}</h1>
                    <p className="text-gray-500 tracking-wide text-sm font-medium">{t("subtitle")}</p>
                </div>

                {/* Form Card */}
                <div className="bg-white p-10 rounded-[2.5rem] border border-gray-100 shadow-xl shadow-gray-200/50">
                    <form onSubmit={handleSubmit} className="space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* Personal Info */}
                            <div className="space-y-6">
                                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-primary border-b border-primary/10 pb-2">{t("trader_info")}</h3>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">{t("full_name")}</label>
                                        <div className="relative">
                                            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                                            <input
                                                type="text"
                                                name="name"
                                                required
                                                value={formData.name}
                                                onChange={handleChange}
                                                placeholder={t("placeholder_name")}
                                                className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm font-medium"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">{t("phone")}</label>
                                        <div className="relative">
                                            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                                            <input
                                                type="tel"
                                                name="phone"
                                                required
                                                value={formData.phone}
                                                onChange={handleChange}
                                                placeholder="05 / 06 / 07 ..."
                                                className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm font-medium"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Business Info */}
                            <div className="space-y-6">
                                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-primary border-b border-primary/10 pb-2">{t("business_details")}</h3>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">{t("shop_name")}</label>
                                        <div className="relative">
                                            <Store className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                                            <input
                                                type="text"
                                                name="shopName"
                                                required
                                                value={formData.shopName}
                                                onChange={handleChange}
                                                placeholder={t("placeholder_shop")}
                                                className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm font-medium"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">{t("wilaya")}</label>
                                        <WilayaSelector
                                            value={formData.wilayaNumber}
                                            onChange={handleWilayaChange}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">{t("address")}</label>
                            <div className="relative">
                                <MapPin className="absolute left-4 top-4 w-4 h-4 text-gray-300" />
                                <input
                                    type="text"
                                    name="address"
                                    required
                                    value={formData.address}
                                    onChange={handleChange}
                                    placeholder={t("placeholder_address")}
                                    className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm font-medium"
                                />
                            </div>
                        </div>

                        {error && (
                            <div className="p-4 bg-red-50 rounded-2xl border border-red-100 text-red-600 text-xs font-medium">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-primary text-white py-5 rounded-2xl font-bold hover:bg-primary-dark transition-all shadow-xl shadow-primary/30 flex items-center justify-center gap-3 disabled:opacity-50 group"
                        >
                            {loading ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <>
                                    {b("create_account")}
                                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>
                    </form>
                </div>

                <p className="mt-8 text-center text-sm text-gray-500">
                    {t("already_registered")}{" "}
                    <Link href={`/${locale}/login`} className="text-primary font-bold hover:underline underline-offset-4">
                        {t("sign_in_link")}
                    </Link>
                </p>
            </div>
        </div>
    );
}
