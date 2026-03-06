import { getProductAnalytics, getRevenueMetrics, getTopCustomers } from "@/services/analytics-service";
import { getProfitAnalytics } from "@/services/intelligence-service";
import AnalyticsDashboardClient from "@/components/admin/AnalyticsDashboardClient";

export const dynamic = "force-dynamic";

export default async function AnalyticsPage() {
    const [productAnalytics, revenueMetrics, topCustomers, profitSnapshot] = await Promise.all([
        getProductAnalytics(),
        getRevenueMetrics(),
        getTopCustomers(10),
        getProfitAnalytics()
    ]);

    return (
        <div className="p-8 max-w-7xl mx-auto animate-in fade-in duration-500">
            <div className="mb-8">
                <h1 className="text-3xl font-serif font-bold text-primary-dark tracking-tight">Business Intelligence</h1>
                <p className="text-sm text-gray-500 mt-2 font-medium">Detailed revenue, top customers, and product demand forecasting.</p>
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
