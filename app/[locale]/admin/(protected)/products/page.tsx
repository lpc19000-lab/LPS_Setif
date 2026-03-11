import prisma from "@/lib/db";
import ProductClientView from "@/components/admin/ProductClientView";
import RealtimeReloader from "@/components/admin/RealtimeReloader";
import { getTranslations } from "next-intl/server";

export const dynamic = "force-dynamic";

export default async function AdminProductsPage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: "admin.products" });
    const [products, categories, collections, tags] = await Promise.all([
        prisma.product.findMany({
            include: {
                category: true,
                collections: { include: { collection: true } },
                tags: { include: { tag: true } },
            },
            orderBy: { createdAt: "desc" },
        }),
        prisma.category.findMany({ orderBy: { name: "asc" } }),
        prisma.collection.findMany({ orderBy: { name: "asc" } }),
        prisma.tag.findMany({ orderBy: { name: "asc" } }),
    ]);

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
