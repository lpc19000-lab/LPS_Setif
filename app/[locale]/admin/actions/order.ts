"use server";

import { supabaseAdmin } from "@/lib/supabase-admin";
import { revalidatePath, revalidateTag } from "next/cache";
import { updateOrderStatus } from "@/services/order-service";
import { OrderStatus } from "@/lib/constants";
import { requireCustomerSession } from "@/lib/customer-auth";

export async function cancelOrderAction(orderId: string) {
    try {
        // Authenticate user
        const customer = await requireCustomerSession();
        
        // Fetch order to verify ownership and status
        const { data: order, error } = await supabaseAdmin
            .from("orders")
            .select("*")
            .eq("id", orderId)
            .single();

        if (error || !order) {
            return { success: false, error: "Order not found" };
        }

        if (order.customer_id !== customer.id) {
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
        (revalidateTag as any)("products");
        
        return { success: true };
    } catch (error) {
        console.error("Cancel order error:", error);
        return { success: false, error: "Failed to cancel order" };
    }
}

export async function adminUpdateOrderStatus(orderId: string, status: string) {
    try {
        await updateOrderStatus(orderId, status, "ADMIN", `Status updated manually by admin to ${status}.`);
        
        revalidatePath("/admin/orders");
        revalidatePath(`/account/orders/${orderId}`);
        revalidatePath("/account/orders");
        (revalidateTag as any)("products");
        
        return { success: true };
    } catch (error) {
        console.error("Admin update order status error:", error);
        return { success: false, error: "Failed to update order status" };
    }
}

export async function updateOrderPayment(orderId: string, amountPaid: number) {
    try {
        const { data: order, error } = await supabaseAdmin
            .from("orders")
            .select("total_price")
            .eq("id", orderId)
            .single();

        if (error || !order) throw new Error("Order not found");

        const totalAmount = Number(order.total_price);
        let paymentStatus: "PAID" | "PARTIALLY_PAID" | "UNPAID" = "UNPAID";

        if (amountPaid >= totalAmount) {
            paymentStatus = "PAID";
        } else if (amountPaid > 0) {
            paymentStatus = "PARTIALLY_PAID";
        }

        const { error: updateError } = await supabaseAdmin
            .from("orders")
            .update({
                amount_paid: amountPaid,
                payment_status: paymentStatus,
                updated_at: new Date().toISOString(),
            })
            .eq("id", orderId);

        if (updateError) throw updateError;

        revalidatePath("/admin/dashboard");
        revalidatePath("/admin/orders");
        return { success: true };
    } catch (error) {
        console.error("Update payment error:", error);
        return { success: false, error: "Failed to update payment" };
    }
}
