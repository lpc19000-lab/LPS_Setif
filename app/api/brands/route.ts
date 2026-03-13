import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

export async function GET() {
    try {
        // We can get brands from the products themselves to ensure we only show brands that have products
        // For performance with many products, a separate 'brands' or 'manufacturers' collection is better
        // Let's check manufacturers first
        const manufacturersSnap = await adminDb.collection("manufacturers").get();
        let brands: string[] = [];
        
        if (!manufacturersSnap.empty) {
            brands = manufacturersSnap.docs.map(doc => doc.data().name).filter(Boolean);
        } else {
            // Fallback to scanning products (less efficient but works if manufacturers collection is empty)
            const productsSnap = await adminDb.collection("products").select("brand").get();
            const brandSet = new Set<string>();
            productsSnap.forEach(doc => {
                const b = doc.data().brand;
                if (b) brandSet.add(b);
            });
            brands = Array.from(brandSet);
        }

        const sortedBrands = brands.sort();
        
        const response = NextResponse.json({ 
            success: true, 
            data: sortedBrands 
        });

        // Cache for 1 hour as brands don't change often
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
