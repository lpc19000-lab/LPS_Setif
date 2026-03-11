import CollectionClientView from "@/components/admin/CollectionClientView";
import { getTranslations } from "next-intl/server";
import prisma from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AdminCollectionsPage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: "admin.collections" });

    const collections = await prisma.collection.findMany({
        include: { products: { select: { id: true } } },
        orderBy: { name: "asc" },
    });

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
