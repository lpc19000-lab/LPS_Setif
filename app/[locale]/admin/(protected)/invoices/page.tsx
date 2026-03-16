import { Search, FileText, ExternalLink } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AdminInvoicesPage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: "admin.invoices" });

    // Invoices are embedded in orders in the Supabase schema as well
    const { data: ordersWithInvoices, error } = await supabaseAdmin
        .from("orders")
        .select(`
            id,
            total_price,
            invoice,
            created_at,
            customers (shop_name, name)
        `)
        .not("invoice", "is", null)
        .order("created_at", { ascending: false });

    if (error) {
        console.error("Invoices fetch error:", error);
    }

    const invoices = (ordersWithInvoices || []).map((order: any) => ({
        id: order.id,
        invoiceNumber: order.invoice?.invoiceNumber || "N/A",
        issueDate: new Date(order.invoice?.issueDate || order.created_at),
        totalAmount: order.invoice?.totalAmount || order.total_price,
        orderId: order.id,
        order: { 
            customer: { 
                shopName: order.customers?.shop_name || "Unknown",
                name: order.customers?.name || ""
            } 
        },
    }));

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat(locale === "ar" ? "ar-DZ" : "fr-FR", { 
            style: "currency", 
            currency: "DZD" 
        }).format(amount);
    };

    const formatDate = (date: Date) => {
        return new Intl.DateTimeFormat(locale === "ar" ? "ar-DZ" : "fr-FR", { dateStyle: "long" }).format(date);
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-serif font-bold text-primary-dark tracking-tight">{t("title")}</h1>
                    <p className="text-gray-500 mt-1 tracking-wide">{t("subtitle")}</p>
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-primary/10 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-gray-500">
                        <thead className="text-xs text-gray-500 uppercase tracking-wider bg-gray-50/50">
                            <tr>
                                <th className="px-6 py-4 font-medium">{t("table.number")}</th>
                                <th className="px-6 py-4 font-medium">{t("table.customer")}</th>
                                <th className="px-6 py-4 font-medium">{t("table.date")}</th>
                                <th className="px-6 py-4 font-medium">{t("table.amount")}</th>
                                <th className="px-6 py-4 font-medium text-right rtl:text-left">{t("table.document")}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {invoices.map((invoice) => (
                                <tr key={invoice.id} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                                                <FileText className="w-4 h-4" />
                                            </div>
                                            <span className="font-mono font-medium text-gray-900 border-b border-gray-900/10 border-dashed pb-0.5">{invoice.invoiceNumber}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-gray-900 font-medium">{invoice.order.customer.shopName}</div>
                                        <div className="text-xs">{t("table.customer")} #{invoice.orderId.slice(0, 8).toUpperCase()}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {formatDate(invoice.issueDate)}
                                    </td>
                                    <td className="px-6 py-4 font-semibold text-primary-dark">
                                        {formatCurrency(Number(invoice.totalAmount))}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <Link
                                            href={`/${locale}/admin/orders/${invoice.orderId}/invoice/print`}
                                            target="_blank"
                                            className="px-3 py-1.5 text-xs font-medium text-blue-600 hover:text-white hover:bg-blue-600 border border-blue-600/20 hover:border-transparent rounded-lg transition-colors inline-flex items-center gap-1.5"
                                        >
                                            <ExternalLink className="w-3.5 h-3.5" /> {t("view_output")}
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                            {invoices.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-6 py-10 text-center text-gray-500">
                                        {t("no_invoices")}
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
