"use client";

import { useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import type { RealtimeChannel, RealtimePostgresChangesFilter } from "@supabase/supabase-js";

/**
 * Hook for subscribing to Supabase Realtime postgres_changes.
 * Uses useRef for the callback to avoid channel recreation on callback changes.
 * Supports optional filter for row-level filtering.
 */
export function useRealtime(
    table: string,
    callback: (payload: any) => void,
    event: "INSERT" | "UPDATE" | "DELETE" | "*" = "*",
    filter?: string
) {
    const callbackRef = useRef(callback);

    // Keep the callback ref up to date without re-subscribing
    useEffect(() => {
        callbackRef.current = callback;
    }, [callback]);

    useEffect(() => {
        const channelConfig: RealtimePostgresChangesFilter<any> = {
            event,
            schema: "public",
            table,
        };

        if (filter) {
            channelConfig.filter = filter;
        }

        const channel: RealtimeChannel = supabase
            .channel(`realtime-${table}-${event}-${filter || "all"}`)
            .on(
                "postgres_changes" as any,
                channelConfig,
                (payload: any) => {
                    callbackRef.current(payload);
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [table, event, filter]);
}
