import prisma from "@/lib/db";
import ProductClientView from "@/components/admin/ProductClientView";

export const dynamic = "force-dynamic";

export default async function AdminProductsPage() {
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
                    <h1 className="text-3xl font-serif font-bold text-primary-dark tracking-tight">Products</h1>
                    <p className="text-gray-500 mt-1 tracking-wide">Manage your perfume catalog, pricing, and B2B constraints.</p>
                </div>
            </div>

            <ProductClientView
                products={serializedProducts}
                categories={categories}
                collections={collections}
                tags={tags}
            />
        </div>
    );
}
