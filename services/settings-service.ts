import { supabaseAdmin } from "@/lib/supabase-admin";

export interface SiteSettings {
    id: string;
    whatsapp_number: string;
    facebook_page: string;
    contact_email: string | null;
    store_address: string | null;
    logo_url: string | null;
    updated_at: string;
}

export async function getSiteSettings(): Promise<SiteSettings> {
    try {
        const { data, error } = await supabaseAdmin
            .from("site_settings")
            .select("*")
            .single();

        if (error) {
            console.error("Error fetching site settings:", error);
            // Return defaults if table is empty or missing
            return {
                id: "",
                whatsapp_number: "+213542303496",
                facebook_page: "lattafa_setif1",
                contact_email: "contact@lps-setif.com",
                store_address: "Algeria, Setif",
                logo_url: null,
                updated_at: new Date().toISOString()
            };
        }

        return data;
    } catch (e) {
        console.error("getSiteSettings crash:", e);
        return {
            id: "",
            whatsapp_number: "+213542303496",
            facebook_page: "lattafa_setif1",
            contact_email: "contact@lps-setif.com",
            store_address: "Algeria, Setif",
            logo_url: null,
            updated_at: new Date().toISOString()
        };
    }
}

export async function updateSiteSettings(settings: Partial<SiteSettings>) {
    try {
        const { error } = await supabaseAdmin
            .from("site_settings")
            .update({
                ...settings,
                updated_at: new Date().toISOString()
            })
            .eq("id", settings.id || "00000000-0000-0000-0000-000000000000"); // Usually we only have one row

        if (error) throw error;
        return { success: true };
    } catch (error: any) {
        console.error("updateSiteSettings error:", error);
        return { success: false, error: error.message };
    }
}
