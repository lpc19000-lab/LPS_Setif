"use client";

import { useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export function useRealtime(table: string) {
    const router = useRouter();

    useEffect(() => {
        const channel = supabase
            .channel(`public:${table}`)
            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: table,
                },
                () => {
                    router.refresh();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [table, router]);
}
