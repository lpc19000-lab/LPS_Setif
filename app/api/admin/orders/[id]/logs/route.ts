import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        
        // In Supabase, order status logs are stored in the order_status_logs table 
        // linked to the order via order_id.
        const { data: logs, error } = await supabaseAdmin
            .from("order_status_logs")
            .select("*")
            .eq("order_id", id)
            .order("created_at", { ascending: false });

        if (error) throw error;

        return NextResponse.json(logs || []);
    } catch (error: any) {
        console.error("[OrderLogsAPI] Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
