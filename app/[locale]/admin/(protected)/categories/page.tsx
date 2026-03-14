import CategoryClientView from "@/components/admin/CategoryClientView";
import { getTranslations } from "next-intl/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

export default async function AdminCategoriesPage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: "admin.categories" });

    // Fetch categories and join with products to get counts
    // Note: To get counts efficiently in Supabase, we can use a nested select or a separate query
    const { data: categoriesData, error } = await supabaseAdmin
        .from("categories")
        .select(`
            *,
            products (id)
        `)
        .order("name", { ascending: true });

    if (error) {
        console.error("Categories fetch error:", error);
    }

    const categories = (categoriesData || []).map((cat: any) => ({
        ...cat,
        _count: { products: cat.products?.length || 0 }
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
