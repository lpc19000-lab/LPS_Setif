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

    try {
        const products = await getActiveProducts({ categoryId, brand, search, collectionSlug, tagSlug, inStock });
        return NextResponse.json({ success: true, data: products });
    } catch (error) {
        return NextResponse.json(
            { success: false, error: "Failed to fetch products" },
            { status: 500 }
        );
    }
}
