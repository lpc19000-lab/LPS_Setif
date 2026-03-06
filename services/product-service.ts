import prisma from "@/lib/db";

// ── Utility ───────────────────────────────────────────────────────────────
function generateSlug(name: string): string {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

// ── READ ──────────────────────────────────────────────────────────────────
export const getProducts = async (filters?: {
    categoryId?: string;
    brand?: string;
    search?: string;
    status?: string;
    collectionSlug?: string;
    tagSlug?: string;
    limit?: number;
}) => {
    const where: Record<string, unknown> = {};

    if (filters?.categoryId) where.categoryId = filters.categoryId;
    if (filters?.brand) where.brand = filters.brand;
    if (filters?.status) where.status = filters.status;
    if (filters?.search) {
        where.OR = [
            { name: { contains: filters.search, mode: "insensitive" } },
            { brand: { contains: filters.search, mode: "insensitive" } },
        ];
    }
    if (filters?.collectionSlug) {
        where.collections = { some: { collection: { slug: filters.collectionSlug } } };
    }
    if (filters?.tagSlug) {
        where.tags = { some: { tag: { slug: filters.tagSlug } } };
    }

    return await prisma.product.findMany({
        where,
        take: filters?.limit || 100,
        include: {
            category: true,
            images: { orderBy: { position: "asc" } },
            tags: { include: { tag: true } },
            collections: { include: { collection: true } },
        },
        orderBy: { createdAt: "desc" },
    });
};

// ── Active products only (for storefront) ─────────────────────────────────
export const getActiveProducts = async (filters?: {
    categoryId?: string;
    brand?: string;
    search?: string;
    collectionSlug?: string;
    tagSlug?: string;
    inStock?: boolean;
    limit?: number;
}) => {
    const where: Record<string, unknown> = { status: "ACTIVE" };

    if (filters?.categoryId) where.categoryId = filters.categoryId;
    if (filters?.brand) where.brand = filters.brand;
    if (filters?.search) {
        where.OR = [
            { name: { contains: filters.search, mode: "insensitive" } },
            { brand: { contains: filters.search, mode: "insensitive" } },
        ];
    }
    if (filters?.collectionSlug) {
        where.collections = { some: { collection: { slug: filters.collectionSlug } } };
    }
    if (filters?.tagSlug) {
        where.tags = { some: { tag: { slug: filters.tagSlug } } };
    }
    if (filters?.inStock) {
        where.stockQuantity = { gt: 0 };
    }

    return await prisma.product.findMany({
        where,
        take: filters?.limit || 50,
        include: {
            category: true,
            images: { orderBy: { position: "asc" }, take: 1 },
        },
        orderBy: { createdAt: "desc" },
    });
};

export const getProductById = async (id: string) => {
    return await prisma.product.findUnique({
        where: { id },
        include: {
            category: true,
            images: { orderBy: { position: "asc" } },
            tags: { include: { tag: true } },
            collections: { include: { collection: true } },
        },
    });
};

export const getProductBySlug = async (slug: string) => {
    return await prisma.product.findUnique({
        where: { slug },
        include: {
            category: true,
            images: { orderBy: { position: "asc" } },
            tags: { include: { tag: true } },
            collections: { include: { collection: true } },
        },
    });
};

// ── Featured / New Arrivals / Best Sellers ────────────────────────────────
export const getFeaturedProducts = async (limit = 8) => {
    return await prisma.product.findMany({
        where: {
            status: "ACTIVE",
            tags: { some: { tag: { slug: "featured" } } },
        },
        include: { category: true, images: { orderBy: { position: "asc" }, take: 1 } },
        take: limit,
    });
};

export const getNewArrivals = async (limit = 8) => {
    return await prisma.product.findMany({
        where: { status: "ACTIVE" },
        include: { category: true, images: { orderBy: { position: "asc" }, take: 1 } },
        orderBy: { createdAt: "desc" },
        take: limit,
    });
};

export const getBestSellers = async (limit = 8) => {
    const salesData = await prisma.productSales.findMany({
        where: { product: { status: "ACTIVE" } },
        include: {
            product: {
                include: { category: true, images: { orderBy: { position: "asc" }, take: 1 } },
            },
        },
        orderBy: { unitsSold: "desc" },
        take: limit,
    });
    return salesData.map((s) => s.product);
};

// ── CREATE ────────────────────────────────────────────────────────────────
export const createProduct = async (data: {
    name: string;
    brand: string;
    description: string;
    categoryId: string;
    imageUrl: string;
    wholesalePrice: number;
    retailPrice: number;
    stockQuantity: number;
    minimumOrderQuantity: number;
    unitsPerBox: number;
    status?: string;
    collectionIds?: string[];
    tagIds?: string[];
    additionalImages?: string[];
}) => {
    const slug = generateSlug(data.name) + "-" + Date.now().toString(36);
    const { collectionIds, tagIds, additionalImages, ...productData } = data;

    return await prisma.$transaction(async (tx) => {
        const product = await tx.product.create({
            data: {
                ...productData,
                slug,
                status: (data.status as any) || "ACTIVE",
            },
        });

        // Create initial stock log
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
        if (collectionIds && collectionIds.length > 0) {
            await tx.productCollection.createMany({
                data: collectionIds.map((cid) => ({
                    productId: product.id,
                    collectionId: cid,
                })),
            });
        }

        // Link tags
        if (tagIds && tagIds.length > 0) {
            await tx.productTag.createMany({
                data: tagIds.map((tid) => ({
                    productId: product.id,
                    tagId: tid,
                })),
            });
        }

        // Additional images
        if (additionalImages && additionalImages.length > 0) {
            await tx.productImage.createMany({
                data: additionalImages.map((url, i) => ({
                    productId: product.id,
                    imageUrl: url,
                    isPrimary: i === 0 && !data.imageUrl,
                    position: i,
                })),
            });
        }

        return product;
    });
};

// ── UPDATE ────────────────────────────────────────────────────────────────
export const updateProduct = async (
    id: string,
    data: Partial<{
        name: string;
        brand: string;
        description: string;
        categoryId: string;
        imageUrl: string;
        wholesalePrice: number;
        retailPrice: number;
        stockQuantity: number;
        minimumOrderQuantity: number;
        unitsPerBox: number;
        status: string;
        collectionIds: string[];
        tagIds: string[];
    }>
) => {
    const { collectionIds, tagIds, ...productData } = data;

    return await prisma.$transaction(async (tx) => {
        const product = await tx.product.update({ where: { id }, data: productData as any });

        // Sync collections
        if (collectionIds !== undefined) {
            await tx.productCollection.deleteMany({ where: { productId: id } });
            if (collectionIds.length > 0) {
                await tx.productCollection.createMany({
                    data: collectionIds.map((cid) => ({
                        productId: id,
                        collectionId: cid,
                    })),
                });
            }
        }

        // Sync tags
        if (tagIds !== undefined) {
            await tx.productTag.deleteMany({ where: { productId: id } });
            if (tagIds.length > 0) {
                await tx.productTag.createMany({
                    data: tagIds.map((tid) => ({
                        productId: id,
                        tagId: tid,
                    })),
                });
            }
        }

        return product;
    });
};

// ── DELETE ────────────────────────────────────────────────────────────────
export const deleteProduct = async (id: string) => {
    return await prisma.product.delete({ where: { id } });
};

// ── LOW STOCK ─────────────────────────────────────────────────────────────
export const getLowStockProducts = async (threshold = 10) => {
    return await prisma.product.findMany({
        where: { stockQuantity: { lte: threshold } },
        include: { category: true },
        orderBy: { stockQuantity: "asc" },
    });
};
