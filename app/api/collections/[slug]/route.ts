import { NextResponse } from "next/server";
import { getCollectionBySlug } from "@/services/collection-service";

export async function GET(
    _request: Request,
    { params }: { params: Promise<{ slug: string }> }
) {
    try {
        const { slug } = await params;
        const collection = await getCollectionBySlug(slug);
        if (!collection) {
            return NextResponse.json({ success: false, error: "Collection not found" }, { status: 404 });
        }
        return NextResponse.json({ success: true, data: collection });
    } catch (error) {
        return NextResponse.json(
            { success: false, error: "Failed to fetch collection" },
            { status: 500 }
        );
    }
}
