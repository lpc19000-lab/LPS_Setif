import { NextResponse } from "next/server";
import { getOrderById } from "@/services/order-service";

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    try {
        const order = await getOrderById(id);
        if (!order) {
            return NextResponse.json(
                { success: false, error: "Order not found" },
                { status: 404 }
            );
        }
        return NextResponse.json({ success: true, data: order });
    } catch (error) {
        return NextResponse.json(
            { success: false, error: "Failed to fetch order" },
            { status: 500 }
        );
    }
}
