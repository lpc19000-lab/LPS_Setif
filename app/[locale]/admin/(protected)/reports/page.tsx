import { FileText, Download, TrendingUp, Users, PackageSearch } from "lucide-react";
import { getTranslations } from "next-intl/server";

export default async function ReportsPage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: "admin.reports" });



    return (
        <div className="p-8 max-w-7xl mx-auto animate-in fade-in duration-500">
            <div className="mb-8">
                <h1 className="text-3xl font-serif font-bold text-primary-dark tracking-tight flex items-center gap-3">
                    <FileText className="w-8 h-8 text-[#D4AF37]" />
                    {t("title")}
                </h1>
                <p className="text-sm text-gray-500 mt-2 font-medium">{t("subtitle")}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                {/* Inventory Report Card */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col items-start hover:shadow-md transition-shadow">
                    <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
                        <PackageSearch className="w-6 h-6" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">{t("inventory.title")}</h3>
                    <p className="text-sm text-gray-500 mb-6 flex-1">
                        {t("inventory.subtitle")}
                    </p>
                    <a
                        href={`/api/admin/reports/export?type=inventory`}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-50 hover:bg-primary-dark hover:text-white text-gray-700 text-sm font-bold uppercase tracking-widest rounded-xl transition-colors border border-gray-100 group"
                    >
                        <Download className="w-4 h-4 group-hover:-translate-y-0.5 transition-transform" />
                        {t("export_csv")}
                    </a>
                </div>

                {/* Sales Report Card */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col items-start hover:shadow-md transition-shadow">
                    <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4">
                        <TrendingUp className="w-6 h-6" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">{t("sales.title")}</h3>
                    <p className="text-sm text-gray-500 mb-6 flex-1">
                        {t("sales.subtitle")}
                    </p>
                    <a
                        href={`/api/admin/reports/export?type=sales`}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-50 hover:bg-primary-dark hover:text-white text-gray-700 text-sm font-bold uppercase tracking-widest rounded-xl transition-colors border border-gray-100 group"
                    >
                        <Download className="w-4 h-4 group-hover:-translate-y-0.5 transition-transform" />
                        {t("export_csv")}
                    </a>
                </div>

                {/* Customers Report Card */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col items-start hover:shadow-md transition-shadow">
                    <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-4">
                        <Users className="w-6 h-6" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">{t("customers.title")}</h3>
                    <p className="text-sm text-gray-500 mb-6 flex-1">
                        {t("customers.subtitle")}
                    </p>
                    <a
                        href={`/api/admin/reports/export?type=customers`}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-50 hover:bg-primary-dark hover:text-white text-gray-700 text-sm font-bold uppercase tracking-widest rounded-xl transition-colors border border-gray-100 group"
                    >
                        <Download className="w-4 h-4 group-hover:-translate-y-0.5 transition-transform" />
                        {t("export_csv")}
                    </a>
                </div>

            </div>
        </div>
    );
}
