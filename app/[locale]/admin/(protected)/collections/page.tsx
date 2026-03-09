import prisma from "@/lib/db";
import CollectionClientView from "@/components/admin/CollectionClientView";

export const dynamic = "force-dynamic";

export default async function AdminCollectionsPage() {
    const collections = await prisma.collection.findMany({
        include: { products: { select: { id: true } } },
        orderBy: { name: "asc" },
    });

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div>
                <h1 className="text-3xl font-serif font-bold text-primary-dark tracking-tight">Collections</h1>
                <p className="text-gray-500 mt-1 tracking-wide">Organize products into curated collections for the storefront.</p>
            </div>
            <CollectionClientView collections={collections} />
        </div>
    );
}
