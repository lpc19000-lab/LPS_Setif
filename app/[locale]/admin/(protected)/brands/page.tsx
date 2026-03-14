import BrandClientView from "@/components/admin/BrandClientView";
import { getTranslations } from "next-intl/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

export default async function AdminBrandsPage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: "admin.brands" });

    // Fetch brands and join with products to get counts
    // We match by brand name in the products table
    const { data: brandsData, error } = await supabaseAdmin
        .from("brands")
        .select("*")
        .order("name", { ascending: true });

    if (error) {
        console.error("Brands fetch error:", error);
    }

    // Get product counts per brand
    const { data: productCounts } = await supabaseAdmin
        .from("products")
        .select("brand")
        .not("brand", "is", null);

    const counts: Record<string, number> = {};
    productCounts?.forEach(p => {
        if (p.brand) {
            counts[p.brand] = (counts[p.brand] || 0) + 1;
        }
    });

    const brands = (brandsData || []).map((brand: any) => ({
        ...brand,
        _count: { products: counts[brand.name] || 0 }
    }));

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-serif font-bold text-primary-dark tracking-tight">{t("title")}</h1>
                    <p className="text-gray-500 mt-1 tracking-wide">{t("subtitle")}</p>
                </div>
            </div>

            <BrandClientView brands={brands} />
        </div>
    );
}
