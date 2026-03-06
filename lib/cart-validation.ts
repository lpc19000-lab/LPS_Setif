// ── Cart Validation Utility ────────────────────────────────────────────────
// Verifies server-side that all cart items are still valid before checkout.
// Checks: product exists, product is active, stock is available, MOQ is met.

import prisma from "@/lib/db";

export interface CartValidationItem {
  productId: string;
  quantity: number;
}

export interface CartValidationResult {
  valid: boolean;
  errors: string[];
  validatedItems: {
    productId: string;
    name: string;
    quantity: number;
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
    include: { priceTiers: { orderBy: { minQuantity: "desc" } } },
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

    if (product.stockQuantity < item.quantity) {
      errors.push(
        `Insufficient stock for "${product.name}". Available: ${product.stockQuantity}, Requested: ${item.quantity}.`
      );
      continue;
    }

    if (item.quantity < product.minimumOrderQuantity) {
      errors.push(
        `Minimum order for "${product.name}" is ${product.minimumOrderQuantity}. You have ${item.quantity}.`
      );
      continue;
    }

    if (item.quantity % product.unitsPerBox !== 0) {
      errors.push(
        `Quantity for "${product.name}" must be a multiple of ${product.unitsPerBox}.`
      );
      continue;
    }

    // Server-side price calculation
    let unitPrice = Number(product.wholesalePrice);
    for (const tier of product.priceTiers) {
      if (item.quantity >= tier.minQuantity) {
        unitPrice = Number(tier.price);
        break;
      }
    }

    const lineTotal = unitPrice * item.quantity;
    total += lineTotal;
    validatedItems.push({
      productId: product.id,
      name: product.name,
      quantity: item.quantity,
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
