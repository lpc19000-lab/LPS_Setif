import { PackageSearch, History } from "lucide-react";
import Link from "next/link";
import InventoryManagerClient from "@/components/admin/InventoryManagerClient";
import { getTranslations } from "next-intl/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

export default async function AdminInventoryPage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: "admin.inventory" });

    const { data: productsData, error } = await supabaseAdmin
        .from("products")
        .select("*, categories(name)")
        .order("name", { ascending: true });

    if (error) {
        console.error("Inventory products fetch error:", error);
    }

    const products = (productsData || []).map((p: any) => ({
        id: p.id,
        name: p.name,
        brand: p.brand,
        categoryName: p.categories?.name || "",
        stockWeight: Number(p.stock_weight || 0),
        lowStockThreshold: Number(p.low_stock_threshold || 500),
        status: p.status,
        imageUrl: p.image_url,
        basePrice: Number(p.base_price || 0),
        description: p.description || ""
    }));

    return (
        <div className="p-8 max-w-7xl mx-auto animate-in fade-in duration-500">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-8">
                <div>
                    <h1 className="text-3xl font-serif font-bold text-primary-dark tracking-tight flex items-center gap-3">
                        <PackageSearch className="w-8 h-8 text-[#D4AF37]" />
                        {t("title")}
                    </h1>
                    <p className="text-sm text-gray-500 mt-2 font-medium">{t("subtitle")}</p>
                </div>
                <Link
                    href={`/${locale}/admin/inventory/history`}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-gray-50 hover:bg-gray-100 text-gray-700 text-sm font-bold uppercase tracking-widest rounded-2xl transition-all border border-gray-100 shadow-sm"
                >
                    <History className="w-4 h-4" /> {t("move_history")}
                </Link>
            </div>

            <InventoryManagerClient initialProducts={products} />
        </div>
    );
}
