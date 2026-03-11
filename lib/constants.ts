// ── Order Status Constants ─────────────────────────────────────────────────
// Replaces the Prisma OrderStatus enum after migration to Firebase

export const OrderStatus = {
    PENDING: "PENDING",
    CONFIRMED: "CONFIRMED",
    PROCESSING: "PROCESSING",
    SHIPPED: "SHIPPED",
    DELIVERED: "DELIVERED",
    CANCELLED: "CANCELLED",
} as const;

export type OrderStatus = (typeof OrderStatus)[keyof typeof OrderStatus];

// ── Product Status Constants ──────────────────────────────────────────────
export const ProductStatus = {
    ACTIVE: "ACTIVE",
    DRAFT: "DRAFT",
    ARCHIVED: "ARCHIVED",
} as const;

export type ProductStatus = (typeof ProductStatus)[keyof typeof ProductStatus];
