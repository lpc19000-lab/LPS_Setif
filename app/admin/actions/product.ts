"use server";

import prisma from "@/lib/db";
import { revalidatePath } from "next/cache";
import { logEvent } from "@/lib/logger";

function generateSlug(name: string): string {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export async function createProduct(formData: FormData) {
    const slug = generateSlug(formData.get("name") as string) + "-" + Date.now().toString(36);

    const data = {
        name: formData.get("name") as string,
        slug,
        brand: formData.get("brand") as string,
        description: formData.get("description") as string,
        categoryId: formData.get("categoryId") as string,
        imageUrl: formData.get("imageUrl") as string,
        wholesalePrice: Number(formData.get("wholesalePrice")),
        retailPrice: Number(formData.get("retailPrice")),
        stockQuantity: Number(formData.get("stockQuantity")),
        minimumOrderQuantity: Number(formData.get("minimumOrderQuantity")),
        unitsPerBox: Number(formData.get("unitsPerBox")),
        status: (formData.get("status") as string) || "ACTIVE",
    };

    const collectionIds = formData.getAll("collectionIds") as string[];
    const tagIds = formData.getAll("tagIds") as string[];

    if (!data.name || !data.brand || !data.categoryId || !data.wholesalePrice || isNaN(data.wholesalePrice) || data.wholesalePrice <= 0) {
        return { success: false, error: "Missing or invalid required fields (name, brand, categoryId, wholesalePrice)" };
    }
    if (!data.retailPrice || isNaN(data.retailPrice) || data.retailPrice <= 0) {
        return { success: false, error: "Retail price must be a positive number" };
    }
    if (data.stockQuantity < 0 || isNaN(data.stockQuantity)) {
        return { success: false, error: "Stock quantity cannot be negative" };
    }

    try {
        await prisma.$transaction(async (tx) => {
            const product = await tx.product.create({ data: data as any });

            // Initial stock log
            if (data.stockQuantity > 0) {
                await tx.inventoryLog.create({
                    data: {
                        productId: product.id,
                        changeType: "INITIAL_STOCK",
                        quantity: data.stockQuantity,
                        source: "ADMIN",
                        reason: "Initial stock on product creation",
                    },
                });
            }

            // Link collections
            if (collectionIds.length > 0) {
                await tx.productCollection.createMany({
                    data: collectionIds.filter(Boolean).map((cid) => ({
                        productId: product.id,
                        collectionId: cid,
                    })),
                });
            }

            // Link tags
            if (tagIds.length > 0) {
                await tx.productTag.createMany({
                    data: tagIds.filter(Boolean).map((tid) => ({
                        productId: product.id,
                        tagId: tid,
                    })),
                });
            }
        });

        await logEvent("PRODUCT_CREATED", "new", `Product "${data.name}" created with ${data.stockQuantity} units`);
        revalidatePath("/admin/products");
        revalidatePath("/catalog");
        revalidatePath("/");
        return { success: true };
    } catch (error) {
        console.error("Create product error:", error);
        return { success: false, error: "Failed to create product" };
    }
}

export async function updateProduct(id: string, formData: FormData) {
    const data = {
        name: formData.get("name") as string,
        brand: formData.get("brand") as string,
        description: formData.get("description") as string,
        categoryId: formData.get("categoryId") as string,
        imageUrl: formData.get("imageUrl") as string,
        wholesalePrice: Number(formData.get("wholesalePrice")),
        retailPrice: Number(formData.get("retailPrice")),
        stockQuantity: Number(formData.get("stockQuantity")),
        minimumOrderQuantity: Number(formData.get("minimumOrderQuantity")),
        unitsPerBox: Number(formData.get("unitsPerBox")),
        status: (formData.get("status") as string) || "ACTIVE",
    };

    const collectionIds = formData.getAll("collectionIds") as string[];
    const tagIds = formData.getAll("tagIds") as string[];

    try {
        await prisma.$transaction(async (tx) => {
            await tx.product.update({ where: { id }, data: data as any });

            // Sync collections
            await tx.productCollection.deleteMany({ where: { productId: id } });
            if (collectionIds.filter(Boolean).length > 0) {
                await tx.productCollection.createMany({
                    data: collectionIds.filter(Boolean).map((cid) => ({
                        productId: id,
                        collectionId: cid,
                    })),
                });
            }

            // Sync tags
            await tx.productTag.deleteMany({ where: { productId: id } });
            if (tagIds.filter(Boolean).length > 0) {
                await tx.productTag.createMany({
                    data: tagIds.filter(Boolean).map((tid) => ({
                        productId: id,
                        tagId: tid,
                    })),
                });
            }
        });

        revalidatePath("/admin/products");
        revalidatePath("/catalog");
        revalidatePath("/");
        return { success: true };
    } catch (error) {
        console.error("Update product error:", error);
        return { success: false, error: "Failed to update product" };
    }
}

export async function deleteProduct(id: string) {
    try {
        await prisma.product.delete({ where: { id } });
        await logEvent("PRODUCT_DELETED", id, `Product ${id} deleted`);
        revalidatePath("/admin/products");
        revalidatePath("/catalog");
        return { success: true };
    } catch (error) {
        return { success: false, error: "Failed to delete product (might be referenced in orders)" };
    }
}
