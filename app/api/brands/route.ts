import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function GET() {
    try {
        // Fetch unique brands from the products table
        // In PostgreSQL, we can use distinct or a separate brands table if it exists.
        // For now, let's fetch distinct brands from the products table as originally intended.
        const { data, error } = await supabaseAdmin
            .from("products")
            .select("brand")
            .not("brand", "is", null);

        if (error) throw error;

        // Extract unique brands and sort them
        const brandSet = new Set<string>();
        data.forEach(item => {
            if (item.brand) brandSet.add(item.brand);
        });
        
        const sortedBrands = Array.from(brandSet).sort();
        
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
