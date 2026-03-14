import { supabaseAdmin } from "@/lib/supabase-admin";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const wilayaId = searchParams.get("wilayaId");

    if (!wilayaId) {
        return NextResponse.json({ success: false, error: "wilayaId is required" }, { status: 400 });
    }

    try {
        const { data, error } = await supabaseAdmin
            .from("communes")
            .select("*")
            .eq("wilaya_id", wilayaId)
            .order("name", { ascending: true });

        if (error) throw error;

        return NextResponse.json({ success: true, data });
    } catch (error) {
        console.error("Communes API Error:", error);
        return NextResponse.json({ success: false, error: "Failed to fetch communes" }, { status: 500 });
    }
}
