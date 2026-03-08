import { NextResponse } from "next/server";
import { getActiveProducts } from "@/services/product-service";

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get("categoryId") || undefined;
    const brand = searchParams.get("brand") || undefined;
    const search = searchParams.get("search") || undefined;
    const collectionSlug = searchParams.get("collection") || undefined;
    const tagSlug = searchParams.get("tag") || undefined;
    const inStock = searchParams.get("inStock") === "true" || undefined;

    const limit = Number(searchParams.get("limit")) || 20;
    const page = Number(searchParams.get("page")) || 1;
    const skip = (page - 1) * limit;

    try {
        const { products, total } = await getActiveProducts({ 
            categoryId, 
            brand, 
            search, 
            collectionSlug, 
            tagSlug, 
            inStock,
            limit,
            skip
        });
        
        const response = NextResponse.json({ 
            success: true, 
            data: products,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        });

        // Add caching headers for high traffic
        response.headers.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=30');
        
        return response;
    } catch (error) {
        return NextResponse.json(
            { success: false, error: "Failed to fetch products" },
            { status: 500 }
        );
    }
}
