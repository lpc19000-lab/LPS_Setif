import prisma from "@/lib/db";
import CategoryClientView from "@/components/admin/CategoryClientView";

export const dynamic = "force-dynamic";

export default async function AdminCategoriesPage() {
    const categories = await prisma.category.findMany({
        include: {
            _count: {
                select: { products: true }
            }
        },
        orderBy: { name: "asc" },
    });

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-serif font-bold text-primary-dark tracking-tight">Categories</h1>
                    <p className="text-gray-500 mt-1 tracking-wide">Manage fragrance collections and lines.</p>
                </div>
            </div>

            <CategoryClientView categories={categories} />
        </div>
    );
}
