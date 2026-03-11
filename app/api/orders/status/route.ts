import { NextResponse } from "next/server";
import { updateOrderStatus } from "@/services/order-service";
import { OrderStatus } from "@/lib/constants";

const validStatuses = Object.values(OrderStatus);

export async function PUT(request: Request) {
    try {
        const { orderId, status } = await request.json();

        if (!orderId || !status) {
            return NextResponse.json(
                { success: false, error: "orderId and status are required" },
                { status: 400 }
            );
        }

        if (!validStatuses.includes(status)) {
            return NextResponse.json(
                {
                    success: false,
                    error: `Invalid status. Must be one of: ${validStatuses.join(", ")}`,
                },
                { status: 400 }
            );
        }

        const order = await updateOrderStatus(orderId, status as OrderStatus);
        return NextResponse.json({ success: true, data: order });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Failed to update order status";
        return NextResponse.json({ success: false, error: message }, { status: 400 });
    }
}
