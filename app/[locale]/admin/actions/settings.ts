"use server";

import { supabaseAdmin } from "@/lib/supabase-admin";
import { revalidatePath } from "next/cache";
import { logEvent } from "@/lib/logger";

export async function updateSiteSettingsAction(formData: FormData) {
    const id = formData.get("id") as string;
    const whatsapp_number = formData.get("whatsapp_number") as string;
    const facebook_page = formData.get("facebook_page") as string;
    const contact_email = formData.get("contact_email") as string;
    const store_address = formData.get("store_address") as string;
    const logo_url = formData.get("logo_url") as string;

    try {
        const { error } = await supabaseAdmin
            .from("site_settings")
            .upsert({
                id: id || "00000000-0000-0000-0000-000000000000",
                whatsapp_number,
                facebook_page,
                contact_email,
                store_address,
                logo_url,
                updated_at: new Date().toISOString()
            });

        if (error) throw error;

        await logEvent("SITESETTINGS_UPDATED", id, "Global site settings updated by admin");
        revalidatePath("/", "layout");
        return { success: true };
    } catch (error: any) {
        console.error("updateSiteSettingsAction error:", error);
        return { success: false, error: error.message };
    }
}
