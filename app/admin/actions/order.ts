"use server";

import prisma from "@/lib/db";
import { revalidatePath, revalidateTag } from "next/cache";
import { updateOrderStatus } from "@/services/order-service";
import { OrderStatus } from "@prisma/client";
import { requireCustomerSession } from "@/lib/customer-auth";

export async function cancelOrderAction(orderId: string) {
    try {
        // Authenticate user
        const customer = await requireCustomerSession();

        // Fetch order to verify ownership and status
        const order = await prisma.order.findUnique({
            where: { id: orderId },
            select: { customerId: true, status: true }
        });

        if (!order) {
            return { success: false, error: "Order not found" };
        }

        if (order.customerId !== customer.id) {
            return { success: false, error: "Unauthorized" };
        }

        // Only PENDING orders can be cancelled by user
        if (order.status !== OrderStatus.PENDING) {
            return { success: false, error: "Only pending orders can be cancelled." };
        }

        // Perform cancellation
        await updateOrderStatus(orderId, OrderStatus.CANCELLED, "CUSTOMER", "Cancelled by user via account dashboard.");

        revalidatePath(`/account/orders/${orderId}`);
        revalidatePath("/account/orders");
        revalidateTag("products");

        return { success: true };
    } catch (error) {
        console.error("Cancel order error:", error);
        return { success: false, error: "Failed to cancel order" };
    }
}

export async function adminUpdateOrderStatus(orderId: string, status: OrderStatus) {
    try {
        await updateOrderStatus(orderId, status, "ADMIN", `Status updated manually by admin to ${status}.`);

        revalidatePath("/admin/orders");
        revalidatePath(`/account/orders/${orderId}`);
        revalidatePath("/account/orders");
        revalidateTag("products");

        return { success: true };
    } catch (error) {
        console.error("Admin update order status error:", error);
        return { success: false, error: "Failed to update order status" };
    }
}
