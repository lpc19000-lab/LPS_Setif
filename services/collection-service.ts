import { adminDb } from "@/lib/firebase-admin";
import { unstable_cache, revalidateTag } from "next/cache";

function generateSlug(name: string): string {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

// ── READ (cached) ─────────────────────────────────────────────────────────
export const getCollections = () => {
    return unstable_cache(
        async () => {
            const query = await adminDb.collection("collections").orderBy("name", "asc").get();
            return Promise.all(query.docs.map(async (doc) => {
                const c = doc.data();
                // Products associated with this collection
                const productsQuery = await adminDb.collection("products")
                    .where("collectionIds", "array-contains", doc.id)
                    .get();
                const products = productsQuery.docs.map(p => ({ id: p.id }));
                return { id: doc.id, ...c, products };
            }));
        },
        ['collections-list'],
        { revalidate: 300, tags: ['collections'] }
    )();
};

export const getCollectionBySlug = async (slug: string) => {
    const collQuery = await adminDb.collection("collections").where("slug", "==", slug).limit(1).get();
    if (collQuery.empty) return null;
    
    const collectionDoc = collQuery.docs[0];
    const collection = { id: collectionDoc.id, ...collectionDoc.data() };

    const productsQuery = await adminDb.collection("products")
        .where("collectionIds", "array-contains", collectionDoc.id)
        .where("status", "==", "ACTIVE")
        .get();

    const products = productsQuery.docs.map(doc => {
        const pData = doc.data();
        let images = [];
        if (pData.images && Array.isArray(pData.images)) {
            images = pData.images.sort((a: any, b: any) => (a.position || 0) - (b.position || 0)).slice(0, 1);
        }
        
        let categoryInfo = null;
        if (pData.categoryId) {
            // we'll just return categoryId, the full category usually needs another fetch 
            // but for a listing page we might just need basic info.
            categoryInfo = { id: pData.categoryId };
        }

        // We wrap it to match the Prisma join table shape: `product.product.name`
        return {
            product: {
                id: doc.id,
                ...pData,
                images,
                category: categoryInfo
            }
        };
    });

    return { ...collection, products };
};

// ── CREATE ────────────────────────────────────────────────────────────────
export const createCollection = async (data: { name: string }) => {
    const slug = generateSlug(data.name);
    const docRef = await adminDb.collection("collections").add({ name: data.name, slug, createdAt: new Date() });
    const result = { id: docRef.id, name: data.name, slug };
    revalidateTag('collections');
    return result;
};

// ── UPDATE ────────────────────────────────────────────────────────────────
export const updateCollection = async (id: string, data: { name: string }) => {
    const slug = generateSlug(data.name);
    await adminDb.collection("collections").doc(id).update({ name: data.name, slug });
    revalidateTag('collections');
    return { id, name: data.name, slug };
};

// ── DELETE ────────────────────────────────────────────────────────────────
export const deleteCollection = async (id: string) => {
    await adminDb.collection("collections").doc(id).delete();
    revalidateTag('collections');
    return { id };
};
