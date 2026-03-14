import { supabaseAdmin } from "@/lib/supabase-admin";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const productId = searchParams.get("productId");

    if (!productId) {
        return NextResponse.json({ success: false, error: "productId is required" }, { status: 400 });
    }

    try {
        const { data, error } = await supabaseAdmin
            .from("inventory_logs")
            .select("*")
            .eq("product_id", productId)
            .order("created_at", { ascending: false })
            .limit(10);

        if (error) throw error;

        return NextResponse.json({ success: true, data });
    } catch (error) {
        console.error("Inventory Logs API Error:", error);
        return NextResponse.json({ success: false, error: "Failed to fetch logs" }, { status: 500 });
    }
}
