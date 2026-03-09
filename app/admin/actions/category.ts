"use server";

import prisma from "@/lib/db";
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
        const category = await prisma.category.create({
            data: { name, slug, description },
        });
        await logEvent("CATEGORY_CREATED", category.id, `Category "${name}" created`);
        revalidatePath("/admin/categories");
        return { success: true };
    } catch (error) {
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
        await prisma.category.update({ where: { id }, data: { name, description } });
        revalidatePath("/admin/categories");
        return { success: true };
    } catch (error) {
        return { success: false, error: "Failed to update category" };
    }
}

export async function deleteCategory(id: string) {
    try {
        await prisma.category.delete({ where: { id } });
        revalidatePath("/admin/categories");
        return { success: true };
    } catch (error) {
        return { success: false, error: "Failed to delete category (might have associated products)" };
    }
}
