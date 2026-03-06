import { NextResponse } from "next/server";
import { getCart } from "@/services/cart-service";
import { getCustomerSession } from "@/lib/customer-auth";

export async function GET() {
    try {
        const customer = await getCustomerSession();

        if (!customer) {
            return NextResponse.json(
                { success: false, error: "Unauthorized: Trader session required" },
                { status: 401 }
            );
        }

        const cart = await getCart(customer.id);
        return NextResponse.json({ success: true, data: cart });
    } catch (error) {
        return NextResponse.json(
            { success: false, error: "Failed to fetch cart" },
            { status: 500 }
        );
    }
}
