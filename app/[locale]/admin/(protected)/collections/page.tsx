import CollectionClientView from "@/components/admin/CollectionClientView";
import { getTranslations } from "next-intl/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

export default async function AdminCollectionsPage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: "admin.collections" });

    // Fetch collections and join with products that contain this collection ID
    // Since collection_ids is a TEXT[], we filter after or use a more complex join.
    // For simplicity and correctness with the existing UI expectations:
    const { data: collectionsData, error } = await supabaseAdmin
        .from("collections")
        .select("*")
        .order("name", { ascending: true });

    if (error) {
        console.error("Collections fetch error:", error);
    }

    // Get product counts for each collection
    const collections = await Promise.all((collectionsData || []).map(async (col: any) => {
        const { count, error: countError } = await supabaseAdmin
            .from("products")
            .select("id", { count: 'exact', head: true })
            .contains('collection_ids', [col.id]);
        
        return { 
            ...col, 
            products: Array(count || 0).fill({ id: '' }) // Matching original UI's expected format
        };
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
