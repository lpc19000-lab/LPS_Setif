import { NextResponse } from "next/server";
import { addToCart } from "@/services/cart-service";
import { getCustomerSession } from "@/lib/customer-auth";

export async function POST(request: Request) {
    try {
        const customer = await getCustomerSession();
        if (!customer) {
            return NextResponse.json(
                { success: false, error: "Unauthorized: Trader session required" },
                { status: 401 }
            );
        }

        const { productId, quantity, selectedVolume } = await request.json();

        if (!productId || !quantity) {
            return NextResponse.json(
                { success: false, error: "productId and quantity are required" },
                { status: 400 }
            );
        }

        const item = await addToCart(customer.id, productId, quantity, selectedVolume || 100);
        return NextResponse.json({ success: true, data: item }, { status: 201 });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Failed to add to cart";
        return NextResponse.json({ success: false, error: message }, { status: 400 });
    }
}
