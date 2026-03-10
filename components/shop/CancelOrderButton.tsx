"use client";

import { useState } from "react";
import { XCircle, Loader2 } from "lucide-react";
import { cancelOrderAction } from "@/app/admin/actions/order";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

export default function CancelOrderButton({ orderId }: { orderId: string }) {
    const [loading, setLoading] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const router = useRouter();
    const t = useTranslations("common");

    const handleCancel = async () => {
        setLoading(true);
        try {
            const result = await cancelOrderAction(orderId);
            if (result.success) {
                router.refresh();
            } else {
                alert(result.error || t("alerts.cancel_failed"));
                setShowConfirm(false);
            }
        } catch (error) {
            alert(t("alerts.generic"));
        } finally {
            setLoading(false);
        }
    };

    if (showConfirm) {
        return (
            <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-red-600 animate-pulse">{t("labels.are_you_sure")}</span>
                <button
                    onClick={handleCancel}
                    disabled={loading}
                    className="bg-red-600 text-white px-4 py-2 rounded-full text-xs font-bold hover:bg-red-700 transition-colors flex items-center gap-2"
                >
                    {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                    {t("buttons.confirm_cancellation")}
                </button>
                <button
                    onClick={() => setShowConfirm(false)}
                    disabled={loading}
                    className="text-gray-400 hover:text-gray-900 text-xs font-bold"
                >
                    {t("buttons.back")}
                </button>
            </div>
        );
    }

    return (
        <button
            onClick={() => setShowConfirm(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full border border-red-100 text-sm font-bold text-red-600 hover:bg-red-50 transition-all shadow-sm"
        >
            <XCircle className="w-4 h-4" />
            {t("buttons.cancel_order")}
        </button>
    );
}
