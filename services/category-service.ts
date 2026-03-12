import { adminDb } from "@/lib/firebase-admin";
import { unstable_cache, revalidateTag } from "next/cache";

function generateSlug(name: string): string {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

// ── READ (cached) ─────────────────────────────────────────────────────────
export const getCategories = () => {
    return unstable_cache(
        async () => {
            const categoriesQuery = await adminDb.collection("categories").orderBy("name", "asc").get();
            return Promise.all(categoriesQuery.docs.map(async (doc) => {
                const cat = doc.data();
                // Fetch products count/ids for the category
                const productsQuery = await adminDb.collection("products").where("categoryId", "==", doc.id).get();
                const products = productsQuery.docs.map(p => ({ id: p.id }));
                return { id: doc.id, ...cat, products };
            }));
        },
        ['categories-list'],
        { revalidate: 300, tags: ['categories'] }
    )();
};

export const getCategoryById = async (id: string) => {
    const doc = await adminDb.collection("categories").doc(id).get();
    if (!doc.exists) return null;
    
    const productsQuery = await adminDb.collection("products")
        .where("categoryId", "==", id)
        .where("status", "==", "ACTIVE")
        .orderBy("createdAt", "desc")
        .get();

    const products = productsQuery.docs.map(p => {
        const pData = p.data();
        let images = [];
        if (pData.images && Array.isArray(pData.images)) {
            images = pData.images.sort((a: any, b: any) => (a.position || 0) - (b.position || 0)).slice(0, 1);
        }
        return { id: p.id, ...pData, images, category: { id: doc.id, ...doc.data() } };
    });

    return { id: doc.id, ...doc.data(), products };
};

export const getCategoryBySlug = async (slug: string) => {
    const query = await adminDb.collection("categories").where("slug", "==", slug).limit(1).get();
    if (query.empty) return null;
    
    const doc = query.docs[0];
    const category = { id: doc.id, ...doc.data() };
    
    // Fallback if querying doesn't work out due to lacking composite index in FB immediately
    const productsQuery = await adminDb.collection("products")
        .where("categoryId", "==", doc.id)
        .where("status", "==", "ACTIVE")
        .get(); // Sorting happens in JS to avoid immediate index requirement for migration

    const products = productsQuery.docs.map(p => {
        const pData = p.data();
        let images = [];
        if (pData.images && Array.isArray(pData.images)) {
            images = pData.images.sort((a: any, b: any) => (a.position || 0) - (b.position || 0)).slice(0, 1);
        }
        return { 
            id: p.id, 
            ...pData, 
            createdAt: pData.createdAt?.toDate() || new Date(),
            images, 
            category 
        };
    }).sort((a: any, b: any) => b.createdAt.getTime() - a.createdAt.getTime());

    return { ...category, products };
};

// ── CREATE ────────────────────────────────────────────────────────────────
export const createCategory = async (data: {
    name: string;
    description?: string;
}) => {
    const slug = generateSlug(data.name);
    const docRef = await adminDb.collection("categories").add({ ...data, slug, createdAt: new Date() });
    const result = { id: docRef.id, ...data, slug };
    (revalidateTag as any)('categories');
    return result;
};

// ── UPDATE ────────────────────────────────────────────────────────────────
export const updateCategory = async (
    id: string,
    data: Partial<{ name: string; description: string }>
) => {
    const updateData: Record<string, unknown> = { ...data };
    if (data.name) {
        updateData.slug = generateSlug(data.name);
    }
    await adminDb.collection("categories").doc(id).update(updateData);
    (revalidateTag as any)('categories');
    return { id, ...updateData };
};

// ── DELETE ────────────────────────────────────────────────────────────────
export const deleteCategory = async (id: string) => {
    await adminDb.collection("categories").doc(id).delete();
    (revalidateTag as any)('categories');
    return { id };
};
