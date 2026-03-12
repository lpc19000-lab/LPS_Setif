"use client";

import { useState } from "react";
import { KeyRound, X, Loader2 } from "lucide-react";

export default function ResetPasswordButton({ customerId, customerName }: { customerId: string; customerName: string }) {
    const [isOpen, setIsOpen] = useState(false);
    const [newPassword, setNewPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

    const handleReset = async () => {
        if (!newPassword || newPassword.length < 6) {
            setResult({ success: false, message: "Password must be at least 6 characters" });
            return;
        }
        setLoading(true);
        setResult(null);
        try {
            const res = await fetch("/api/admin/customers/reset-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ customerId, newPassword }),
            });
            const data = await res.json();
            setResult({ success: data.success, message: data.message || data.error });
            if (data.success) {
                setTimeout(() => {
                    setIsOpen(false);
                    setNewPassword("");
                    setResult(null);
                }, 1500);
            }
        } catch {
            setResult({ success: false, message: "Something went wrong" });
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="px-3 py-1.5 text-xs font-medium text-gray-500 hover:text-[#D4AF37] hover:bg-[#D4AF37]/10 rounded-lg transition-colors inline-flex items-center gap-1.5"
                title={`Reset password for ${customerName}`}
            >
                <KeyRound className="w-3.5 h-3.5" /> Reset
            </button>

            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl p-6 relative">
                        <button
                            onClick={() => { setIsOpen(false); setResult(null); setNewPassword(""); }}
                            className="absolute top-3 right-3 p-1.5 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>

                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-xl bg-[#D4AF37]/10 flex items-center justify-center">
                                <KeyRound className="w-5 h-5 text-[#D4AF37]" />
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-900">Reset Password</h3>
                                <p className="text-xs text-gray-500">{customerName}</p>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <input
                                type="password"
                                placeholder="New password (min 6 characters)"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/30"
                            />

                            {result && (
                                <div className={`p-3 rounded-xl text-xs font-medium ${result.success ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-red-50 text-red-600 border border-red-100'}`}>
                                    {result.message}
                                </div>
                            )}

                            <button
                                onClick={handleReset}
                                disabled={loading}
                                className="w-full bg-primary text-white py-3 rounded-xl font-medium text-sm hover:bg-primary-dark transition-all shadow-sm disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Reset Password"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
