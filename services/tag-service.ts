import { adminDb } from "@/lib/firebase-admin";
import { QueryDocumentSnapshot, DocumentData } from "firebase-admin/firestore";

function generateSlug(name: string): string {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

// ── READ ──────────────────────────────────────────────────────────────────
export const getTags = async () => {
    const query = await adminDb.collection("tags").orderBy("name", "asc").get();
    return Promise.all(query.docs.map(async (doc) => {
        const data = doc.data();
        // Find products that reference this tag
        const productsQuery = await adminDb.collection("products")
            .where("tagIds", "array-contains", doc.id)
            .get();
        const products = productsQuery.docs.map((p: QueryDocumentSnapshot<DocumentData>) => ({ id: p.id }));
        return { id: doc.id, ...data, products };
    }));
};

// ── CREATE ────────────────────────────────────────────────────────────────
export const createTag = async (data: { name: string }) => {
    const slug = generateSlug(data.name);
    const docRef = await adminDb.collection("tags").add({ name: data.name, slug, createdAt: new Date() });
    return { id: docRef.id, name: data.name, slug };
};

// ── UPDATE ────────────────────────────────────────────────────────────────
export const updateTag = async (id: string, data: { name: string }) => {
    const slug = generateSlug(data.name);
    await adminDb.collection("tags").doc(id).update({ name: data.name, slug });
    return { id, name: data.name, slug };
};

// ── DELETE ────────────────────────────────────────────────────────────────
export const deleteTag = async (id: string) => {
    await adminDb.collection("tags").doc(id).delete();
    return { id };
};
