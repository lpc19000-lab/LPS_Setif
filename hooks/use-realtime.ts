"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import { supabase } from "@/lib/supabase";

/**
 * Hook for subscribing to Supabase real-time changes using Channels.
 */
export function useRealtime(
    tableName: string,
    callback: (payload: any) => void,
    event: "INSERT" | "UPDATE" | "DELETE" | "*" = "*",
    filter?: string
) {
    const callbackRef = useRef(callback);

    useEffect(() => {
        callbackRef.current = callback;
    }, [callback]);

    useEffect(() => {
        if (!tableName) return;

        const channel = supabase
            .channel(`public:${tableName}${filter ? `:${filter}` : ''}`)
            .on(
                'postgres_changes',
                {
                    event: event,
                    schema: 'public',
                    table: tableName,
                    filter: filter
                },
                (payload) => {
                    callbackRef.current(payload);
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [tableName, event, filter]);
}

/**
 * Hook for refreshing UI state when any of the specified tables change.
 */
export function useRealtimeRefresh(tableNames: string[]) {
    const [lastUpdate, setLastUpdate] = useState<number>(Date.now());
    
    // Memoize the array to prevent unnecessary re-subscriptions
    const tables = useMemo(() => tableNames, [JSON.stringify(tableNames)]);

    useEffect(() => {
        if (!tables || tables.length === 0) return;

        const channels = tables.map(tableName => {
            return supabase
                .channel(`refresh:${tableName}`)
                .on(
                    'postgres_changes',
                    { event: '*', schema: 'public', table: tableName },
                    () => {
                        setLastUpdate(Date.now());
                    }
                )
                .subscribe();
        });

        return () => {
            channels.forEach(ch => supabase.removeChannel(ch));
        };
    }, [tables]);

    return { lastUpdate };
}
