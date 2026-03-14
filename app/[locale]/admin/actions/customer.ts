"use server";

import { supabaseAdmin } from "@/lib/supabase-admin";
import { revalidatePath } from "next/cache";

export async function toggleCustomerStatus(customerId: string, newStatus: "ACTIVE" | "SUSPENDED") {
    try {
        const { error } = await supabaseAdmin
            .from("customers")
            .update({ status: newStatus })
            .eq("id", customerId);

        if (error) throw error;

        // Optionally trace an admin log if we had a logEvent function
        revalidatePath("/", "layout");
        return { success: true };
    } catch (error) {
        console.error("Error toggling customer status:", error);
        return { success: false, error: "Failed to update status" };
    }
}
