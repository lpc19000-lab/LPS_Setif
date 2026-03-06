"use client";

import { useState } from "react";
import { ShoppingCart, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

interface ReorderButtonProps {
    orderId: string;
}

export default function ReorderButton({ orderId }: ReorderButtonProps) {
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleReorder = async () => {
        setLoading(true);
        try {
            const response = await fetch("/api/orders/reorder", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ orderId }),
            });

            const data = await response.json();

            if (data.success) {
                router.push("/cart");
                router.refresh();
            } else {
                alert(data.error || "Failed to add items to cart");
            }
        } catch (error) {
            console.error("Reorder failed:", error);
            alert("Something went wrong. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <button
            onClick={handleReorder}
            disabled={loading}
            className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-primary text-white text-sm font-bold hover:bg-primary-dark transition-all shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed group"
        >
            {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
                <ShoppingCart className="w-4 h-4 group-hover:scale-110 transition-transform" />
            )}
            Reorder
        </button>
    );
}
