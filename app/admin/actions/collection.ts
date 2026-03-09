"use server";

import { revalidatePath } from "next/cache";
import { createCollection, updateCollection, deleteCollection } from "@/services/collection-service";
import { logEvent } from "@/lib/logger";
import { z } from "zod";

const collectionSchema = z.object({
    name: z.string().min(1, "Name is required").max(100),
});

export async function createCollectionAction(formData: FormData) {
    const name = formData.get("name") as string;

    const parsed = collectionSchema.safeParse({ name });
    if (!parsed.success) {
        return { success: false, error: parsed.error.issues[0].message };
    }

    try {
        const collection = await createCollection({ name });
        await logEvent("CATEGORY_CREATED", collection.id, `Collection "${name}" created by admin`);
        revalidatePath("/admin/collections");
        return { success: true };
    } catch (error) {
        return { success: false, error: "Failed to create collection" };
    }
}

export async function updateCollectionAction(id: string, formData: FormData) {
    const name = formData.get("name") as string;

    const parsed = collectionSchema.safeParse({ name });
    if (!parsed.success) {
        return { success: false, error: parsed.error.issues[0].message };
    }

    try {
        await updateCollection(id, { name });
        await logEvent("CATEGORY_CREATED", id, `Collection updated to "${name}" by admin`);
        revalidatePath("/admin/collections");
        return { success: true };
    } catch (error) {
        return { success: false, error: "Failed to update collection" };
    }
}

export async function deleteCollectionAction(id: string) {
    try {
        await deleteCollection(id);
        await logEvent("CATEGORY_CREATED", id, `Collection ${id} deleted by admin`);
        revalidatePath("/admin/collections");
        return { success: true };
    } catch (error) {
        return { success: false, error: "Failed to delete collection" };
    }
}
