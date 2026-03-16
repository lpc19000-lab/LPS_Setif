"use client";

import { useState } from "react";
import { RotateCcw } from "lucide-react";

export default function ResetProfitButton() {
    const [isPending, setIsPending] = useState(false);
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

    const handleReset = async () => {
        if (!confirm("Are you sure you want to reset all profit data? This will zero out sales_units_sold and sales_revenue for all products. This action cannot be undone.")) {
            return;
        }

        setIsPending(true);
        setMessage(null);

        try {
            const res = await fetch("/api/admin/reset-profit", { method: "POST" });
            const data = await res.json();

            if (data.success) {
                setMessage({ type: "success", text: "Profit data has been reset successfully." });
                // Refresh the page after a short delay
                setTimeout(() => window.location.reload(), 1500);
            } else {
                setMessage({ type: "error", text: data.error || "Failed to reset profit data." });
            }
        } catch {
            setMessage({ type: "error", text: "An unexpected error occurred." });
        } finally {
            setIsPending(false);
        }
    };

    return (
        <div className="inline-flex flex-col items-end gap-2">
            <button
                onClick={handleReset}
                disabled={isPending}
                className="flex items-center gap-2 px-4 py-2 bg-red-50 border border-red-200 text-red-700 text-sm font-bold rounded-xl hover:bg-red-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
                <RotateCcw className={`w-4 h-4 ${isPending ? "animate-spin" : ""}`} />
                {isPending ? "Resetting..." : "Reset Profit Data"}
            </button>
            {message && (
                <span className={`text-xs font-medium ${message.type === "success" ? "text-emerald-600" : "text-red-600"}`}>
                    {message.text}
                </span>
            )}
        </div>
    );
}
