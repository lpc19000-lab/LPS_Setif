"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Shield } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useLocale } from "next-intl";

export default function AdminLogin() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const locale = useLocale();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            console.log(`[AdminLogin] Attempting login for email: ${email}`);
            const res = await fetch("/api/admin/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
            });

            const data = await res.json();
            console.log(`[AdminLogin] Response:`, data);

            if (data.success) {
                console.log(`[AdminLogin] Success. Role: ${data.role}`);
                // Determine layout path based on role if needed
                const targetPath = `/${locale}/admin/dashboard`;
                console.log(`[AdminLogin] Redirecting to: ${targetPath}`);
                router.push(targetPath);
                router.refresh();
            } else {
                console.warn(`[AdminLogin] Failed:`, data.error);
                setError(data.error || "Login failed");
            }
        } catch (err) {
            console.error("[AdminLogin] Unexpected error:", err);
            setError("Something went wrong. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center p-6 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]">
            <Link href="/" className="absolute top-8 left-8 text-primary/60 hover:text-primary transition-colors text-sm font-medium tracking-wider flex items-center gap-2">
                ← Back to Store
            </Link>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="w-full max-w-md bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-10 sm:p-14 border border-primary/5 relative overflow-hidden"
            >
                {/* Decorative Elements */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent opacity-50" />
                <div className="absolute -top-24 -right-24 w-48 h-48 bg-[#D4AF37]/5 rounded-full blur-3xl pointer-events-none" />

                <div className="flex flex-col items-center mb-10 relative z-10">
                    <div className="w-16 h-16 bg-[#D4AF37]/10 rounded-2xl flex items-center justify-center mb-6 shadow-inner">
                        <Shield className="w-8 h-8 text-[#D4AF37]" strokeWidth={1.5} />
                    </div>
                    <h1 className="font-serif text-3xl font-bold text-primary-dark mb-2">Admin Portal</h1>
                    <p className="text-gray-500 text-sm tracking-wide">Enter your credentials to access the dashboard</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-6 relative z-10">
                    {error && (
                        <div className="bg-red-50 text-red-600 text-sm py-3 px-4 rounded-xl text-center border border-red-100 flex items-center justify-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-red-600" />
                            {error}
                        </div>
                    )}

                    <div className="space-y-2">
                        <label className="text-xs font-semibold uppercase tracking-wider text-gray-400 ml-1">Email Address</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-[#f8f9fa] border border-gray-200 text-primary-dark text-sm rounded-xl focus:ring-2 focus:ring-[#D4AF37]/30 focus:border-[#D4AF37] block p-4 transition-all duration-300 outline-none"
                            placeholder="admin@lpsperfume.com"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-semibold uppercase tracking-wider text-gray-400 ml-1">Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-[#f8f9fa] border border-gray-200 text-primary-dark text-sm rounded-xl focus:ring-2 focus:ring-[#D4AF37]/30 focus:border-[#D4AF37] block p-4 transition-all duration-300 outline-none"
                            placeholder="••••••••"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className={`w-full text-white bg-primary hover:bg-primary-dark focus:ring-4 focus:outline-none focus:ring-[#D4AF37]/30 font-medium rounded-xl text-sm px-5 py-4 text-center transition-all ${loading ? "opacity-70 cursor-not-allowed" : "shadow-lg shadow-primary/20 hover:shadow-primary/40 -translate-y-0.5 mt-2"
                            }`}
                    >
                        {loading ? "Authenticating..." : "Secure Access"}
                    </button>
                </form>

                <div className="mt-8 text-center text-xs text-gray-400 flex items-center justify-center gap-2 flex-col">
                    <p>Authorized personnel only.</p>
                    <p className="font-mono text-[10px] opacity-50 text-gray-500">IP LOGGED: {new Date().toISOString().split('T')[0]}</p>
                </div>
            </motion.div>
        </div>
    );
}
