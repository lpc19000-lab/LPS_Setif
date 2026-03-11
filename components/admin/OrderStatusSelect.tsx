"use client";

import { useState } from "react";
import { OrderStatus } from "@/lib/constants";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";

interface Props {
    orderId: string;
    currentStatus: OrderStatus;
}

const statusOptions = [
    { value: "PENDING", label: "Pending (New)", color: "bg-amber-100 text-amber-700" },
    { value: "CONFIRMED", label: "Confirmed (Approved)", color: "bg-blue-100 text-blue-700" },
    { value: "PREPARING", label: "Preparing (Warehouse)", color: "bg-indigo-100 text-indigo-700" },
    { value: "SHIPPED", label: "Shipped (In Transit)", color: "bg-purple-100 text-purple-700" },
    { value: "DELIVERED", label: "Delivered (Completed)", color: "bg-emerald-100 text-emerald-700" },
    { value: "CANCELLED", label: "Cancelled (Stock Restored)", color: "bg-red-100 text-red-700" },
];

export default function OrderStatusSelect({ orderId, currentStatus }: Props) {
    const [status, setStatus] = useState<OrderStatus>(currentStatus);
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleChange = async (newStatus: OrderStatus) => {
        if (newStatus === status) return;

        setLoading(true);
        try {
            const res = await fetch(`/api/admin/orders/${orderId}/shipping`, {
                method: "PATCH",
                body: JSON.stringify({ status: newStatus }),
                headers: { "Content-Type": "application/json" }
            });

            if (!res.ok) throw new Error("Failed to update status");

            setStatus(newStatus);
            router.refresh();
        } catch (error) {
            console.error(error);
            alert("Error updating order status.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-wrap gap-2">
            {statusOptions.map((opt) => (
                <button
                    key={opt.value}
                    onClick={() => handleChange(opt.value as OrderStatus)}
                    disabled={loading}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 border ${status === opt.value
                            ? `${opt.color} border-current shadow-sm`
                            : "bg-white text-gray-400 border-gray-100 hover:border-gray-300"
                        }`}
                >
                    {status === opt.value && <Check className="w-3 h-3" />}
                    {opt.label}
                </button>
            ))}
        </div>
    );
}
