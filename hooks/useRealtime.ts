"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type RealtimeEvent = "INSERT" | "UPDATE" | "DELETE" | "*";

interface UseRealtimeOptions<T> {
    table: string;
    event?: RealtimeEvent;
    schema?: string;
    onInsert?: (newRecord: T) => void;
    onUpdate?: (newRecord: T) => void;
    onDelete?: (oldRecord: T) => void;
    onChange?: (payload: { eventType: string; new: T; old: T }) => void;
}

/**
 * Supabase Realtime Hook
 * Subscribes to real-time changes on a specific table.
 * 
 * Usage:
 * ```
 * useRealtime<Product>({
 *   table: 'products',
 *   onChange: (payload) => {
 *     console.log('Change:', payload);
 *     router.refresh(); // or update state
 *   }
 * });
 * ```
 */
export function useRealtime<T = any>({
    table,
    event = "*",
    schema = "public",
    onInsert,
    onUpdate,
    onDelete,
    onChange,
}: UseRealtimeOptions<T>) {
    const [isSubscribed, setIsSubscribed] = useState(false);

    useEffect(() => {
        const channel = supabase
            .channel(`realtime-${table}`)
            .on(
                "postgres_changes" as any,
                {
                    event,
                    schema,
                    table,
                },
                (payload: any) => {
                    const eventType = payload.eventType;
                    const newRecord = payload.new as T;
                    const oldRecord = payload.old as T;

                    // Call specific handlers
                    if (eventType === "INSERT" && onInsert) {
                        onInsert(newRecord);
                    }
                    if (eventType === "UPDATE" && onUpdate) {
                        onUpdate(newRecord);
                    }
                    if (eventType === "DELETE" && onDelete) {
                        onDelete(oldRecord);
                    }

                    // Call generic handler
                    if (onChange) {
                        onChange({ eventType, new: newRecord, old: oldRecord });
                    }
                }
            )
            .subscribe((status: string) => {
                setIsSubscribed(status === "SUBSCRIBED");
            });

        return () => {
            supabase.removeChannel(channel);
            setIsSubscribed(false);
        };
    }, [table, event, schema]);

    return { isSubscribed };
}

/**
 * Hook to auto-refresh on table changes.
 * Simply triggers a router.refresh() when any change occurs.
 */
export function useRealtimeRefresh(tables: string[]) {
    const [lastUpdate, setLastUpdate] = useState<number>(Date.now());

    useEffect(() => {
        const channels = tables.map((table) => {
            return supabase
                .channel(`refresh-${table}`)
                .on(
                    "postgres_changes" as any,
                    {
                        event: "*",
                        schema: "public",
                        table,
                    },
                    () => {
                        setLastUpdate(Date.now());
                    }
                )
                .subscribe();
        });

        return () => {
            channels.forEach((channel) => supabase.removeChannel(channel));
        };
    }, [tables.join(",")]);

    return { lastUpdate };
}
