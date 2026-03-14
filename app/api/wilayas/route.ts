import { supabaseAdmin } from "@/lib/supabase-admin";
import { NextResponse } from "next/server";

export async function GET() {
    try {
        const { data, error } = await supabaseAdmin
            .from("wilayas")
            .select("*")
            .order("number", { ascending: true });

        if (error) throw error;

        return NextResponse.json({ success: true, data });
    } catch (error) {
        console.error("Wilayas API Error:", error);
        return NextResponse.json({ success: false, error: "Failed to fetch wilayas" }, { status: 500 });
    }
}
