import { Search, Store, ShieldBan, ShieldAlert } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { adminDb } from "@/lib/firebase-admin";

export const dynamic = "force-dynamic";

export default async function AdminCustomersPage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: "admin.customers" });

    const customersQuery = await adminDb.collection("customers").orderBy("createdAt", "desc").get();
    const ordersQuery = await adminDb.collection("orders").get();
    const orderCountMap = new Map<string, number>();
    ordersQuery.docs.forEach(doc => {
        const cid = doc.data().customerId;
        if (cid) orderCountMap.set(cid, (orderCountMap.get(cid) || 0) + 1);
    });
    const customers = customersQuery.docs.map(doc => {
        const d = doc.data();
        return {
            id: doc.id,
            ...d,
            createdAt: d.createdAt?.toDate ? d.createdAt.toDate() : new Date(d.createdAt),
            _count: { orders: orderCountMap.get(doc.id) || 0 }
        };
    });

    const formatDate = (date: Date) => {
        return new Intl.DateTimeFormat(locale === "ar" ? "ar-DZ" : "fr-FR", { dateStyle: "medium" }).format(date);
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-serif font-bold text-primary-dark tracking-tight">{t("title")}</h1>
                    <p className="text-gray-500 mt-1 tracking-wide">{t("subtitle")}</p>
                </div>
                <div className="relative w-full sm:w-72">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 rtl:left-auto rtl:right-3" />
                    <input
                        type="text"
                        placeholder={t("search_placeholder")}
                        className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/30 rtl:pl-4 rtl:pr-10"
                    />
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-primary/10 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-gray-500 uppercase tracking-wider bg-gray-50/50 border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-4 font-medium">{t("table.business_shop")}</th>
                                <th className="px-6 py-4 font-medium">{t("table.owner_contact")}</th>
                                <th className="px-6 py-4 font-medium">{t("table.location")}</th>
                                <th className="px-6 py-4 font-medium">{t("table.joined")}</th>
                                <th className="px-6 py-4 font-medium">{t("table.total_orders")}</th>
                                <th className="px-6 py-4 font-medium text-right rtl:text-left">{t("table.access")}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {customers.map((customer) => (
                                <tr key={customer.id} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-xl bg-[#D4AF37]/10 flex items-center justify-center text-[#D4AF37] shrink-0">
                                                <Store className="w-4 h-4" />
                                            </div>
                                            <span className="font-semibold text-gray-900">{customer.shopName}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-gray-900 font-medium">{customer.name}</div>
                                        <div className="text-gray-500 text-xs mt-0.5">{customer.phone}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-gray-900 font-medium">{customer.wilaya}</div>
                                        <div className="text-gray-500 text-xs mt-0.5 max-w-[200px] truncate" title={customer.address}>{customer.address}</div>
                                    </td>
                                    <td className="px-6 py-4 text-gray-500 whitespace-nowrap">
                                        {formatDate(customer.createdAt)}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${customer._count.orders > 0 ? 'bg-primary/10 text-primary-dark' : 'bg-gray-100 text-gray-500'}`}>
                                            {t("orders_count", { count: customer._count.orders })}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right rtl:text-left">
                                        <button
                                            className="px-3 py-1.5 text-xs font-medium text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors inline-flex items-center gap-1.5 rtl:flex-row-reverse"
                                            title={t("suspend_title")}
                                        >
                                            <ShieldAlert className="w-3.5 h-3.5" /> {t("suspend")}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {customers.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="px-6 py-10 text-center text-gray-500">
                                        {t("no_customers")}
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
