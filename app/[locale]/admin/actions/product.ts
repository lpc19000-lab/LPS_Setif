"use server";

import { adminDb } from "@/lib/firebase-admin";
import { revalidatePath, revalidateTag } from "next/cache";
import { logEvent } from "@/lib/logger";

function generateSlug(name: string): string {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export async function createProduct(formData: FormData) {
    const slug = generateSlug(formData.get("name") as string) + "-" + Date.now().toString(36);

    const data: any = {
        name: formData.get("name") as string,
        slug,
        brand: formData.get("brand") as string,
        description: formData.get("description") as string,
        categoryId: formData.get("categoryId") as string,
        imageUrl: formData.get("imageUrl") as string,
        basePrice: Number(formData.get("basePrice")),
        stockWeight: Number(formData.get("stockWeight")),
        lowStockThreshold: Number(formData.get("lowStockThreshold") || 500),
        status: (formData.get("status") as string) || "ACTIVE",
        createdAt: new Date(),
        updatedAt: new Date(),
    };

    const collectionIds = (formData.getAll("collectionIds") as string[]).filter(Boolean);
    const tagIds = (formData.getAll("tagIds") as string[]).filter(Boolean);

    if (!data.name || !data.brand || !data.categoryId || !data.basePrice || isNaN(data.basePrice) || data.basePrice <= 0) {
        return { success: false, error: "Missing or invalid required fields (name, brand, categoryId, basePrice)" };
    }
    if (data.stockWeight < 0 || isNaN(data.stockWeight)) {
        return { success: false, error: "Stock (g) cannot be negative" };
    }

    // Resolve category name
    if (data.categoryId) {
        const catDoc = await adminDb.collection("categories").doc(data.categoryId).get();
        if (catDoc.exists) data.categoryName = catDoc.data()?.name || "";
    }

    data.collectionIds = collectionIds;
    data.tagIds = tagIds;

    try {
        const docRef = await adminDb.collection("products").add(data);

        // Initial stock log
        if (data.stockWeight > 0) {
            await adminDb.collection("inventory_logs").add({
                productId: docRef.id,
                changeType: "INITIAL_STOCK",
                quantity: data.stockWeight,
                source: "ADMIN",
                reason: "Initial stock on product creation",
                createdAt: new Date(),
            });
        }

        await logEvent("PRODUCT_CREATED", docRef.id, `Product "${data.name}" created with ${data.stockWeight}g`);
        revalidatePath("/admin/products");
        revalidatePath("/catalog");
        revalidatePath("/");
        (revalidateTag as any)("products");
        return { success: true };
    } catch (error) {
        console.error("Create product error:", error);
        return { success: false, error: "Failed to create product" };
    }
}

export async function updateProduct(id: string, formData: FormData) {
    const data: any = {
        name: formData.get("name") as string,
        brand: formData.get("brand") as string,
        description: formData.get("description") as string,
        categoryId: formData.get("categoryId") as string,
        imageUrl: formData.get("imageUrl") as string,
        basePrice: Number(formData.get("basePrice")),
        stockWeight: Number(formData.get("stockWeight")),
        lowStockThreshold: Number(formData.get("lowStockThreshold") || 500),
        status: (formData.get("status") as string) || "ACTIVE",
        updatedAt: new Date(),
    };

    const collectionIds = (formData.getAll("collectionIds") as string[]).filter(Boolean);
    const tagIds = (formData.getAll("tagIds") as string[]).filter(Boolean);

    // Resolve category name
    if (data.categoryId) {
        const catDoc = await adminDb.collection("categories").doc(data.categoryId).get();
        if (catDoc.exists) data.categoryName = catDoc.data()?.name || "";
    }

    data.collectionIds = collectionIds;
    data.tagIds = tagIds;

    try {
        await adminDb.collection("products").doc(id).update(data);

        await logEvent("PRODUCT_UPDATED", id, `Product "${data.name}" updated`);
        revalidatePath("/admin/products");
        revalidatePath("/catalog");
        revalidatePath("/");
        (revalidateTag as any)("products");
        return { success: true };
    } catch (error) {
        console.error("Update product error:", error);
        return { success: false, error: "Failed to update product" };
    }
}

export async function deleteProduct(id: string) {
    try {
        await adminDb.collection("products").doc(id).delete();
        await logEvent("PRODUCT_DELETED", id, `Product ${id} deleted`);
        revalidatePath("/admin/products");
        revalidatePath("/catalog");
        (revalidateTag as any)("products");
        return { success: true };
    } catch (error) {
        return { success: false, error: "Failed to delete product (might be referenced in orders)" };
    }
}
