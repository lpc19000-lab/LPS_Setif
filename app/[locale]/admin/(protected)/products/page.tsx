import { adminDb } from "@/lib/firebase-admin";
import { QueryDocumentSnapshot, DocumentData } from "firebase-admin/firestore";
import ProductClientView from "@/components/admin/ProductClientView";
import RealtimeReloader from "@/components/admin/RealtimeReloader";
import { getTranslations } from "next-intl/server";

export const dynamic = "force-dynamic";

export default async function AdminProductsPage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: "admin.products" });
    const [productsSnap, categoriesSnap, collectionsSnap, tagsSnap] = await Promise.all([
        adminDb.collection("products").orderBy("createdAt", "desc").get(),
        adminDb.collection("categories").orderBy("name", "asc").get(),
        adminDb.collection("collections").orderBy("name", "asc").get(),
        adminDb.collection("tags").orderBy("name", "asc").get(),
    ]);

    const products = productsSnap.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => {
        const d: any = doc.data();
        return {
            id: doc.id,
            ...d,
            category: d.categoryId ? { id: d.categoryId, name: d.categoryName || '' } : null,
            collections: (d.collectionIds || []).map((cid: string) => ({ collection: { id: cid } })),
            tags: (d.tagIds || []).map((tid: string) => ({ tag: { id: tid } })),
            volumes: d.volumes || [],
            images: d.images || [],
        };
    });
    const categories = categoriesSnap.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => ({ id: doc.id, ...doc.data() as any }));
    const collections = collectionsSnap.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => ({ id: doc.id, ...doc.data() as any }));
    const tags = tagsSnap.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => ({ id: doc.id, ...doc.data() as any }));

    const serializedProducts = products.map((p: any) => ({
        ...p,
        basePrice: Number(p.basePrice),
        stockWeight: Number(p.stockWeight || 0),
    }));

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-serif font-bold text-primary-dark tracking-tight">{t("title")}</h1>
                    <p className="text-gray-500 mt-1 tracking-wide">{t("subtitle")}</p>
                </div>
            </div>

            <ProductClientView
                products={serializedProducts}
                categories={categories}
                collections={collections}
                tags={tags}
            />
            <RealtimeReloader />
        </div>
    );
}
