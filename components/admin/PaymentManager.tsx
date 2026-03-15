"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { DollarSign, Check, AlertCircle, Clock } from "lucide-react";

interface PaymentManagerProps {
    orderId: string;
    totalPrice: number;
    currentAmountPaid: number;
    currentPaymentStatus: string;
}

export default function PaymentManager({ orderId, totalPrice, currentAmountPaid, currentPaymentStatus }: PaymentManagerProps) {
    const [amountPaid, setAmountPaid] = useState(currentAmountPaid);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");
    const router = useRouter();

    const balanceDue = Math.max(0, totalPrice - amountPaid);
    const computedStatus = amountPaid >= totalPrice ? "PAID" : amountPaid > 0 ? "PARTIAL" : "UNPAID";

    const handleSave = async () => {
        setLoading(true);
        setMessage("");
        try {
            const res = await fetch("/api/admin/orders/payment", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ orderId, amountPaid }),
            });
            const data = await res.json();
            if (data.success) {
                setMessage("Payment updated successfully.");
                router.refresh();
            } else {
                setMessage(data.message || "Failed to update payment.");
            }
        } catch {
            setMessage("Network error.");
        }
        setLoading(false);
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "PAID":
                return <span className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-xl text-xs font-bold uppercase tracking-widest"><Check className="w-3.5 h-3.5" /> Paid</span>;
            case "PARTIAL":
                return <span className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 text-amber-700 rounded-xl text-xs font-bold uppercase tracking-widest"><AlertCircle className="w-3.5 h-3.5" /> Partial</span>;
            default:
                return <span className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-700 rounded-xl text-xs font-bold uppercase tracking-widest"><Clock className="w-3.5 h-3.5" /> Unpaid</span>;
        }
    };

    return (
        <div className="bg-white rounded-2xl border border-primary/10 shadow-sm p-6 space-y-5">
            <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold uppercase tracking-widest text-[#D4AF37] flex items-center gap-2">
                    <DollarSign className="w-4 h-4" /> Payment Tracking
                </h2>
                {getStatusBadge(computedStatus)}
            </div>

            {/* Summary */}
            <div className="grid grid-cols-3 gap-4">
                <div className="bg-gray-50 rounded-xl p-4 text-center">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Total</p>
                    <p className="text-lg font-bold text-gray-900">{totalPrice.toLocaleString()} <span className="text-xs text-gray-400">DA</span></p>
                </div>
                <div className="bg-emerald-50 rounded-xl p-4 text-center">
                    <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mb-1">Paid</p>
                    <p className="text-lg font-bold text-emerald-700">{amountPaid.toLocaleString()} <span className="text-xs text-emerald-400">DA</span></p>
                </div>
                <div className={`rounded-xl p-4 text-center ${balanceDue > 0 ? 'bg-red-50' : 'bg-gray-50'}`}>
                    <p className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${balanceDue > 0 ? 'text-red-600' : 'text-gray-400'}`}>Balance</p>
                    <p className={`text-lg font-bold ${balanceDue > 0 ? 'text-red-700' : 'text-gray-400'}`}>{balanceDue.toLocaleString()} <span className="text-xs opacity-60">DA</span></p>
                </div>
            </div>

            {/* Payment Input */}
            <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Amount Received (DA)</label>
                <div className="flex gap-3">
                    <input
                        type="number"
                        min="0"
                        max={totalPrice}
                        step="100"
                        value={amountPaid}
                        onChange={(e) => setAmountPaid(Math.max(0, Number(e.target.value)))}
                        className="flex-1 px-4 py-3 bg-gray-50 border-none rounded-xl text-gray-900 font-bold focus:ring-2 focus:ring-primary/20"
                    />
                    <button
                        onClick={() => setAmountPaid(totalPrice)}
                        className="px-4 py-2 text-xs font-bold uppercase tracking-widest bg-emerald-50 text-emerald-700 rounded-xl hover:bg-emerald-100 transition-colors border border-emerald-100"
                    >
                        Full
                    </button>
                </div>
            </div>

            {/* Quick amounts */}
            <div className="flex gap-2 flex-wrap">
                {[0, Math.round(totalPrice * 0.25), Math.round(totalPrice * 0.5), Math.round(totalPrice * 0.75), totalPrice].map((amount) => (
                    <button
                        key={amount}
                        onClick={() => setAmountPaid(amount)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${amountPaid === amount
                            ? 'bg-primary text-white shadow-sm'
                            : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
                            }`}
                    >
                        {amount === 0 ? '0%' : amount === totalPrice ? '100%' : `${Math.round((amount / totalPrice) * 100)}%`}
                    </button>
                ))}
            </div>

            {/* Save Button */}
            <button
                onClick={handleSave}
                disabled={loading || amountPaid === currentAmountPaid}
                className="w-full py-3 bg-primary text-white rounded-xl font-bold shadow-lg shadow-primary/20 hover:bg-primary-dark transition-all disabled:opacity-50 disabled:shadow-none"
            >
                {loading ? "Saving..." : "Update Payment"}
            </button>

            {message && (
                <p className={`text-xs font-medium text-center ${message.includes("success") ? "text-emerald-600" : "text-red-500"}`}>
                    {message}
                </p>
            )}
        </div>
    );
}
