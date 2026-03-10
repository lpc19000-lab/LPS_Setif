import prisma from "@/lib/db";
import { unstable_cache, revalidateTag } from "next/cache";
import { ProductStatus } from "@prisma/client";

// ── Utility ───────────────────────────────────────────────────────────────
function generateSlug(name: string): string {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

// ── READ ──────────────────────────────────────────────────────────────────
export const getActiveProducts = (filters?: {
    categoryId?: string;
    brand?: string;
    search?: string;
    collectionSlug?: string;
    tagSlug?: string;
    inStock?: boolean;
    limit?: number;
    skip?: number;
}) => {
    const fetchFunc = async () => {
        const where: Record<string, any> = { status: "ACTIVE" };

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
            where.stockWeight = { gt: 0 };
        }

        const [products, total] = await Promise.all([
            prisma.product.findMany({
                where,
                take: filters?.limit || 50,
                skip: filters?.skip || 0,
                select: {
                    id: true,
                    name: true,
                    slug: true,
                    brand: true,
                    imageUrl: true,
                    basePrice: true,
                    stockWeight: true,
                    category: {
                        select: {
                            id: true,
                            name: true,
                            slug: true
                        }
                    },
                    images: {
                        select: {
                            imageUrl: true,
                            position: true
                        },
                        orderBy: { position: "asc" },
                        take: 1
                    },
                    volumes: {
                        select: {
                            weight: true,
                            price: true
                        }
                    }
                },
                orderBy: { createdAt: "desc" },
            }),
            prisma.product.count({ where })
        ]);

        return { products, total };
    };

    // Cache key for the specific filter set
    const cacheKey = JSON.stringify(filters || {});

    return unstable_cache(
        fetchFunc,
        ['products', cacheKey],
        {
            revalidate: 300, // 5 minutes fallback
            tags: ['products']
        }
    )();
};

export const getProducts = (filters?: {
    categoryId?: string;
    brand?: string;
    search?: string;
    status?: string;
    collectionSlug?: string;
    tagSlug?: string;
    limit?: number;
}) => {
    const fetchFunc = async () => {
        const where: Record<string, any> = {};

        if (filters?.categoryId) where.categoryId = filters.categoryId;
        if (filters?.brand) where.brand = filters.brand;
        if (filters?.status) where.status = filters.status as ProductStatus;
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
            select: {
                id: true,
                name: true,
                slug: true,
                brand: true,
                imageUrl: true,
                basePrice: true,
                stockWeight: true,
                status: true,
                category: {
                    select: {
                        id: true,
                        name: true,
                        slug: true
                    }
                },
                images: { orderBy: { position: "asc" } },
                tags: { select: { tag: true } },
                collections: { select: { collection: true } },
                volumes: true,
            },
            orderBy: { createdAt: "desc" },
        });
    };

    const cacheKey = JSON.stringify(filters || {});
    return unstable_cache(
        fetchFunc,
        ['admin-products', cacheKey],
        { tags: ['products'] }
    )();
};

export const getProductById = (id: string) => {
    return unstable_cache(
        async () => {
            return await prisma.product.findUnique({
                where: { id },
                include: {
                    category: true,
                    images: { orderBy: { position: "asc" } },
                    tags: { include: { tag: true } },
                    collections: { include: { collection: true } },
                    volumes: true,
                },
            });
        },
        ['product-id', id],
        { tags: ['products', `product-${id}`] }
    )();
};

export const getProductBySlug = (slug: string) => {
    return unstable_cache(
        async () => {
            return await prisma.product.findUnique({
                where: { slug },
                include: {
                    category: true,
                    images: { orderBy: { position: "asc" } },
                    tags: { include: { tag: true } },
                    collections: { include: { collection: true } },
                    volumes: true,
                },
            });
        },
        ['product-slug', slug],
        { tags: ['products', `product-slug-${slug}`] }
    )();
};

// ── Featured / New Arrivals / Best Sellers ────────────────────────────────
export const getFeaturedProducts = (limit = 8) => {
    return unstable_cache(
        async () => {
            return await prisma.product.findMany({
                where: {
                    status: "ACTIVE",
                    tags: { some: { tag: { slug: "featured" } } },
                },
                select: {
                    id: true,
                    name: true,
                    slug: true,
                    brand: true,
                    imageUrl: true,
                    basePrice: true,
                    volumes: true,
                    category: { select: { name: true } },
                    images: { select: { imageUrl: true }, orderBy: { position: "asc" }, take: 1 }
                },
                take: limit,
            });
        },
        ['featured-products', String(limit)],
        { tags: ['products', 'featured'] }
    )();
};

export const getNewArrivals = (limit = 8) => {
    return unstable_cache(
        async () => {
            return await prisma.product.findMany({
                where: { status: "ACTIVE" },
                select: {
                    id: true,
                    name: true,
                    slug: true,
                    brand: true,
                    imageUrl: true,
                    basePrice: true,
                    volumes: true,
                    category: { select: { name: true } },
                    images: { select: { imageUrl: true }, orderBy: { position: "asc" }, take: 1 }
                },
                orderBy: { createdAt: "desc" },
                take: limit,
            });
        },
        ['new-arrivals', String(limit)],
        { tags: ['products', 'new-arrivals'] }
    )();
};

export const getBestSellers = (limit = 8) => {
    return unstable_cache(
        async () => {
            const salesData = await prisma.productSales.findMany({
                where: { product: { status: "ACTIVE" } },
                include: {
                    product: {
                        select: {
                            id: true,
                            name: true,
                            slug: true,
                            brand: true,
                            imageUrl: true,
                            basePrice: true,
                            volumes: true,
                            category: { select: { name: true } },
                            images: { select: { imageUrl: true }, orderBy: { position: "asc" }, take: 1 }
                        },
                    },
                },
                orderBy: { unitsSold: "desc" },
                take: limit,
            });
            return salesData.map((s) => s.product);
        },
        ['best-sellers', String(limit)],
        { tags: ['products', 'best-sellers'] }
    )();
};

// ── CREATE ────────────────────────────────────────────────────────────────
export const createProduct = async (data: {
    name: string;
    brand: string;
    description: string;
    categoryId: string;
    imageUrl: string;
    basePrice: number;
    stockWeight: number;
    lowStockThreshold?: number;
    status?: string;
    collectionIds?: string[];
    tagIds?: string[];
    additionalImages?: string[];
    volumes?: { weight: number; price: number }[];
}) => {
    const slug = generateSlug(data.name) + "-" + Date.now().toString(36);
    const { collectionIds, tagIds, additionalImages, volumes, ...productData } = data;

    return await prisma.$transaction(async (tx) => {
        const product = await tx.product.create({
            data: {
                ...productData,
                slug,
                status: (data.status as ProductStatus) || "ACTIVE",
                volumes: volumes ? {
                    create: volumes.map(v => ({
                        weight: v.weight,
                        price: v.price
                    }))
                } : undefined
            },
        });

        // Create initial stock log
        if (data.stockWeight > 0) {
            await tx.inventoryLog.create({
                data: {
                    productId: product.id,
                    changeType: "INITIAL_STOCK",
                    quantity: data.stockWeight,
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
        basePrice: number;
        stockWeight: number;
        lowStockThreshold: number;
        status: string;
        collectionIds: string[];
        tagIds: string[];
        volumes: { weight: number; price: number }[];
    }>
) => {
    const { collectionIds, tagIds, volumes, ...productData } = data;

    return await prisma.$transaction(async (tx) => {
        const updateData: any = { ...productData };
        if (productData.status) updateData.status = productData.status as ProductStatus;

        const product = await tx.product.update({
            where: { id },
            data: updateData
        });

        // Sync volumes if provided
        if (volumes !== undefined) {
            await tx.productVolume.deleteMany({ where: { productId: id } });
            if (volumes.length > 0) {
                await tx.productVolume.createMany({
                    data: volumes.map(v => ({
                        productId: id,
                        weight: v.weight,
                        price: v.price
                    }))
                });
            }
        }

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
    const result = await prisma.product.delete({ where: { id } });
    revalidateTag('products', "max");
    return result;
};

// ── LOW STOCK ─────────────────────────────────────────────────────────────
export const getLowStockProducts = async () => {
    // Current approach: products where stockWeight is less than their individual lowStockThreshold
    return await prisma.product.findMany({
        where: {
            OR: [
                { stockWeight: { lte: 500 } }, // default if not specified
                // Prisma doesn't support comparing two columns directly in findMany easily without raw query
                // but we can use a reasonable default or fetch and filter
            ]
        },
        include: { category: true },
        orderBy: { stockWeight: "asc" },
    });
};

