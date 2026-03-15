"use client";

import { useState } from "react";
import { ShieldAlert, ShieldCheck } from "lucide-react";
import { toggleCustomerStatus } from "@/app/[locale]/admin/actions/customer";
import { useTranslations } from "next-intl";

interface ToggleCustomerStatusButtonProps {
    customerId: string;
    currentStatus: string;
}

export default function ToggleCustomerStatusButton({ customerId, currentStatus }: ToggleCustomerStatusButtonProps) {
    const t = useTranslations("admin.customers");
    const [isPending, setIsPending] = useState(false);
    
    const isActive = currentStatus !== "SUSPENDED";
    const newStatus = isActive ? "SUSPENDED" : "ACTIVE";

    const handleToggle = async () => {
        setIsPending(true);
        const res = await toggleCustomerStatus(customerId, newStatus);
        setIsPending(false);
        if (!res.success) {
            alert(res.error);
        }
    };

    return (
        <button
            onClick={handleToggle}
            disabled={isPending}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors inline-flex items-center gap-1.5 rtl:flex-row-reverse shadow-sm ${
                isActive 
                    ? "text-gray-500 hover:text-red-700 hover:bg-red-50 disabled:opacity-50"
                    : "text-red-700 bg-red-50 hover:bg-green-50 hover:text-green-700 disabled:opacity-50 border border-red-200"
            }`}
            title={isActive ? t("suspend_title") : t("restore_title")}
        >
            {isActive ? (
                <>
                    <ShieldAlert className="w-3.5 h-3.5" />
                    {isPending ? "..." : t("suspend")}
                </>
            ) : (
                <>
                    <ShieldCheck className="w-3.5 h-3.5" />
                    {isPending ? "..." : t("restore")}
                </>
            )}
        </button>
    );
}
