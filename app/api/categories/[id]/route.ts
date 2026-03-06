import { NextResponse } from "next/server";
import { updateCategory, deleteCategory, getCategoryById, getCategoryBySlug } from "@/services/category-service";

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    try {
        // Try by ID first, then by slug
        let category = await getCategoryById(id);
        if (!category) {
            category = await getCategoryBySlug(id);
        }
        if (!category) {
            return NextResponse.json(
                { success: false, error: "Category not found" },
                { status: 404 }
            );
        }
        return NextResponse.json({ success: true, data: category });
    } catch (error) {
        return NextResponse.json(
            { success: false, error: "Failed to fetch category" },
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
        const category = await updateCategory(id, body);
        return NextResponse.json({ success: true, data: category });
    } catch (error) {
        return NextResponse.json(
            { success: false, error: "Failed to update category" },
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
        await deleteCategory(id);
        return NextResponse.json({ success: true, message: "Category deleted" });
    } catch (error) {
        return NextResponse.json(
            { success: false, error: "Failed to delete category" },
            { status: 500 }
        );
    }
}
