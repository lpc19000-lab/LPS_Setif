import prisma from "@/lib/db";
import { Search, FileText, Download, ExternalLink } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminInvoicesPage() {
    const invoices = await prisma.invoice.findMany({
        include: {
            order: {
                include: { customer: true }
            }
        },
        orderBy: { issueDate: "desc" },
    });

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("en-US", { style: "currency", currency: "DZD" }).format(amount);
    };

    const formatDate = (date: Date) => {
        return new Intl.DateTimeFormat("en-GB", { dateStyle: "long" }).format(date);
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-serif font-bold text-primary-dark tracking-tight">Invoices</h1>
                    <p className="text-gray-500 mt-1 tracking-wide">Historical logs of generated receipts and commercial invoices.</p>
                </div>
                <div className="relative w-full sm:w-72">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search invoice #..."
                        className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/30"
                    />
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-primary/10 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-gray-500">
                        <thead className="text-xs text-gray-500 uppercase tracking-wider bg-gray-50/50">
                            <tr>
                                <th className="px-6 py-4 font-medium">Invoice Number</th>
                                <th className="px-6 py-4 font-medium">Customer</th>
                                <th className="px-6 py-4 font-medium">Issue Date</th>
                                <th className="px-6 py-4 font-medium">Amount</th>
                                <th className="px-6 py-4 font-medium text-right">Document</th>
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
                                        <div className="text-xs">Order #{invoice.orderId.slice(0, 8).toUpperCase()}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {formatDate(invoice.issueDate)}
                                    </td>
                                    <td className="px-6 py-4 font-semibold text-primary-dark">
                                        {formatCurrency(Number(invoice.totalAmount))}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <a
                                            href={`/invoice/${invoice.id}`}
                                            target="_blank"
                                            className="px-3 py-1.5 text-xs font-medium text-blue-600 hover:text-white hover:bg-blue-600 border border-blue-600/20 hover:border-transparent rounded-lg transition-colors inline-flex items-center gap-1.5"
                                        >
                                            <ExternalLink className="w-3.5 h-3.5" /> View Output
                                        </a>
                                    </td>
                                </tr>
                            ))}
                            {invoices.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-6 py-10 text-center text-gray-500">
                                        No invoices generated yet. Invoices are created automatically when orders are processed.
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
