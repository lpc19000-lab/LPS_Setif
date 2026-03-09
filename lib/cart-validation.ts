// ── Cart Validation Utility ────────────────────────────────────────────────
// Verifies server-side that all cart items are still valid before checkout.
// Checks: product exists, product is active, stock is available.

import prisma from "@/lib/db";

export interface CartValidationItem {
    productId: string;
    quantity: number;
    selectedVolume: number;
}

export interface CartValidationResult {
    valid: boolean;
    errors: string[];
    validatedItems: {
        productId: string;
        name: string;
        quantity: number;
        selectedVolume: number;
        unitPrice: number;
        lineTotal: number;
    }[];
    total: number;
}

export async function validateCartItems(
    items: CartValidationItem[]
): Promise<CartValidationResult> {
    const errors: string[] = [];
    const validatedItems: CartValidationResult["validatedItems"] = [];
    let total = 0;

    const productIds = items.map((i) => i.productId);
    const products = await prisma.product.findMany({
        where: { id: { in: productIds } },
        include: { volumes: true },
    });

    for (const item of items) {
        const product = products.find((p) => p.id === item.productId);

        if (!product) {
            errors.push(`Product ${item.productId} no longer exists.`);
            continue;
        }

        if (product.status !== "ACTIVE") {
            errors.push(`"${product.name}" is no longer available.`);
            continue;
        }

        // Stock validation (weight-based)
        const requiredWeight = item.quantity * item.selectedVolume;
        if (product.stockWeight < requiredWeight) {
            errors.push(
                `Insufficient stock for "${product.name}". Available: ${product.stockWeight}g, Requested: ${requiredWeight}g.`
            );
            continue;
        }

        // Price calculation: find matching volume price or fallback to base price calculation
        const volumeData = product.volumes.find((v) => v.weight === item.selectedVolume);
        const unitPrice = volumeData
            ? Number(volumeData.price)
            : (Number(product.basePrice) / 100) * item.selectedVolume;

        const lineTotal = unitPrice * item.quantity;
        total += lineTotal;

        validatedItems.push({
            productId: product.id,
            name: product.name,
            quantity: item.quantity,
            selectedVolume: item.selectedVolume,
            unitPrice,
            lineTotal,
        });
    }

    return {
        valid: errors.length === 0,
        errors,
        validatedItems,
        total,
    };
}

