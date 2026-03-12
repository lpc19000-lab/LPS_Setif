"use server";

import { adminDb } from "@/lib/firebase-admin";
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
        const docRef = await adminDb.collection("categories").add({
            name,
            slug,
            description,
            createdAt: new Date(),
            updatedAt: new Date(),
        });
        await logEvent("CATEGORY_CREATED", docRef.id, `Category "${name}" created`);
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
        await adminDb.collection("categories").doc(id).update({
            name,
            description,
            updatedAt: new Date(),
        });
        revalidatePath("/admin/categories");
        return { success: true };
    } catch (error) {
        return { success: false, error: "Failed to update category" };
    }
}

export async function deleteCategory(id: string) {
    try {
        // Check for products in this category
        const productCheck = await adminDb.collection("products")
            .where("categoryId", "==", id)
            .limit(1).get();

        if (!productCheck.empty) {
            return { success: false, error: "Cannot delete category. There are products associated with it." };
        }

        await adminDb.collection("categories").doc(id).delete();
        await logEvent("CATEGORY_DELETED", id, `Category ${id} deleted`);
        revalidatePath("/admin/categories");
        return { success: true };
    } catch (error) {
        return { success: false, error: "Error during deletion" };
    }
}
