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
        revalidatePath("/admin/categories");
        revalidatePath("/admin/products");
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

        revalidatePath("/admin/categories");
        revalidatePath("/admin/products");
        revalidatePath("/", "layout");
        try {
            const { revalidateTag } = await import("next/cache");
            (revalidateTag as any)("products");
        } catch (e) {
            console.error("Revalidate tag failed", e);
        }
        return { success: true };
    } catch (error) {
        console.error("Update category error:", error);
        return { success: false, error: "Failed to update category" };
    }
}

export async function deleteCategory(id: string) {
    try {
        // Nullify category references in products before deleting
        const { error: updateError } = await supabaseAdmin
            .from("products")
            .update({ category_id: null })
            .eq("category_id", id);

        if (updateError) throw updateError;

        const { error: deleteError } = await supabaseAdmin
            .from("categories")
            .delete()
            .eq("id", id);

        if (deleteError) throw deleteError;

        await logEvent("CATEGORY_DELETED", id, `Category ${id} deleted`);
        revalidatePath("/admin/categories");
        revalidatePath("/admin/products");
        revalidatePath("/", "layout");
        try {
            const { revalidateTag } = await import("next/cache");
            (revalidateTag as any)("products");
        } catch (e) {
            console.error("Revalidate tag failed", e);
        }
        return { success: true };
    } catch (error) {
        console.error("Delete category error:", error);
        return { success: false, error: "Error during deletion" };
    }
}
