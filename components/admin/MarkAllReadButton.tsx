"use client";

import { CheckCheck } from "lucide-react";
import { useRouter } from "next/navigation";

export default function MarkAllReadButton() {
    const router = useRouter();

    const handleMarkAll = async () => {
        await fetch("/api/admin/notifications", { method: "PUT" });
        router.refresh();
    };

    return (
        <button
            onClick={handleMarkAll}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium bg-primary/10 text-primary-dark hover:bg-primary/20 rounded-xl transition-colors"
        >
            <CheckCheck className="w-4 h-4" />
            Mark all as read
        </button>
    );
}
