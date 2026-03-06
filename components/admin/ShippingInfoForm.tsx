"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Truck, Save, Loader2 } from "lucide-react";

interface Props {
    orderId: string;
    initialData: {
        shippingCompany: string;
        trackingNumber: string;
        shippingDate: string;
    };
}

export default function ShippingInfoForm({ orderId, initialData }: Props) {
    const [formData, setFormData] = useState(initialData);
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await fetch(`/api/admin/orders/${orderId}/shipping`, {
                method: "PATCH",
                body: JSON.stringify(formData),
                headers: { "Content-Type": "application/json" }
            });

            if (!res.ok) throw new Error("Failed to update shipping info");

            router.refresh();
        } catch (error) {
            console.error(error);
            alert("Error updating shipping information.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
                <input
                    type="text"
                    placeholder="Courier Company (e.g. Yalidine)"
                    className="col-span-1 px-3 py-2 bg-gray-50 border border-gray-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/20"
                    value={formData.shippingCompany}
                    onChange={(e) => setFormData({ ...formData, shippingCompany: e.target.value })}
                />
                <input
                    type="text"
                    placeholder="Tracking Number"
                    className="col-span-1 px-3 py-2 bg-gray-50 border border-gray-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/20"
                    value={formData.trackingNumber}
                    onChange={(e) => setFormData({ ...formData, trackingNumber: e.target.value })}
                />
            </div>
            <div className="flex items-center gap-3">
                <input
                    type="date"
                    className="flex-1 px-3 py-2 bg-gray-50 border border-gray-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/20"
                    value={formData.shippingDate}
                    onChange={(e) => setFormData({ ...formData, shippingDate: e.target.value })}
                />
                <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 bg-primary-dark text-white rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-black transition-colors disabled:opacity-50"
                >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Save Info
                </button>
            </div>
        </form>
    );
}
