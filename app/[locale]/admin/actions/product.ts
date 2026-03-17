"use server";

import { supabaseAdmin } from "@/lib/supabase-admin";
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
        brand_id: formData.get("brandId") as string,
        description: formData.get("description") as string,
        category_id: formData.get("categoryId") as string,
        image_url: formData.get("imageUrl") as string,
        base_price: Number(formData.get("basePrice")),
        purchase_price: Number(formData.get("purchasePrice") || 0),
        stock_weight: Number(formData.get("stockWeight")),
        low_stock_threshold: Number(formData.get("lowStockThreshold") || 500),
        status: (formData.get("status") as string) || "ACTIVE",
    };

    console.log(`[ServerAction:createProduct] Creating product: ${data.name}, Image: ${data.image_url}`);

    const collectionIds = (formData.getAll("collectionIds") as string[]).filter(Boolean);
    const tagIds = (formData.getAll("tagIds") as string[]).filter(Boolean);

    if (!data.name || !data.brand_id || !data.category_id || !data.base_price || isNaN(data.base_price) || data.base_price <= 0) {
        return { success: false, error: "Missing or invalid required fields (name, brandId, categoryId, base_price)" };
    }
    if (data.stock_weight < 0 || isNaN(data.stock_weight)) {
        return { success: false, error: "Stock (g) cannot be negative" };
    }

    data.collection_ids = collectionIds;
    data.tag_ids = tagIds;

    // Sync brand name from brand_id
    if (data.brand_id) {
        const { data: brandData } = await supabaseAdmin.from("brands").select("name").eq("id", data.brand_id).single();
        if (brandData) {
            data.brand = brandData.name;
        }
    }

    try {
        const { data: product, error } = await supabaseAdmin
            .from("products")
            .insert(data)
            .select()
            .single();

        if (error) throw error;

        // Initial stock log
        if (data.stock_weight > 0) {
            await supabaseAdmin.from("inventory_logs").insert({
                product_id: product.id,
                change_type: "INITIAL_STOCK",
                quantity: data.stock_weight,
                source: "ADMIN",
                reason: "Initial stock on product creation",
            });
        }

        await logEvent("PRODUCT_CREATED", product.id, `Product "${data.name}" created with ${data.stock_weight}g`);
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
        brand_id: formData.get("brandId") as string,
        description: formData.get("description") as string,
        category_id: formData.get("categoryId") as string,
        image_url: formData.get("imageUrl") as string,
        base_price: Number(formData.get("basePrice")),
        purchase_price: Number(formData.get("purchasePrice") || 0),
        stock_weight: Number(formData.get("stockWeight")),
        low_stock_threshold: Number(formData.get("lowStockThreshold") || 500),
        status: (formData.get("status") as string) || "ACTIVE",
        updated_at: new Date().toISOString(),
    };

    console.log(`[ServerAction:updateProduct] Updating product ID: ${id}, New Image: ${data.image_url}`);

    // Sync brand name from brand_id
    if (data.brand_id) {
        const { data: brandData } = await supabaseAdmin.from("brands").select("name").eq("id", data.brand_id).single();
        if (brandData) {
            data.brand = brandData.name;
        }
    }

    const collectionIds = (formData.getAll("collectionIds") as string[]).filter(Boolean);
    const tagIds = (formData.getAll("tagIds") as string[]).filter(Boolean);

    data.collection_ids = collectionIds;
    data.tag_ids = tagIds;

    try {
        // Fetch old stock for logging
        const { data: oldData, error: fetchError } = await supabaseAdmin
            .from("products")
            .select("stock_weight, name")
            .eq("id", id)
            .single();

        if (fetchError) throw fetchError;
        const oldStock = oldData?.stock_weight || 0;

        const { error: updateError } = await supabaseAdmin
            .from("products")
            .update(data)
            .eq("id", id);

        if (updateError) throw updateError;

        // Log stock adjustment if changed
        if (data.stock_weight !== undefined && data.stock_weight !== oldStock) {
            await supabaseAdmin.from("inventory_logs").insert({
                product_id: id,
                change_type: "ADJUSTMENT",
                quantity: data.stock_weight - oldStock,
                source: "ADMIN",
                reason: `Manual adjustment from ${oldStock}g to ${data.stock_weight}g`,
            });
        }

        await logEvent("PRODUCT_UPDATED", id, `Product "${data.name}" updated (Stock: ${oldStock}g -> ${data.stock_weight}g)`);
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
        // Check for orders referencing this product via order_items table
        const { data: referencedItems, error: checkError } = await supabaseAdmin
            .from("order_items")
            .select("order_id")
            .eq('product_id', id)
            .limit(1);

        if (checkError) throw checkError;

        if (referencedItems && referencedItems.length > 0) {
            return { success: false, error: "Cannot delete product. It is referenced in existing orders." };
        }

        const { error: deleteError } = await supabaseAdmin
            .from("products")
            .delete()
            .eq("id", id);

        if (deleteError) throw deleteError;

        await logEvent("PRODUCT_DELETED", id, `Product ${id} deleted`);
        revalidatePath("/admin/products");
        revalidatePath("/catalog");
        (revalidateTag as any)("products");
        return { success: true };
    } catch (error) {
        console.error("Delete product error:", error);
        return { success: false, error: "Error during deletion" };
    }
}
