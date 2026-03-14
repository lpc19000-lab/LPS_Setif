"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Phone, ArrowRight, Loader2, ShieldCheck, Lock } from "lucide-react";
import { useTranslations, useLocale } from "next-intl";

export default function LoginPage() {
    const t = useTranslations("login");
    const locale = useLocale();
    const [phone, setPhone] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            console.log(`[LoginForm] Attempting login for phone: ${phone}`);
            const response = await fetch("/api/customers/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ phone, password }),
            });

            const data = await response.json();
            console.log(`[LoginForm] Login Response:`, data);

            if (data.success) {
                const role = data.data.role;
                console.log(`[LoginForm] Login Success. Role: ${role}`);
                if (role === "ADMIN" || role === "SUPER_ADMIN" || role === "VENDOR") {
                    console.log(`[LoginForm] Redirecting to Admin Dashboard`);
                    router.push(`/${locale}/admin/dashboard`);
                } else {
                    console.log(`[LoginForm] Redirecting to Account`);
                    router.push(`/${locale}/account`);
                }
                router.refresh();
            } else {
                console.warn(`[LoginForm] Login Failed:`, data.error);
                setError(data.message || data.error || t("error_login_failed"));
            }
        } catch (err) {
            console.error("[LoginForm] Unexpected Login Error:", err);
            setError(t("error_generic"));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6 pt-20 pb-12">
            <div className="max-w-md w-full">
                {/* Logo & Header */}
                <div className="text-center mb-12">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/5 mb-6">
                        <ShieldCheck className="w-8 h-8 text-primary" strokeWidth={1.5} />
                    </div>
                    <h1 className="text-4xl font-serif font-bold text-primary-dark mb-3 tracking-tight">{t("title")}</h1>
                    <p className="text-gray-400 text-sm tracking-wide">{t("subtitle")}</p>
                </div>

                {/* Form */}
                <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-xl shadow-gray-200/50 relative overflow-hidden group">
                    <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
                        <div>
                            <label htmlFor="phone" className="block text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-2">
                                {t("phone_label")}
                            </label>
                            <div className="relative">
                                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300 rtl:left-auto rtl:right-4" />
                                <input
                                    id="phone"
                                    type="tel"
                                    required
                                    placeholder={t("phone_placeholder")}
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-gray-900 font-medium placeholder:text-gray-300 rtl:pl-4 rtl:pr-12"
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-2">
                                {t("password_label")}
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300 rtl:left-auto rtl:right-4" />
                                <input
                                    id="password"
                                    type="password"
                                    required
                                    placeholder={t("password_placeholder")}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-gray-900 font-medium placeholder:text-gray-300 rtl:pl-4 rtl:pr-12"
                                />
                            </div>
                        </div>

                        {error && (
                            <div className="p-4 bg-red-50 rounded-2xl border border-red-100 text-red-600 text-xs font-medium animate-shake">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-primary text-white py-4 rounded-2xl font-bold hover:bg-primary-dark transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-3 disabled:opacity-50 group/btn"
                        >
                            {loading ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <>
                                    {t("submit")}
                                    <ArrowRight className="w-5 h-5 group-hover/btn:translate-x-1 transition-transform rtl:rotate-180" />
                                </>
                            )}
                        </button>
                    </form>

                    {/* Divider */}
                    <div className="relative my-8">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-gray-100"></div>
                        </div>
                        <div className="relative flex justify-center text-[10px] font-black uppercase tracking-[0.3em]">
                            <span className="px-4 bg-white text-gray-400">{t("or") || "OU"}</span>
                        </div>
                    </div>

                    {/* Google Login Button - Disabled until Supabase Auth is configured */}
                    <button
                        onClick={() => {
                            setError("Google login is currently being migrated. Please use phone/password.");
                        }}
                        className="w-full bg-white border border-gray-100 text-gray-400 py-4 rounded-2xl font-bold cursor-not-allowed flex items-center justify-center gap-3"
                    >
                        <svg className="w-5 h-5 opacity-50" viewBox="0 0 24 24">
                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.16H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.84l3.66-2.75z" fill="#FBBC05" />
                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.16l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                        </svg>
                        {t("continue_with_google") || "Continuer avec Google"}
                    </button>

                    {/* Gold accent decoration */}
                    <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-[#D4AF37]/5 rounded-full blur-3xl group-hover:bg-[#D4AF37]/10 transition-colors"></div>
                </div>

                {/* Footer Links */}
                <div className="mt-10 text-center space-y-4">
                    <p className="text-sm text-gray-500">
                        {t("no_account")}{" "}
                        <Link href={`/${locale}/register`} className="text-primary font-bold hover:underline decoration-2 underline-offset-4">
                            {t("register_link")}
                        </Link>
                    </p>
                    <div className="flex justify-center items-center gap-6 pt-4">
                        <Link href={`/${locale}`} className="text-[10px] font-black uppercase tracking-widest text-gray-300 hover:text-primary transition-colors">
                            {t("store_home")}
                        </Link>
                        <span className="w-1.5 h-1.5 rounded-full bg-gray-100"></span>
                        <Link href={`/${locale}/catalog`} className="text-[10px] font-black uppercase tracking-widest text-gray-300 hover:text-primary transition-colors">
                            {t("catalog_link")}
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
