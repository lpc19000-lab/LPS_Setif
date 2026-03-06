import { NextResponse } from "next/server";
import { validateCartItems } from "@/lib/cart-validation";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { items } = body;

        if (!items || !Array.isArray(items) || items.length === 0) {
            return NextResponse.json(
                { success: false, error_code: "INVALID_INPUT", message: "items array is required" },
                { status: 400 }
            );
        }

        const result = await validateCartItems(items);

        return NextResponse.json({ success: true, data: result });
    } catch (error) {
        return NextResponse.json(
            { success: false, error_code: "INTERNAL_ERROR", message: "Failed to validate cart" },
            { status: 500 }
        );
    }
}
