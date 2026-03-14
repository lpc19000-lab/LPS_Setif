"use client";

import { useRealtimeRefresh } from "@/hooks/use-realtime";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

export default function RealtimeReloader() {
    const router = useRouter();
    const { lastUpdate } = useRealtimeRefresh(["orders", "products", "inventory_logs"]);
    const isFirstRender = useRef(true);

    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false;
            return;
        }
        // Refresh the page data when realtime updates arrive
        router.refresh();
    }, [lastUpdate, router]);

    return null;
}
