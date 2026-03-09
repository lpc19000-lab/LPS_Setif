import prisma from "@/lib/db";
import TagClientView from "@/components/admin/TagClientView";

export const dynamic = "force-dynamic";

export default async function AdminTagsPage() {
    const tags = await prisma.tag.findMany({
        include: { products: { select: { id: true } } },
        orderBy: { name: "asc" },
    });

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div>
                <h1 className="text-3xl font-serif font-bold text-primary-dark tracking-tight">Tags</h1>
                <p className="text-gray-500 mt-1 tracking-wide">Label products for dynamic storefront sections like &quot;Best Sellers&quot; or &quot;New Arrivals&quot;.</p>
            </div>
            <TagClientView tags={tags} />
        </div>
    );
}
