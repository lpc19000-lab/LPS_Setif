import { adminDb } from "@/lib/firebase-admin";
import { unstable_cache, revalidateTag } from "next/cache";

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
        let queryRef: any = adminDb.collection("products").where("status", "==", "ACTIVE");

        if (filters?.categoryId) queryRef = queryRef.where("categoryId", "==", filters.categoryId);
        if (filters?.brand) queryRef = queryRef.where("brand", "==", filters.brand);
        if (filters?.inStock) queryRef = queryRef.where("stockWeight", ">", 0);

        const snapshot = await queryRef.get();
        let products = snapshot.docs.map((doc: any) => {
            const data = doc.data();
            const images = (data.images || [])
                .sort((a: any, b: any) => (a.position || 0) - (b.position || 0))
                .slice(0, 1);
            return {
                id: doc.id,
                name: data.name,
                slug: data.slug,
                brand: data.brand,
                imageUrl: data.imageUrl,
                basePrice: data.basePrice,
                stockWeight: data.stockWeight,
                category: data.categoryId ? { id: data.categoryId } : null,
                images,
                volumes: data.volumes || []
            };
        });

        // Client-side filtering for search (Firestore doesn't support LIKE/contains)
        if (filters?.search) {
            const s = filters.search.toLowerCase();
            products = products.filter((p: any) =>
                p.name?.toLowerCase().includes(s) || p.brand?.toLowerCase().includes(s)
            );
        }

        // Collection filtering
        if (filters?.collectionSlug) {
            const collQuery = await adminDb.collection("collections")
                .where("slug", "==", filters.collectionSlug).limit(1).get();
            if (!collQuery.empty) {
                const collId = collQuery.docs[0].id;
                products = products.filter((p: any) =>
                    p.collectionIds && p.collectionIds.includes(collId)
                );
            } else {
                products = [];
            }
        }

        // Tag filtering
        if (filters?.tagSlug) {
            const tagQuery = await adminDb.collection("tags")
                .where("slug", "==", filters.tagSlug).limit(1).get();
            if (!tagQuery.empty) {
                const tagId = tagQuery.docs[0].id;
                products = products.filter((p: any) =>
                    p.tagIds && p.tagIds.includes(tagId)
                );
            } else {
                products = [];
            }
        }

        const total = products.length;
        const skip = filters?.skip || 0;
        const limit = filters?.limit || 50;
        const paged = products.slice(skip, skip + limit);

        return { products: paged, total };
    };

    const cacheKey = JSON.stringify(filters || {});
    return unstable_cache(
        fetchFunc,
        ['products', cacheKey],
        { revalidate: 300, tags: ['products'] }
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
        let queryRef: any = adminDb.collection("products");

        if (filters?.categoryId) queryRef = queryRef.where("categoryId", "==", filters.categoryId);
        if (filters?.brand) queryRef = queryRef.where("brand", "==", filters.brand);
        if (filters?.status) queryRef = queryRef.where("status", "==", filters.status);

        const snapshot = await queryRef.get();
        let products = snapshot.docs.map((doc: any) => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                images: (data.images || []).sort((a: any, b: any) => (a.position || 0) - (b.position || 0)),
                tags: (data.tagIds || []).map((tid: string) => ({ tag: { id: tid } })),
                collections: (data.collectionIds || []).map((cid: string) => ({ collection: { id: cid } })),
                volumes: data.volumes || [],
                category: data.categoryId ? { id: data.categoryId } : null,
            };
        });

        if (filters?.search) {
            const s = filters.search.toLowerCase();
            products = products.filter((p: any) =>
                p.name?.toLowerCase().includes(s) || p.brand?.toLowerCase().includes(s)
            );
        }

        return products.slice(0, filters?.limit || 100);
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
            const doc = await adminDb.collection("products").doc(id).get();
            if (!doc.exists) return null;
            const data = doc.data();
            
            // Fetch category
            let category = null;
            if (data?.categoryId) {
                const catDoc = await adminDb.collection("categories").doc(data.categoryId).get();
                if (catDoc.exists) category = { id: catDoc.id, ...catDoc.data() };
            }

            // Fetch tag details
            const tags = await Promise.all((data?.tagIds || []).map(async (tid: string) => {
                const tagDoc = await adminDb.collection("tags").doc(tid).get();
                return { tag: tagDoc.exists ? { id: tagDoc.id, ...tagDoc.data() } : { id: tid } };
            }));

            // Fetch collection details
            const collections = await Promise.all((data?.collectionIds || []).map(async (cid: string) => {
                const colDoc = await adminDb.collection("collections").doc(cid).get();
                return { collection: colDoc.exists ? { id: colDoc.id, ...colDoc.data() } : { id: cid } };
            }));

            return {
                id: doc.id,
                ...data,
                category,
                images: (data?.images || []).sort((a: any, b: any) => (a.position || 0) - (b.position || 0)),
                tags,
                collections,
                volumes: data?.volumes || [],
            };
        },
        ['product-id', id],
        { tags: ['products', `product-${id}`] }
    )();
};

export const getProductBySlug = (slug: string) => {
    return unstable_cache(
        async () => {
            const query = await adminDb.collection("products")
                .where("slug", "==", slug).limit(1).get();
            if (query.empty) return null;
            
            const doc = query.docs[0];
            const data = doc.data();

            let category = null;
            if (data?.categoryId) {
                const catDoc = await adminDb.collection("categories").doc(data.categoryId).get();
                if (catDoc.exists) category = { id: catDoc.id, ...catDoc.data() };
            }

            const tags = await Promise.all((data?.tagIds || []).map(async (tid: string) => {
                const tagDoc = await adminDb.collection("tags").doc(tid).get();
                return { tag: tagDoc.exists ? { id: tagDoc.id, ...tagDoc.data() } : { id: tid } };
            }));

            const collections = await Promise.all((data?.collectionIds || []).map(async (cid: string) => {
                const colDoc = await adminDb.collection("collections").doc(cid).get();
                return { collection: colDoc.exists ? { id: colDoc.id, ...colDoc.data() } : { id: cid } };
            }));

            return {
                id: doc.id,
                ...data,
                category,
                images: (data?.images || []).sort((a: any, b: any) => (a.position || 0) - (b.position || 0)),
                tags,
                collections,
                volumes: data?.volumes || [],
            };
        },
        ['product-slug', slug],
        { tags: ['products', `product-slug-${slug}`] }
    )();
};

// ── Featured / New Arrivals / Best Sellers ────────────────────────────────
export const getFeaturedProducts = (limit = 8) => {
    return unstable_cache(
        async () => {
            // Featured products have tag "featured". 
            // First find the featured tag ID
            const tagQuery = await adminDb.collection("tags")
                .where("slug", "==", "featured").limit(1).get();
            
            if (tagQuery.empty) return [];
            const featuredTagId = tagQuery.docs[0].id;

            const query = await adminDb.collection("products")
                .where("status", "==", "ACTIVE")
                .where("tagIds", "array-contains", featuredTagId)
                .limit(limit)
                .get();

            return query.docs.map(doc => {
                const d = doc.data();
                return {
                    id: doc.id,
                    name: d.name,
                    slug: d.slug,
                    brand: d.brand,
                    imageUrl: d.imageUrl,
                    basePrice: d.basePrice,
                    volumes: d.volumes || [],
                    category: d.categoryId ? { name: d.categoryName || "" } : null,
                    images: (d.images || []).sort((a: any, b: any) => (a.position || 0) - (b.position || 0)).slice(0, 1)
                };
            });
        },
        ['featured-products', String(limit)],
        { tags: ['products', 'featured'] }
    )();
};

export const getNewArrivals = (limit = 8) => {
    return unstable_cache(
        async () => {
            const query = await adminDb.collection("products")
                .where("status", "==", "ACTIVE")
                .orderBy("createdAt", "desc")
                .limit(limit)
                .get();
            return query.docs.map(doc => {
                const d = doc.data();
                return {
                    id: doc.id,
                    name: d.name,
                    slug: d.slug,
                    brand: d.brand,
                    imageUrl: d.imageUrl,
                    basePrice: d.basePrice,
                    volumes: d.volumes || [],
                    category: d.categoryId ? { name: d.categoryName || "" } : null,
                    images: (d.images || []).sort((a: any, b: any) => (a.position || 0) - (b.position || 0)).slice(0, 1)
                };
            });
        },
        ['new-arrivals', String(limit)],
        { tags: ['products', 'new-arrivals'] }
    )();
};

export const getBestSellers = (limit = 8) => {
    return unstable_cache(
        async () => {
            // Products with embedded sales data, sorted by unitsSold
            const query = await adminDb.collection("products")
                .where("status", "==", "ACTIVE")
                .get();
            
            const products = query.docs.map(doc => {
                const d = doc.data();
                return {
                    id: doc.id,
                    name: d.name,
                    slug: d.slug,
                    brand: d.brand,
                    imageUrl: d.imageUrl,
                    basePrice: d.basePrice,
                    volumes: d.volumes || [],
                    category: d.categoryId ? { name: d.categoryName || "" } : null,
                    images: (d.images || []).sort((a: any, b: any) => (a.position || 0) - (b.position || 0)).slice(0, 1),
                    unitsSold: d.sales?.unitsSold || 0
                };
            });

            return products
                .sort((a, b) => b.unitsSold - a.unitsSold)
                .slice(0, limit)
                .map(({ unitsSold, ...rest }) => rest);
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

    const productDoc: any = {
        ...productData,
        slug,
        status: data.status || "ACTIVE",
        collectionIds: collectionIds || [],
        tagIds: tagIds || [],
        volumes: (volumes || []).map((v, i) => ({
            id: `vol-${Date.now()}-${i}`,
            weight: v.weight,
            price: v.price
        })),
        images: (additionalImages || []).map((url, i) => ({
            imageUrl: url,
            isPrimary: i === 0 && !data.imageUrl,
            position: i
        })),
        sales: { unitsSold: 0, revenue: 0 },
        createdAt: new Date(),
    };

    const docRef = await adminDb.collection("products").add(productDoc);

    // Log initial stock
    if (data.stockWeight > 0) {
        await adminDb.collection("inventory_logs").add({
            productId: docRef.id,
            changeType: "INITIAL_STOCK",
            quantity: data.stockWeight,
            source: "ADMIN",
            reason: "Initial stock on product creation",
            createdAt: new Date(),
        });
    }

    (revalidateTag as any)('products');
    return { id: docRef.id, ...productDoc };
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

    const updateObj: any = { ...productData };

    if (collectionIds !== undefined) updateObj.collectionIds = collectionIds;
    if (tagIds !== undefined) updateObj.tagIds = tagIds;
    if (volumes !== undefined) {
        updateObj.volumes = volumes.map((v, i) => ({
            id: `vol-${Date.now()}-${i}`,
            weight: v.weight,
            price: v.price
        }));
    }

    await adminDb.collection("products").doc(id).update(updateObj);
    (revalidateTag as any)('products');
    return { id, ...updateObj };
};

// ── DELETE ────────────────────────────────────────────────────────────────
export const deleteProduct = async (id: string) => {
    await adminDb.collection("products").doc(id).delete();
    (revalidateTag as any)('products');
    return { id };
};

// ── LOW STOCK ─────────────────────────────────────────────────────────────
export const getLowStockProducts = async () => {
    const query = await adminDb.collection("products")
        .where("stockWeight", "<=", 500)
        .orderBy("stockWeight", "asc")
        .get();
    return query.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};
