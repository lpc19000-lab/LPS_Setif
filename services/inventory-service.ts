import prisma from "@/lib/db";

// ── STOCK ADJUSTMENTS ─────────────────────────────────────────────────────
export const decrementStock = async (productId: string, quantity: number, volume: number = 100) => {
    const totalMl = quantity * volume;
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) throw new Error(`Product ${productId} not found`);
    if (product.stockMl < totalMl) {
        throw new Error(
            `Insufficient stock for "${product.name}". Available: ${product.stockMl}ml, Requested: ${totalMl}ml`
        );
    }
    return await prisma.product.update({
        where: { id: productId },
        data: { stockMl: { decrement: totalMl } },
    });
};

export const incrementStock = async (productId: string, quantity: number, volume: number = 100) => {
    const totalMl = quantity * volume;
    return await prisma.product.update({
        where: { id: productId },
        data: { stockMl: { increment: totalMl } },
    });
};

// ── STOCK QUERIES ─────────────────────────────────────────────────────────
export const getStockLevel = async (productId: string) => {
    const product = await prisma.product.findUnique({
        where: { id: productId },
        select: { id: true, name: true, stockMl: true },
    });
    return product;
};

export const getLowStockProducts = async (threshold = 500) => {
    return await prisma.product.findMany({
        where: { stockMl: { lte: threshold } },
        include: { category: true },
        orderBy: { stockMl: "asc" },
    });
};

// ── ADMIN ADJUSTMENTS ─────────────────────────────────────────────────────
export const adjustStock = async (
    productId: string,
    mlAmount: number, // can be positive or negative
    reason: string
) => {
    return await prisma.$transaction(async (tx) => {
        const product = await tx.product.findUnique({ where: { id: productId } });
        if (!product) throw new Error("Product not found");

        const newStock = product.stockMl + mlAmount;
        if (newStock < 0) {
            throw new Error("Cannot adjust stock below 0ml.");
        }

        const updated = await tx.product.update({
            where: { id: productId },
            data: { stockMl: { increment: mlAmount } },
        });

        await tx.inventoryLog.create({
            data: {
                productId,
                changeType: "MANUAL_ADJUSTMENT",
                quantity: mlAmount,
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
