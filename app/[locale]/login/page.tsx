"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Phone, ArrowRight, Loader2, ShieldCheck } from "lucide-react";

export default function LoginPage() {
    const [phone, setPhone] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const response = await fetch("/api/customers/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ phone }),
            });

            const data = await response.json();

            if (data.success) {
                router.push("/account");
                router.refresh();
            } else {
                setError(data.error || "Login failed");
            }
        } catch (err) {
            setError("Something went wrong. Please try again.");
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
                    <h1 className="text-4xl font-serif font-bold text-primary-dark mb-3 tracking-tight">Trader Access</h1>
                    <p className="text-gray-400 text-sm tracking-wide">Enter your registered phone number to access your wholesale dashboard.</p>
                </div>

                {/* Form */}
                <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-xl shadow-gray-200/50 relative overflow-hidden group">
                    <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
                        <div>
                            <label htmlFor="phone" className="block text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-2">
                                Phone Number
                            </label>
                            <div className="relative">
                                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300" />
                                <input
                                    id="phone"
                                    type="tel"
                                    required
                                    placeholder="05 / 06 / 07 ..."
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-gray-900 font-medium placeholder:text-gray-300"
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
                                    Secure Login
                                    <ArrowRight className="w-5 h-5 group-hover/btn:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>
                    </form>

                    {/* Gold accent decoration */}
                    <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-[#D4AF37]/5 rounded-full blur-3xl group-hover:bg-[#D4AF37]/10 transition-colors"></div>
                </div>

                {/* Footer Links */}
                <div className="mt-10 text-center space-y-4">
                    <p className="text-sm text-gray-500">
                        Don't have a trader account?{" "}
                        <Link href="/register" className="text-primary font-bold hover:underline decoration-2 underline-offset-4">
                            Register now
                        </Link>
                    </p>
                    <div className="flex justify-center items-center gap-6 pt-4">
                        <Link href="/" className="text-[10px] font-black uppercase tracking-widest text-gray-300 hover:text-primary transition-colors">
                            Store Home
                        </Link>
                        <span className="w-1.5 h-1.5 rounded-full bg-gray-100"></span>
                        <Link href="/catalog" className="text-[10px] font-black uppercase tracking-widest text-gray-300 hover:text-primary transition-colors">
                            Catalog
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
