import { adminDb } from "@/lib/firebase-admin";
import { ArrowLeft, Printer } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function InvoicePrintPage({ params }: { params: Promise<{ id: string, locale: string }> }) {
    const { id } = await params;
    // Invoice is embedded in the order document
    const orderDoc = await adminDb.collection("orders").doc(id).get();
    if (!orderDoc.exists || !orderDoc.data()?.invoice) return <div className="p-8">Invoice not found.</div>;

    const orderData = orderDoc.data()!;
    let customer = { shopName: "Unknown", name: "", address: "", wilaya: "", phone: "" };
    if (orderData.customerId) {
        const custDoc = await adminDb.collection("customers").doc(orderData.customerId).get();
        if (custDoc.exists) customer = custDoc.data() as any;
    }

    const items: any[] = (orderData.items || []).map((item: any) => ({
        id: item.productId,
        quantity: item.quantity,
        price: item.price,
        product: { name: item.productName || "Product", brand: item.productBrand || "" }
    }));

    const invoice = {
        invoiceNumber: orderData.invoice.invoiceNumber,
        issueDate: orderData.invoice.issueDate?.toDate ? orderData.invoice.issueDate.toDate() : new Date(orderData.invoice.issueDate),
        totalAmount: orderData.invoice.totalAmount || orderData.totalPrice,
        orderId: id,
        order: { customer, items },
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("en-US", { style: "currency", currency: "DZD" }).format(amount);
    };

    return (
        <div className="min-h-screen bg-white p-4 sm:p-12">
            {/* Screen Header (Hidden on Print) */}
            <div className="mb-8 flex items-center justify-between border-b pb-4 print:hidden">
                <Link href={`/admin/orders/${invoice.orderId}`} className="flex items-center gap-2 text-sm text-gray-500 hover:text-primary">
                    <ArrowLeft className="w-4 h-4" /> Back to Order
                </Link>
                <div className="flex gap-3">
                    <button
                        onMouseDown={() => window.print()}
                        className="flex items-center gap-2 px-4 py-2 bg-primary-dark text-white rounded-lg text-sm font-bold shadow-sm"
                    >
                        <Printer className="w-4 h-4" /> Print Invoice
                    </button>
                </div>
            </div>

            {/* Print Content */}
            <div className="max-w-4xl mx-auto p-12 sm:p-20 bg-white border border-gray-100 rounded-[3rem] shadow-xl print:border-none print:shadow-none print:p-0 print:rounded-none">
                {/* Invoice Header */}
                <div className="flex justify-between items-start mb-16">
                    <div>
                        <div className="font-serif font-black text-4xl text-primary-dark tracking-tighter mb-2">LPS PERFUME</div>
                        <p className="text-gray-400 font-bold uppercase tracking-[0.3em] text-[10px]">Commercial Division • Algeria</p>
                    </div>
                    <div className="text-right">
                        <h1 className="text-6xl font-serif font-bold text-gray-100 absolute right-12 top-12 opacity-50 z-0 print:hidden">INVOICE</h1>
                        <div className="relative z-10">
                            <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-1">Invoice Number</p>
                            <p className="text-2xl font-serif font-bold text-primary-dark">{invoice.invoiceNumber}</p>
                            <p className="text-xs text-gray-400 font-mono mt-1">Date: {new Date(invoice.issueDate).toLocaleDateString('en-GB')}</p>
                        </div>
                    </div>
                </div>

                {/* Client Info */}
                <div className="grid grid-cols-2 gap-20 mb-16">
                    <div>
                        <h2 className="text-xs font-bold uppercase tracking-widest text-[#D4AF37] mb-6 border-b border-gray-50 pb-2">Bill To</h2>
                        <div className="space-y-1">
                            <p className="text-2xl font-serif font-bold text-primary-dark">{invoice.order.customer.shopName}</p>
                            <p className="font-bold text-gray-700">{invoice.order.customer.name}</p>
                            <p className="text-gray-500 leading-relaxed text-sm max-w-xs">{invoice.order.customer.address}</p>
                            <p className="text-sm font-bold text-gray-900 mt-2 uppercase">{invoice.order.customer.wilaya}, Algeria</p>
                            <p className="text-gray-400 text-sm mt-1">{invoice.order.customer.phone}</p>
                        </div>
                    </div>
                    <div>
                        <h2 className="text-xs font-bold uppercase tracking-widest text-[#D4AF37] mb-6 border-b border-gray-50 pb-2">LPS Store</h2>
                        <div className="space-y-1 text-sm text-gray-500">
                            <p className="font-bold text-gray-900 text-base">LPS Wholesale Perfumes</p>
                            <p>Cite 500 Logements, Setif</p>
                            <p>Algeria, 19000</p>
                            <p className="pt-2">contact@lps-perfume.dz</p>
                            <p>+213 555 12 34 56</p>
                        </div>
                    </div>
                </div>

                {/* Table */}
                <table className="w-full mb-16">
                    <thead>
                        <tr className="border-b-2 border-primary-dark">
                            <th className="py-5 font-bold text-gray-900 text-sm uppercase tracking-widest">Description</th>
                            <th className="py-5 font-bold text-gray-900 text-sm uppercase tracking-widest text-center">Qty</th>
                            <th className="py-5 font-bold text-gray-900 text-sm uppercase tracking-widest text-right">Price</th>
                            <th className="py-5 font-bold text-gray-900 text-sm uppercase tracking-widest text-right">Total</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {invoice.order.items.map((item) => (
                            <tr key={item.id}>
                                <td className="py-8">
                                    <div className="font-bold text-lg text-gray-900">{item.product.name}</div>
                                    <div className="text-xs text-gray-400 uppercase tracking-widest">{item.product.brand}</div>
                                </td>
                                <td className="py-8 text-center text-gray-600 font-medium">{item.quantity}</td>
                                <td className="py-8 text-right text-gray-600 font-medium">{formatCurrency(Number(item.price))}</td>
                                <td className="py-8 text-right font-bold text-primary-dark text-lg">{formatCurrency(Number(item.price) * item.quantity)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {/* Footer Totals */}
                <div className="flex justify-end pt-8 border-t-4 border-gray-50">
                    <div className="w-full sm:w-1/2 space-y-4">
                        <div className="flex justify-between items-center text-gray-400 uppercase tracking-widest text-xs font-bold">
                            <span>Subtotal</span>
                            <span className="text-gray-900">{formatCurrency(Number(invoice.totalAmount))}</span>
                        </div>
                        <div className="flex justify-between items-center text-gray-400 uppercase tracking-widest text-xs font-bold">
                            <span>Shipping</span>
                            <span className="text-gray-900">0.00 DZD</span>
                        </div>
                        <div className="flex justify-between items-center bg-primary-dark p-6 rounded-2xl text-white shadow-lg">
                            <span className="text-sm font-bold uppercase tracking-[0.3em]">Total Amount</span>
                            <span className="text-3xl font-serif font-bold text-[#D4AF37]">{formatCurrency(Number(invoice.totalAmount))}</span>
                        </div>
                    </div>
                </div>

                <div className="mt-20 pt-8 border-t border-gray-50 text-center">
                    <p className="text-xs text-gray-400 uppercase tracking-widest font-bold mb-2">Thank you for your business</p>
                    <p className="text-[10px] text-gray-300">All sales are subject to our wholesale distribution terms. Valid without signature.</p>
                </div>
            </div>
        </div>
    );
}
