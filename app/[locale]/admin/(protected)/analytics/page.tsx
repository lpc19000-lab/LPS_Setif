import { getProductAnalytics, getRevenueMetrics, getTopCustomers } from "@/services/analytics-service";
import { getProfitAnalytics } from "@/services/intelligence-service";
import AnalyticsDashboardClient from "@/components/admin/AnalyticsDashboardClient";
import { getTranslations } from "next-intl/server";

export const dynamic = "force-dynamic";

export default async function AnalyticsPage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: "admin.analytics" });

    const [productAnalytics, revenueMetrics, topCustomers, profitSnapshot] = await Promise.all([
        getProductAnalytics(),
        getRevenueMetrics(),
        getTopCustomers(10),
        getProfitAnalytics()
    ]);

    return (
        <div className="p-8 max-w-7xl mx-auto animate-in fade-in duration-500">
            <div className="mb-8">
                <h1 className="text-3xl font-serif font-bold text-primary-dark tracking-tight">{t("title")}</h1>
                <p className="text-sm text-gray-500 mt-2 font-medium">{t("subtitle")}</p>
            </div>

            <AnalyticsDashboardClient
                productAnalytics={productAnalytics}
                revenueMetrics={revenueMetrics}
                topCustomers={topCustomers}
                profitSnapshot={profitSnapshot}
            />
        </div>
    );
}
