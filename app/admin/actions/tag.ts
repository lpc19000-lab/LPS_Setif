"use server";

import { revalidatePath } from "next/cache";
import { createTag, updateTag, deleteTag } from "@/services/tag-service";
import { logEvent } from "@/lib/logger";
import { z } from "zod";

const tagSchema = z.object({
    name: z.string().min(1, "Name is required").max(100),
});

export async function createTagAction(formData: FormData) {
    const name = formData.get("name") as string;
    
    const parsed = tagSchema.safeParse({ name });
    if (!parsed.success) {
        return { success: false, error: parsed.error.issues[0].message };
    }

    try {
        const tag = await createTag({ name });
        await logEvent("CATEGORY_CREATED", tag.id, `Tag "${name}" created by admin`);
        revalidatePath("/admin/tags");
        return { success: true };
    } catch (error) {
        return { success: false, error: "Failed to create tag" };
    }
}

export async function updateTagAction(id: string, formData: FormData) {
    const name = formData.get("name") as string;
    
    const parsed = tagSchema.safeParse({ name });
    if (!parsed.success) {
        return { success: false, error: parsed.error.issues[0].message };
    }

    try {
        await updateTag(id, { name });
        await logEvent("CATEGORY_CREATED", id, `Tag updated to "${name}" by admin`);
        revalidatePath("/admin/tags");
        return { success: true };
    } catch (error) {
        return { success: false, error: "Failed to update tag" };
    }
}

export async function deleteTagAction(id: string) {
    try {
        await deleteTag(id);
        await logEvent("CATEGORY_CREATED", id, `Tag ${id} deleted by admin`);
        revalidatePath("/admin/tags");
        return { success: true };
    } catch (error) {
        return { success: false, error: "Failed to delete tag" };
    }
}
