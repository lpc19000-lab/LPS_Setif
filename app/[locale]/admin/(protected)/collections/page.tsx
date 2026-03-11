import CollectionClientView from "@/components/admin/CollectionClientView";
import { getTranslations } from "next-intl/server";
import { adminDb } from "@/lib/firebase-admin";

export const dynamic = "force-dynamic";

export default async function AdminCollectionsPage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: "admin.collections" });

    const collectionsSnap = await adminDb.collection("collections").orderBy("name", "asc").get();
    const collections = await Promise.all(collectionsSnap.docs.map(async (doc) => {
        const productsCount = await adminDb.collection("products").where("collectionIds", "array-contains", doc.id).count().get();
        return { id: doc.id, ...doc.data() as any, products: Array(productsCount.data().count).fill({ id: '' }) };
    }));

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div>
                <h1 className="text-3xl font-serif font-bold text-primary-dark tracking-tight">{t("title")}</h1>
                <p className="text-gray-500 mt-1 tracking-wide">{t("subtitle")}</p>
            </div>
            <CollectionClientView collections={collections} />
        </div>
    );
}
