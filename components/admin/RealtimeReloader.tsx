"use client";

import { useRealtime } from "@/hooks/useRealtime";

export default function RealtimeReloader() {
    useRealtime("orders");
    useRealtime("products");
    useRealtime("inventory_logs");

    return null;
}
