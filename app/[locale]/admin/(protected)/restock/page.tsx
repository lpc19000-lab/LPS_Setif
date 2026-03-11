import RestockDashboardClient from "@/components/admin/RestockDashboardClient";
import { getTranslations } from "next-intl/server";
import { getRestockSuggestions, getDeadStock } from "@/services/intelligence-service";

export const dynamic = "force-dynamic";

export default async function RestockPage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: "admin.restock" });

    const [suggestions, deadStock] = await Promise.all([
        getRestockSuggestions(),
        getDeadStock()
    ]);

    return (
        <div className="p-8 max-w-7xl mx-auto animate-in fade-in duration-500">
            <div className="mb-8">
                <h1 className="text-3xl font-serif font-bold text-primary-dark tracking-tight">{t("title")}</h1>
                <p className="text-sm text-gray-500 mt-2 font-medium">{t("subtitle")}</p>
            </div>

            <RestockDashboardClient suggestions={suggestions} deadStock={deadStock} />
        </div>
    );
}
