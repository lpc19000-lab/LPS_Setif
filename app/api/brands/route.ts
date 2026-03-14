import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function GET() {
    try {
        const { data, error } = await supabaseAdmin
            .from("brands")
            .select("name")
            .order("name", { ascending: true });

        if (error) throw error;

        const sortedBrands = data.map(b => b.name);
        
        const response = NextResponse.json({ 
            success: true, 
            data: sortedBrands 
        });

        // Cache for 1 hour
        response.headers.set('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=600');
        
        return response;
    } catch (error) {
        console.error("Brands fetch error:", error);
        return NextResponse.json(
            { success: false, error: "Failed to fetch brands" },
            { status: 500 }
        );
    }
}
