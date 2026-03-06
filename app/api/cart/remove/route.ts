import { NextResponse } from "next/server";
import { removeCartItem } from "@/services/cart-service";

export async function DELETE(request: Request) {
    const { searchParams } = new URL(request.url);
    const cartItemId = searchParams.get("cartItemId");

    if (!cartItemId) {
        return NextResponse.json(
            { success: false, error: "cartItemId is required" },
            { status: 400 }
        );
    }

    try {
        await removeCartItem(cartItemId);
        return NextResponse.json({ success: true, message: "Item removed from cart" });
    } catch (error) {
        return NextResponse.json(
            { success: false, error: "Failed to remove cart item" },
            { status: 500 }
        );
    }
}
