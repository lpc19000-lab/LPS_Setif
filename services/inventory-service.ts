import prisma from "@/lib/db";

// ── STOCK ADJUSTMENTS ─────────────────────────────────────────────────────
export const decrementStock = async (productId: string, quantity: number) => {
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) throw new Error(`Product ${productId} not found`);
    if (product.stockQuantity < quantity) {
        throw new Error(
            `Insufficient stock for "${product.name}". Available: ${product.stockQuantity}, Requested: ${quantity}`
        );
    }
    return await prisma.product.update({
        where: { id: productId },
        data: { stockQuantity: { decrement: quantity } },
    });
};

export const incrementStock = async (productId: string, quantity: number) => {
    return await prisma.product.update({
        where: { id: productId },
        data: { stockQuantity: { increment: quantity } },
    });
};

// ── STOCK QUERIES ─────────────────────────────────────────────────────────
export const getStockLevel = async (productId: string) => {
    const product = await prisma.product.findUnique({
        where: { id: productId },
        select: { id: true, name: true, stockQuantity: true, minimumOrderQuantity: true },
    });
    return product;
};

export const getLowStockProducts = async (threshold = 10) => {
    return await prisma.product.findMany({
        where: { stockQuantity: { lte: threshold } },
        include: { category: true },
        orderBy: { stockQuantity: "asc" },
    });
};

// ── ADMIN ADJUSTMENTS ─────────────────────────────────────────────────────
export const adjustStock = async (
    productId: string,
    quantity: number, // can be positive or negative
    reason: string
) => {
    return await prisma.$transaction(async (tx) => {
        const product = await tx.product.findUnique({ where: { id: productId } });
        if (!product) throw new Error("Product not found");

        const newStock = product.stockQuantity + quantity;
        if (newStock < 0) {
            throw new Error("Cannot adjust stock below 0.");
        }

        const updated = await tx.product.update({
            where: { id: productId },
            data: { stockQuantity: { increment: quantity } },
        });

        await tx.inventoryLog.create({
            data: {
                productId,
                changeType: "MANUAL_ADJUSTMENT",
                quantity,
                source: "ADMIN",
                reason,
            },
        });

        return updated;
    });
};

// ── HISTORY ───────────────────────────────────────────────────────────────
export const getInventoryHistory = async (filters?: { productId?: string; changeType?: "SALE" | "CANCEL" | "RESTOCK" | "MANUAL_ADJUSTMENT" }) => {
    return await prisma.inventoryLog.findMany({
        where: { ...filters },
        include: { product: { select: { name: true, brand: true, imageUrl: true } } },
        orderBy: { createdAt: "desc" },
    });
};
