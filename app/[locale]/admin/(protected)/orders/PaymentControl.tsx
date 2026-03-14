"use client";

import { useState } from "react";
import { DollarSign, Save, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { updateOrderPayment } from "@/app/[locale]/admin/actions/order";

interface PaymentControlProps {
    orderId: string;
    totalAmount: number;
    currentPaid: number;
    currentStatus: string;
}

export default function PaymentControl({ orderId, totalAmount, currentPaid, currentStatus }: PaymentControlProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [amountPaid, setAmountPaid] = useState(currentPaid);
    const [isPending, setIsPending] = useState(false);
    const router = useRouter();

    const handleSave = async () => {
        setIsPending(true);
        try {
            await updateOrderPayment(orderId, amountPaid);
            setIsEditing(false);
            router.refresh();
        } catch (error) {
            console.error("Failed to update payment:", error);
            alert("Error updating payment");
        } finally {
            setIsPending(false);
        }
    };

    const remaining = totalAmount - amountPaid;

    return (
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-primary" />
                    <h3 className="text-sm font-bold text-gray-900">Payment Control</h3>
                </div>
                {!isEditing ? (
                    <button
                        onClick={() => setIsEditing(true)}
                        className="text-xs font-bold text-primary hover:underline"
                    >
                        Edit Payment
                    </button>
                ) : (
                    <div className="flex gap-2">
                        <button
                            onClick={handleSave}
                            disabled={isPending}
                            className="p-1.5 bg-emerald-500 text-white rounded hover:bg-emerald-600 disabled:opacity-50"
                        >
                            <Save className="w-3.5 h-3.5" />
                        </button>
                        <button
                            onClick={() => {
                                setIsEditing(false);
                                setAmountPaid(currentPaid);
                            }}
                            className="p-1.5 bg-gray-100 text-gray-500 rounded hover:bg-gray-200"
                        >
                            <X className="w-3.5 h-3.5" />
                        </button>
                    </div>
                )}
            </div>

            <div className="space-y-3">
                <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-500">Total Amount:</span>
                    <span className="font-bold">{totalAmount.toLocaleString()} DA</span>
                </div>

                <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-500">Amount Paid:</span>
                    {isEditing ? (
                        <input
                            type="number"
                            value={amountPaid}
                            onChange={(e) => setAmountPaid(Number(e.target.value))}
                            className="w-24 px-2 py-1 border border-primary/30 rounded focus:ring-1 focus:ring-primary outline-none text-right font-bold"
                        />
                    ) : (
                        <span className="font-bold text-emerald-600">{currentPaid.toLocaleString()} DA</span>
                    )}
                </div>

                <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-500">Remaining Balance:</span>
                    <span className={`font-bold ${remaining > 0 ? "text-red-600" : "text-emerald-600"}`}>
                        {remaining.toLocaleString()} DA
                    </span>
                </div>

                <div className="pt-2 mt-2 border-t border-gray-50 flex items-center justify-between">
                    <span className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">Status</span>
                    <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${currentStatus === 'PAID' ? 'bg-emerald-100 text-emerald-700' :
                        currentStatus === 'PARTIALLY_PAID' ? 'bg-amber-100 text-amber-700' :
                            'bg-red-100 text-red-700'
                        }`}>
                        {currentStatus.replace('_', ' ')}
                    </span>
                </div>
            </div>
        </div>
    );
}
