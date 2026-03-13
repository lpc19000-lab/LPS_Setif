import { adminDb } from "@/lib/firebase-admin";
import { QueryDocumentSnapshot, DocumentData } from "firebase-admin/firestore";
import { unstable_cache, revalidateTag } from "next/cache";
import { Product } from "@/types/firebase";

export type { Product };

// ── Utility ───────────────────────────────────────────────────────────────
function generateSlug(name: string): string {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function mapProduct(docId: string, data: any): Product {
    const imageUrl = data.imageUrl || data.image || "";
    const basePrice = Number(data.basePrice || data.price || 0);
    const categoryId = data.categoryId || (data.category && typeof data.category === 'string' ? data.category : data.category?.id);

    return {
        id: docId,
        name: data.name || "Unknown Product",
        slug: data.slug || "",
        brand: data.brand || "LPS",
        image: imageUrl,
        imageUrl: imageUrl, // Alias for compatibility
        price: basePrice,
        basePrice: basePrice, // Alias for compatibility
        stockWeight: data.stockWeight || 0,
        description: data.description || "",
        status: data.status || "ACTIVE",
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt || Date.now()),
        updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date(data.updatedAt || data.createdAt || Date.now()),
        category: categoryId ? { id: categoryId, name: data.categoryName || "" } : null,
        categoryId: categoryId,
        images: (data.images || []).sort((a: any, b: any) => (a.position || 0) - (b.position || 0)),
        volumes: data.volumes || [],
        tagIds: data.tagIds || [],
        collectionIds: data.collectionIds || [],
    } as Product;
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
        try {
            let queryRef: any = adminDb.collection("products").where("status", "==", "ACTIVE");

            if (filters?.categoryId) queryRef = queryRef.where("categoryId", "==", filters.categoryId);
            if (filters?.brand) queryRef = queryRef.where("brand", "==", filters.brand);
            if (filters?.inStock) queryRef = queryRef.where("stockWeight", ">", 0);

            const snapshot = await queryRef.get();
            let products = snapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => mapProduct(doc.id, doc.data()));

            // Client-side filtering for search
            if (filters?.search) {
                const s = filters.search.toLowerCase();
                products = products.filter((p: Product) =>
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
        } catch (err) {
            console.error("Products fetch error (getActiveProducts):", err);
            return { products: [], total: 0 };
        }
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
        try {
            let queryRef: any = adminDb.collection("products");

            if (filters?.categoryId) queryRef = queryRef.where("categoryId", "==", filters.categoryId);
            if (filters?.brand) queryRef = queryRef.where("brand", "==", filters.brand);
            if (filters?.status) queryRef = queryRef.where("status", "==", filters.status);

            const snapshot = await queryRef.get();
            let products = snapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => mapProduct(doc.id, doc.data()));

            if (filters?.search) {
                const s = filters.search.toLowerCase();
                products = products.filter((p: Product) =>
                    p.name?.toLowerCase().includes(s) || p.brand?.toLowerCase().includes(s)
                );
            }

            return products.slice(0, filters?.limit || 100);
        } catch (err) {
            console.error("Products fetch error (getProducts):", err);
            return [];
        }
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
            try {
                const doc = await adminDb.collection("products").doc(id).get();
                if (!doc.exists) return null;
                return mapProduct(doc.id, doc.data());
            } catch (err) {
                console.error("Product fetch error (getProductById):", err);
                return null;
            }
        },
        ['product-id', id],
        { tags: ['products', `product-${id}`] }
    )();
};

export const getProductBySlug = (slug: string) => {
    return unstable_cache(
        async () => {
            try {
                const query = await adminDb.collection("products")
                    .where("slug", "==", slug).limit(1).get();
                if (query.empty) return null;
                
                const doc = query.docs[0];
                return mapProduct(doc.id, doc.data());
            } catch (err) {
                console.error("Product fetch error (getProductBySlug):", err);
                return null;
            }
        },
        ['product-slug', slug],
        { tags: ['products', `product-slug-${slug}`] }
    )();
};

// ── Featured / New Arrivals / Best Sellers ────────────────────────────────
export const getFeaturedProducts = (limit = 8) => {
    return unstable_cache(
        async () => {
            try {
                const tagQuery = await adminDb.collection("tags")
                    .where("slug", "==", "featured").limit(1).get();
                
                if (tagQuery.empty) return [];
                const featuredTagId = tagQuery.docs[0].id;

                const query = await adminDb.collection("products")
                    .where("status", "==", "ACTIVE")
                    .where("tagIds", "array-contains", featuredTagId)
                    .limit(limit)
                    .get();

                return query.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => mapProduct(doc.id, doc.data()));
            } catch (err) {
                console.error("Products fetch error (getFeaturedProducts):", err);
                return [];
            }
        },
        ['featured-products', String(limit)],
        { tags: ['products', 'featured'] }
    )();
};

export const getNewArrivals = (limit = 8) => {
    return unstable_cache(
        async () => {
            try {
                const query = await adminDb.collection("products")
                    .where("status", "==", "ACTIVE")
                    .orderBy("createdAt", "desc")
                    .limit(limit)
                    .get();
                return query.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => mapProduct(doc.id, doc.data()));
            } catch (err) {
                console.error("Products fetch error (getNewArrivals):", err);
                return [];
            }
        },
        ['new-arrivals', String(limit)],
        { tags: ['products', 'new-arrivals'] }
    )();
};

export const getBestSellers = (limit = 8) => {
    return unstable_cache(
        async () => {
            try {
                const query = await adminDb.collection("products")
                    .where("status", "==", "ACTIVE")
                    .orderBy("sales.unitsSold", "desc")
                    .limit(limit)
                    .get();
                
                const products = query.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => {
                    const product = mapProduct(doc.id, doc.data());
                    return {
                        ...product,
                        unitsSold: (doc.data() as any).sales?.unitsSold || 0
                    };
                });

                return products
                    .sort((a: any, b: any) => b.unitsSold - a.unitsSold)
                    .slice(0, limit)
                    .map(({ unitsSold, ...rest }: any) => rest as Product);
            } catch (err) {
                console.error("Products fetch error (getBestSellers):", err);
                return [];
            }
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
        image: data.imageUrl, // Align with schema
        price: data.basePrice, // Align with schema
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
        updatedAt: new Date(),
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
    return mapProduct(docRef.id, productDoc);
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

    const updateObj: any = { ...productData, updatedAt: new Date() };

    if (data.imageUrl) updateObj.image = data.imageUrl;
    if (data.basePrice) updateObj.price = data.basePrice;

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
    return query.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => mapProduct(doc.id, doc.data()));
};
