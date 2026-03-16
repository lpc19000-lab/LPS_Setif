"use server";

import { supabaseAdmin } from "@/lib/supabase-admin";
import { revalidatePath } from "next/cache";
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

export async function toggleCustomerStatus(customerId: string, newStatus: "ACTIVE" | "SUSPENDED") {
    try {
        const { error } = await supabaseAdmin
            .from("customers")
            .update({ status: newStatus })
            .eq("id", customerId);

        if (error) throw error;

        const adminId = await getAdminId();
        if (adminId) {
            await logAdminAction({
                adminId,
                action: "TOGGLE_CUSTOMER_STATUS",
                targetType: "CUSTOMER",
                targetId: customerId,
                metadata: { newStatus }
            });
        }

        revalidatePath("/", "layout");
        return { success: true };
    } catch (error) {
        console.error("Error toggling customer status:", error);
        return { success: false, error: "Failed to update status" };
    }
}

export async function deleteCustomer(customerId: string) {
    try {
        // First, nullify customer_id on any associated orders to avoid FK constraint errors
        await supabaseAdmin
            .from("orders")
            .update({ customer_id: null })
            .eq("customer_id", customerId);

        const { error } = await supabaseAdmin
            .from("customers")
            .delete()
            .eq("id", customerId);

        if (error) throw error;
        
        const adminId = await getAdminId();
        if (adminId) {
            await logAdminAction({
                adminId,
                action: "DELETE_CUSTOMER",
                targetType: "CUSTOMER",
                targetId: customerId,
                metadata: {}
            });
        }

        revalidatePath("/", "layout");
        return { success: true };
    } catch (error) {
        console.error("Error deleting customer:", error);
        return { success: false, error: "Failed to delete customer account" };
    }
}
