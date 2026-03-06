import { NextResponse } from "next/server";
import { getCollections, createCollection } from "@/services/collection-service";

export async function GET() {
    try {
        const collections = await getCollections();
        return NextResponse.json({ success: true, data: collections });
    } catch (error) {
        return NextResponse.json(
            { success: false, error: "Failed to fetch collections" },
            { status: 500 }
        );
    }
}

export async function POST(request: Request) {
    try {
        const { name } = await request.json();
        if (!name) {
            return NextResponse.json({ success: false, error: "Name is required" }, { status: 400 });
        }
        const collection = await createCollection({ name });
        return NextResponse.json({ success: true, data: collection }, { status: 201 });
    } catch (error) {
        return NextResponse.json(
            { success: false, error: "Failed to create collection" },
            { status: 500 }
        );
    }
}
