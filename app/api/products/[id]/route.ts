import { NextResponse } from "next/server";
import { getProductById, updateProduct, deleteProduct } from "@/services/product-service";

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    console.log(`[ProductAPI] Fetching product: ${id}`);
    try {
        let product = await getProductById(id);
        
        // If not found by ID, try finding by Slug
        if (!product) {
            console.log(`[ProductAPI] Product not found by ID, trying slug: ${id}`);
            const { getProductBySlug } = await import("@/services/product-service");
            product = await getProductBySlug(id);
        }

        if (!product) {
            console.warn(`[ProductAPI] Product NOT FOUND: ${id}`);
            return NextResponse.json(
                { success: false, error: "Product not found" },
                { status: 404 }
            );
        }
        console.log(`[ProductAPI] Product found: ${product.name}`);
        return NextResponse.json({ success: true, data: product });
    } catch (error) {
        console.error(`[ProductAPI] Fetch error for ${id}:`, error);
        return NextResponse.json(
            { success: false, error: "Failed to fetch product" },
            { status: 500 }
        );
    }
}

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    try {
        const body = await request.json();
        const product = await updateProduct(id, body);
        return NextResponse.json({ success: true, data: product });
    } catch (error) {
        return NextResponse.json(
            { success: false, error: "Failed to update product" },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    try {
        await deleteProduct(id);
        return NextResponse.json({ success: true, message: "Product deleted" });
    } catch (error) {
        return NextResponse.json(
            { success: false, error: "Failed to delete product" },
            { status: 500 }
        );
    }
}
