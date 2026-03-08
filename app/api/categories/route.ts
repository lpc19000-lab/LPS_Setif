import { NextResponse } from "next/server";
import { getCategories, createCategory } from "@/services/category-service";
import { errorResponse, Errors } from "@/lib/errors";

export async function GET() {
    try {
        const categories = await getCategories();
        const response = NextResponse.json({ success: true, data: categories });
        response.headers.set('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=60');
        return response;
    } catch (error) {
        const { body, status } = errorResponse(error);
        return NextResponse.json(body, { status });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();

        if (!body.name) {
            return errorResponse(Errors.invalidInput("Category name is required"));
        }

        const category = await createCategory(body);
        return NextResponse.json({ success: true, data: category }, { status: 201 });
    } catch (error) {
        const { body, status } = errorResponse(error);
        return NextResponse.json(body, { status });
    }
}
