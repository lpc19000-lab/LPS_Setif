import { NextResponse } from "next/server";
import { requireCustomerSession } from "@/lib/customer-auth";
import { getReorderItems } from "@/services/order-service";
import { addToCart } from "@/services/cart-service";

export async function POST(request: Request) {
    try {
        const customer = await requireCustomerSession();
        const body = await request.json();
        const { orderId } = body;

        if (!orderId) {
            return NextResponse.json({ success: false, error: "Order ID is required" }, { status: 400 });
        }

        const items = await getReorderItems(orderId);

        let addedCount = 0;
        let errors: string[] = [];

        for (const item of items) {
            try {
                await addToCart(customer.id, item.productId, item.quantity, item.volumeId!);
                addedCount++;
            } catch (err: any) {
                errors.push(`${item.name}: ${err.message}`);
            }
        }

        if (addedCount === 0 && items.length > 0) {
            return NextResponse.json({
                success: false,
                error: "None of the items could be added to cart. " + errors.join("; ")
            }, { status: 400 });
        }

        return NextResponse.json({
            success: true,
            message: `Added ${addedCount} items to cart.`,
            errors: errors.length > 0 ? errors : undefined
        });

    } catch (error: any) {
        console.error("Reorder error:", error);
        return NextResponse.json({ success: false, error: error.message || "Failed to reorder" }, { status: 500 });
    }
}
