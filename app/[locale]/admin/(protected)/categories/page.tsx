import CategoryClientView from "@/components/admin/CategoryClientView";
import { getTranslations } from "next-intl/server";
import { adminDb } from "@/lib/firebase-admin";

export const dynamic = "force-dynamic";

export default async function AdminCategoriesPage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: "admin.categories" });

    const categoriesSnap = await adminDb.collection("categories").orderBy("name", "asc").get();
    const categories = await Promise.all(categoriesSnap.docs.map(async (doc) => {
        const productsCount = await adminDb.collection("products").where("categoryId", "==", doc.id).count().get();
        return { id: doc.id, ...doc.data() as any, _count: { products: productsCount.data().count } };
    }));

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-serif font-bold text-primary-dark tracking-tight">{t("title")}</h1>
                    <p className="text-gray-500 mt-1 tracking-wide">{t("subtitle")}</p>
                </div>
            </div>

            <CategoryClientView categories={categories} />
        </div>
    );
}
