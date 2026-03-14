"use server";

import { supabaseAdmin } from "@/lib/supabase-admin";
import { revalidatePath } from "next/cache";
import { createCategorySchema, formatZodErrors } from "@/lib/validation";
import { logEvent } from "@/lib/logger";

export async function createCategory(formData: FormData) {
    const name = formData.get("name") as string;
    const description = (formData.get("description") as string) || "";

    // ── Zod Validation ──────────────────────────────────────────────────
    const parsed = createCategorySchema.safeParse({ name, description });
    if (!parsed.success) {
        return { success: false, error: formatZodErrors(parsed.error) };
    }

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

    try {
        const { data: category, error } = await supabaseAdmin
            .from("categories")
            .insert({
                name,
                slug,
                description,
            })
            .select()
            .single();

        if (error) throw error;

        await logEvent("CATEGORY_CREATED", category.id, `Category "${name}" created`);
        revalidatePath("/", "layout");
        return { success: true };
    } catch (error) {
        console.error("Create category error:", error);
        return { success: false, error: "Failed to create category. It may already exist." };
    }
}

export async function updateCategory(id: string, formData: FormData) {
    const name = formData.get("name") as string;
    const description = (formData.get("description") as string) || "";

    const parsed = createCategorySchema.safeParse({ name, description });
    if (!parsed.success) {
        return { success: false, error: formatZodErrors(parsed.error) };
    }

    try {
        const { error } = await supabaseAdmin
            .from("categories")
            .update({
                name,
                description,
                updated_at: new Date().toISOString(),
            })
            .eq("id", id);

        if (error) throw error;

        revalidatePath("/", "layout");
        return { success: true };
    } catch (error) {
        console.error("Update category error:", error);
        return { success: false, error: "Failed to update category" };
    }
}

export async function deleteCategory(id: string) {
    try {
        // Check for products in this category
        const { data: products, error: checkError } = await supabaseAdmin
            .from("products")
            .select("id")
            .eq("category_id", id)
            .limit(1);

        if (checkError) throw checkError;

        if (products && products.length > 0) {
            return { success: false, error: "Cannot delete category. There are products associated with it." };
        }

        const { error: deleteError } = await supabaseAdmin
            .from("categories")
            .delete()
            .eq("id", id);

        if (deleteError) throw deleteError;

        await logEvent("CATEGORY_DELETED", id, `Category ${id} deleted`);
        revalidatePath("/", "layout");
        return { success: true };
    } catch (error) {
        console.error("Delete category error:", error);
        return { success: false, error: "Error during deletion" };
    }
}
