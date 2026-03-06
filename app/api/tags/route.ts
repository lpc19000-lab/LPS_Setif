import { NextResponse } from "next/server";
import { getTags, createTag } from "@/services/tag-service";

export async function GET() {
    try {
        const tags = await getTags();
        return NextResponse.json({ success: true, data: tags });
    } catch (error) {
        return NextResponse.json(
            { success: false, error: "Failed to fetch tags" },
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
        const tag = await createTag({ name });
        return NextResponse.json({ success: true, data: tag }, { status: 201 });
    } catch (error) {
        return NextResponse.json(
            { success: false, error: "Failed to create tag" },
            { status: 500 }
        );
    }
}
