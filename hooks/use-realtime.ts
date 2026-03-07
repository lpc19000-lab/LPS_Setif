"use client";

import { useEffect } from "react";
import { supabase } from "@/lib/supabase";

export function useRealtime(
    table: string,
    callback: (payload: any) => void,
    event: "INSERT" | "UPDATE" | "DELETE" | "*" = "*"
) {
    useEffect(() => {
        const channel = supabase
            .channel(`realtime-${table}`)
            .on(
                "postgres_changes",
                {
                    event,
                    schema: "public",
                    table,
                },
                (payload) => {
                    callback(payload);
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [table, callback, event]);
}
