import { NextResponse } from "next/server";
import { updateCartItem } from "@/services/cart-service";

export async function POST(request: Request) {
    try {
        const { cartItemId, quantity } = await request.json();

        if (!cartItemId || quantity === undefined) {
            return NextResponse.json(
                { success: false, error: "cartItemId and quantity are required" },
                { status: 400 }
            );
        }

        const item = await updateCartItem(cartItemId, quantity);
        return NextResponse.json({ success: true, data: item });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Failed to update cart";
        return NextResponse.json({ success: false, error: message }, { status: 400 });
    }
}
