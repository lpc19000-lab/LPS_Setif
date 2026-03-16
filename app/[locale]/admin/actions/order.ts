"use server";

import { supabaseAdmin } from "@/lib/supabase-admin";
import { revalidatePath, revalidateTag } from "next/cache";
import { updateOrderStatus } from "@/services/order-service";
import { createInvoice } from "@/services/invoice-service";
import { OrderStatus } from "@/lib/constants";
import { requireCustomerSession } from "@/lib/customer-auth";
import { logAdminAction } from "@/services/audit-service";
import { cookies } from "next/headers";
import { verifyJwtToken } from "@/lib/auth";

async function getAdminId() {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get("admin_token")?.value;
        const payload = token ? await verifyJwtToken(token) : null;
        return payload?.sub as string | undefined;
    } catch {
        return undefined;
    }
}

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
        
        const adminId = await getAdminId();
        if (adminId) {
            await logAdminAction({
                adminId,
                action: "UPDATE_ORDER_STATUS",
                targetType: "ORDER",
                targetId: orderId,
                metadata: { status }
            });
        }

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
        let paymentStatus: "PAID" | "PARTIAL" | "UNPAID" = "UNPAID";

        if (amountPaid >= totalAmount) {
            paymentStatus = "PAID";
        } else if (amountPaid > 0) {
            paymentStatus = "PARTIAL";
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

        const adminId = await getAdminId();
        if (adminId) {
            await logAdminAction({
                adminId,
                action: "UPDATE_PAYMENT",
                targetType: "ORDER",
                targetId: orderId,
                metadata: { amountPaid, paymentStatus }
            });
        }

        revalidatePath("/admin/dashboard");
        revalidatePath("/admin/orders");
        return { success: true };
    } catch (error) {
        console.error("Update payment error:", error);
        return { success: false, error: "Failed to update payment" };
    }
}

export async function generateInvoiceAction(orderId: string, amount: number) {
    try {
        await createInvoice(orderId, amount);
        revalidatePath("/admin/orders");
        revalidatePath(`/account/orders/${orderId}`);
        return { success: true };
    } catch (error) {
        console.error("Generate invoice error:", error);
        return { success: false, error: "Failed to generate invoice" };
    }
}

export async function deleteOrderAction(orderId: string) {
    try {
        // First delete order_items to avoid foreign key constraint errors
        await supabaseAdmin.from("order_items").delete().eq("order_id", orderId);
        
        const { error } = await supabaseAdmin.from("orders").delete().eq("id", orderId);
        if (error) throw error;
        
        const adminId = await getAdminId();
        if (adminId) {
            await logAdminAction({
                adminId,
                action: "DELETE_ORDER",
                targetType: "ORDER",
                targetId: orderId,
                metadata: {}
            });
        }

        revalidatePath("/admin/orders");
        return { success: true };
    } catch (error) {
        console.error("Delete order error:", error);
        return { success: false, error: "Failed to delete order" };
    }
}
