import { supabaseAdmin } from "@/lib/supabase-admin";
import { History, ArrowLeft } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { getTranslations } from "next-intl/server";

export const dynamic = "force-dynamic";

export default async function InventoryHistoryPage({
    params,
    searchParams
}: {
    params: Promise<{ locale: string }>,
    searchParams: Promise<{ productId?: string; changeType?: string; source?: string }>
}) {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: "admin.inventory_history" });
    const sParams = await searchParams;

    let query = supabaseAdmin
        .from("inventory_logs")
        .select(`
            *,
            products (name, image_url)
        `)
        .order("created_at", { ascending: false })
        .limit(100);

    if (sParams.productId) query = query.eq("product_id", sParams.productId);
    if (sParams.changeType) query = query.eq("change_type", sParams.changeType);
    if (sParams.source) query = query.eq("source", sParams.source);

    const { data: logsData, error } = await query;
    if (error) {
        console.error("Inventory logs fetch error:", error);
    }

    const logs = (logsData || []).map((log: any) => ({
        id: log.id,
        productId: log.product_id,
        changeType: log.change_type,
        quantity: Number(log.quantity),
        source: log.source,
        reason: log.reason,
        createdAt: new Date(log.created_at),
        product: {
            name: log.products?.name || "Unknown",
            imageUrl: log.products?.image_url || ""
        },
    }));

    const { data: productsData } = await supabaseAdmin.from("products").select("id, name").order("name");
    const products = productsData || [];

    const formatDate = (date: Date) => {
        return new Intl.DateTimeFormat(locale === 'ar' ? 'ar-DZ' : 'fr-FR', { dateStyle: 'medium', timeStyle: 'short' }).format(date);
    };

    const getChangeTypeColor = (type: string) => {
        switch (type) {
            case 'SALE': return 'text-blue-600 bg-blue-50 border border-blue-100';
            case 'CANCEL': return 'text-emerald-600 bg-emerald-50 border border-emerald-100';
            case 'RESTOCK': return 'text-purple-600 bg-purple-50 border border-purple-100';
            case 'MANUAL_ADJUSTMENT': return 'text-amber-600 bg-amber-50 border border-amber-100';
            default: return 'text-gray-600 bg-gray-50 border border-gray-100';
        }
    };

    return (
        <div className="p-8 max-w-7xl mx-auto animate-in fade-in duration-500 pb-20">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-8">
                <div className="flex items-center gap-4">
                    <Link
                        href={`/${locale}/admin/inventory`}
                        className="w-10 h-10 rounded-xl bg-white border border-gray-100 flex items-center justify-center hover:bg-gray-50 transition-colors shadow-sm"
                    >
                        <ArrowLeft className={`w-5 h-5 text-gray-400 ${locale === 'ar' ? 'rotate-180' : ''}`} />
                    </Link>
                    <div>
                        <h1 className="text-3xl font-serif font-bold text-primary-dark tracking-tight flex items-center gap-3">
                            <History className="w-8 h-8 text-[#D4AF37]" />
                            {t("title")}
                        </h1>
                        <p className="text-sm text-gray-500 mt-2 font-medium">{t("subtitle")}</p>
                    </div>
                </div>
            </div>

            <form className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm mb-8 flex flex-col md:flex-row gap-4 items-end">
                <div className="flex-1 w-full space-y-1.5">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">{t("filter_product")}</label>
                    <select
                        name="productId"
                        defaultValue={sParams.productId || ""}
                        className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-primary/20 appearance-none font-medium text-gray-700"
                    >
                        <option value="">{t("filter_all_products")}</option>
                        {products.map((p: any) => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                    </select>
                </div>
                <div className="flex-1 w-full space-y-1.5">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">{t("filter_type")}</label>
                    <select
                        name="changeType"
                        defaultValue={sParams.changeType || ""}
                        className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-primary/20 appearance-none font-medium text-gray-700"
                    >
                        <option value="">{t("filter_all_types")}</option>
                        <option value="SALE">{t("types.SALE")}</option>
                        <option value="CANCEL">{t("types.CANCEL")}</option>
                        <option value="RESTOCK">{t("types.RESTOCK")}</option>
                        <option value="MANUAL_ADJUSTMENT">{t("types.MANUAL_ADJUSTMENT")}</option>
                    </select>
                </div>
                <div className="flex-1 w-full space-y-1.5">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">{t("filter_source")}</label>
                    <select
                        name="source"
                        defaultValue={sParams.source || ""}
                        className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-primary/20 appearance-none font-medium text-gray-700"
                    >
                        <option value="">{t("filter_all_sources")}</option>
                        <option value="ORDER">{t("sources.ORDER")}</option>
                        <option value="ADMIN">{t("sources.ADMIN")}</option>
                        <option value="SYSTEM">{t("sources.SYSTEM")}</option>
                    </select>
                </div>
                <div className="flex gap-2 w-full md:w-auto mt-4 md:mt-0">
                    <button type="submit" className="flex-1 px-8 py-3 bg-primary text-white font-bold rounded-xl shadow-md shadow-primary/20 hover:bg-primary-dark transition-all">
                        {t("filter_button")}
                    </button>
                    {(sParams.productId || sParams.changeType || sParams.source) && (
                        <Link href={`/${locale}/admin/inventory/history`} className="px-6 py-3 bg-gray-100 text-gray-600 font-bold rounded-xl hover:bg-gray-200 transition-all text-center">
                            {t("filter_reset")}
                        </Link>
                    )}
                </div>
            </form>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50/50 text-xs text-gray-400 uppercase tracking-widest">
                            <tr>
                                <th className={`px-6 py-4 font-bold ${locale === 'ar' ? 'text-right' : 'text-left'}`}>{t("table_date")}</th>
                                <th className={`px-6 py-4 font-bold ${locale === 'ar' ? 'text-right' : 'text-left'}`}>{t("table_product")}</th>
                                <th className={`px-6 py-4 font-bold ${locale === 'ar' ? 'text-right' : 'text-left'}`}>{t("table_type")}</th>
                                <th className="px-6 py-4 font-bold text-center">{t("table_change")}</th>
                                <th className={`px-6 py-4 font-bold ${locale === 'ar' ? 'text-right' : 'text-left'}`}>{t("table_source_reason")}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {logs.map((log: any) => (
                                <tr key={log.id} className="hover:bg-gray-50/30 transition-colors">
                                    <td className="px-6 py-4 text-gray-500 font-medium whitespace-nowrap">
                                        {formatDate(log.createdAt)}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-gray-50 overflow-hidden relative shrink-0 border border-gray-100">
                                                <Image src={log.product.imageUrl || 'https://images.unsplash.com/photo-1594035910387-fea47794261f?w=100'} alt={log.product.name} fill className="object-cover" />
                                            </div>
                                            <div className="font-bold text-gray-900 max-w-[200px] truncate">{log.product.name}</div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest ${getChangeTypeColor(log.changeType)}`}>
                                            {t(`types.${log.changeType}`)}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span className={`font-serif text-lg font-bold ${log.quantity > 0 ? "text-emerald-500" :
                                            log.quantity < 0 ? "text-red-500" :
                                                "text-gray-400"
                                            }`}>
                                            {log.quantity > 0 ? `+${log.quantity}` : log.quantity}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="space-y-1 max-w-xs">
                                            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{log.source}</div>
                                            <div className="text-gray-600 text-xs font-medium truncate" title={log.reason || "No reason provided"}>
                                                {log.reason || "—"}
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {logs.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-gray-400 font-medium">
                                        {t("no_history")}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
