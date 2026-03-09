import prisma from "@/lib/db";

// ── STOCK ADJUSTMENTS ─────────────────────────────────────────────────────
export const decrementStock = async (productId: string, quantity: number, weight: number = 100) => {
    const totalWeight = quantity * weight;
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) throw new Error(`Product ${productId} not found`);
    if (product.stockWeight < totalWeight) {
        throw new Error(
            `Insufficient stock for "${product.name}". Available: ${product.stockWeight}g, Requested: ${totalWeight}g`
        );
    }
    return await prisma.product.update({
        where: { id: productId },
        data: { stockWeight: { decrement: totalWeight } },
    });
};

export const incrementStock = async (productId: string, quantity: number, weight: number = 100) => {
    const totalWeight = quantity * weight;
    return await prisma.product.update({
        where: { id: productId },
        data: { stockWeight: { increment: totalWeight } },
    });
};

// ── STOCK QUERIES ─────────────────────────────────────────────────────────
export const getStockLevel = async (productId: string) => {
    const product = await prisma.product.findUnique({
        where: { id: productId },
        select: { id: true, name: true, stockWeight: true },
    });
    return product;
};

export const getLowStockProducts = async (threshold = 500) => {
    return await prisma.product.findMany({
        where: { stockWeight: { lte: threshold } },
        include: { category: true },
        orderBy: { stockWeight: "asc" },
    });
};

// ── ADMIN ADJUSTMENTS ─────────────────────────────────────────────────────
export const adjustStock = async (
    productId: string,
    weightAmount: number, // can be positive or negative
    reason: string
) => {
    return await prisma.$transaction(async (tx) => {
        const product = await tx.product.findUnique({ where: { id: productId } });
        if (!product) throw new Error("Product not found");

        const newStock = product.stockWeight + weightAmount;
        if (newStock < 0) {
            throw new Error("Cannot adjust stock below 0g.");
        }

        const updated = await tx.product.update({
            where: { id: productId },
            data: { stockWeight: { increment: weightAmount } },
        });

        await tx.inventoryLog.create({
            data: {
                productId,
                changeType: "MANUAL_ADJUSTMENT",
                quantity: weightAmount,
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
