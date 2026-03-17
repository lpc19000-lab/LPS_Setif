"use server";

import { supabaseAdmin } from "@/lib/supabase-admin";
import { revalidatePath } from "next/cache";
import { createCategorySchema, formatZodErrors } from "@/lib/validation"; // Reusing category schema as it's just name/desc
import { logEvent } from "@/lib/logger";

export async function createBrand(formData: FormData) {
    const name = formData.get("name") as string;
    const description = (formData.get("description") as string) || "";

    const parsed = createCategorySchema.safeParse({ name, description });
    if (!parsed.success) {
        return { success: false, error: formatZodErrors(parsed.error) };
    }

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

    try {
        const { data: brand, error } = await supabaseAdmin
            .from("brands")
            .insert({
                name,
                slug,
                description,
            })
            .select()
            .single();

        if (error) throw error;

        await logEvent("BRAND_CREATED", brand.id, `Brand "${name}" created`);
        revalidatePath("/", "layout");
        return { success: true };
    } catch (error) {
        console.error("Create brand error:", error);
        return { success: false, error: "Failed to create brand. It may already exist." };
    }
}

export async function updateBrand(id: string, formData: FormData) {
    const name = formData.get("name") as string;
    const description = (formData.get("description") as string) || "";

    const parsed = createCategorySchema.safeParse({ name, description });
    if (!parsed.success) {
        return { success: false, error: formatZodErrors(parsed.error) };
    }

    try {
        const { error } = await supabaseAdmin
            .from("brands")
            .update({
                name,
                description,
            })
            .eq("id", id);

        if (error) throw error;

        revalidatePath("/", "layout");
        return { success: true };
    } catch (error) {
        console.error("Update brand error:", error);
        return { success: false, error: "Failed to update brand" };
    }
}

export async function deleteBrand(id: string) {
    try {
        // Nullify brand references in products before deleting
        const { error: updateError } = await supabaseAdmin
            .from("products")
            .update({ brand_id: null, brand: null })
            .eq("brand_id", id);

        if (updateError) throw updateError;

        const { error: deleteError } = await supabaseAdmin
            .from("brands")
            .delete()
            .eq("id", id);

        if (deleteError) throw deleteError;

        await logEvent("BRAND_DELETED", id, `Brand ${id} deleted`);
        revalidatePath("/", "layout");
        return { success: true };
    } catch (error) {
        console.error("Delete brand error:", error);
        return { success: false, error: "Error during deletion" };
    }
}
