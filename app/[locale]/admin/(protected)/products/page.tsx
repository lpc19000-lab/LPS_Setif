import { supabaseAdmin } from "@/lib/supabase-admin";
import ProductClientView from "@/components/admin/ProductClientView";
import RealtimeReloader from "@/components/admin/RealtimeReloader";
import { getTranslations } from "next-intl/server";

export const dynamic = "force-dynamic";

export default async function AdminProductsPage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: "admin.products" });

    // Fetch data from Supabase
    const [
        { data: productsData },
        { data: categories },
        { data: brands },
        { data: collections },
        { data: tags }
    ] = await Promise.all([
        supabaseAdmin.from("products").select("*, category:categories(name), brand_rel:brands(name)").order("created_at", { ascending: false }),
        supabaseAdmin.from("categories").select("*").order("name", { ascending: true }),
        supabaseAdmin.from("brands").select("*").order("name", { ascending: true }),
        supabaseAdmin.from("collections").select("*").order("name", { ascending: true }),
        supabaseAdmin.from("tags").select("*").order("name", { ascending: true })
    ]);

    const serializedProducts = (productsData || []).map((p: any) => ({
        id: p.id,
        name: p.name || "",
        brand: p.brand || "",
        brandId: p.brand_id,
        slug: p.slug,
        description: p.description,
        categoryId: p.category_id,
        imageUrl: p.image_url || p.image, // Fallback to p.image if p.image_url is missing
        basePrice: Number(p.base_price),
        stockWeight: Number(p.stock_weight || 0),
        lowStockThreshold: p.low_stock_threshold,
        status: p.status,
        createdAt: new Date(p.created_at),
        updatedAt: new Date(p.updated_at),
        category: p.category || (p.category_id ? { id: p.category_id, name: "..." } : null),
        brandName: p.brand_rel?.name || p.brand,
        collections: (p.collection_ids || []).map((cid: string) => ({ collection: { id: cid } })),
        tags: (p.tag_ids || []).map((tid: string) => ({ tag: { id: tid } })),
        volumes: p.volumes || [],
        images: p.images || [],
    }));

    console.log(`[AdminProductsPage] Map check: ${serializedProducts[0]?.name} -> ${serializedProducts[0]?.imageUrl}`);

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
                categories={categories || []}
                brands={brands || []}
                collections={collections || []}
                tags={tags || []}
            />
            <RealtimeReloader />
        </div>
    );
}
