"use server";

import { updateOrderStatus as serviceUpdateOrderStatus } from "@/services/order-service";
import { OrderStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { logEvent } from "@/lib/logger";

export async function adminUpdateOrderStatus(orderId: string, status: OrderStatus) {
    try {
        await serviceUpdateOrderStatus(orderId, status);
        await logEvent("ORDER_STATUS_CHANGED", orderId, `Admin changed order status to ${status}`);
        revalidatePath("/admin/orders");
        revalidatePath("/admin/dashboard");
        return { success: true };
    } catch (error) {
        return { success: false, error: "Failed to update order status" };
    }
}
