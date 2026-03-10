import prisma from "@/lib/db";
import { ArrowLeft, Printer } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export const dynamic = "force-dynamic";

export default async function PackingListPage({ params }: { params: { id: string, locale: string } }) {
    const { id } = params;
    const order = await prisma.order.findUnique({
        where: { id },
        include: {
            customer: true,
            items: { include: { product: true } },
        },
    });

    if (!order) return <div className="p-8">Order not found.</div>;

    return (
        <div className="min-h-screen bg-white p-4 sm:p-12">
            {/* Screen Header (Hidden on Print) */}
            <div className="mb-8 flex items-center justify-between border-b pb-4 print:hidden">
                <Link href={`/admin/orders/${order.id}`} className="flex items-center gap-2 text-sm text-gray-500 hover:text-primary">
                    <ArrowLeft className="w-4 h-4" /> Back to Order
                </Link>
                <button
                    onClick={() => { }} // Placeholder for client interaction if needed, but standard print works
                    className="flex items-center gap-2 px-4 py-2 bg-primary-dark text-white rounded-lg text-sm font-bold active:scale-95 transition-all"
                    onMouseDown={() => window.print()}
                >
                    <Printer className="w-4 h-4" /> Print Document
                </button>
            </div>

            {/* Print Content */}
            <div className="max-w-4xl mx-auto border-2 border-gray-100 p-8 sm:p-16 rounded-3xl shadow-sm print:border-none print:shadow-none print:p-0">
                <div className="flex justify-between items-start mb-12">
                    <div>
                        <h1 className="text-4xl font-serif font-bold text-primary-dark mb-2">Packing List</h1>
                        <p className="text-gray-400 font-mono text-sm uppercase tracking-widest">Order Ref: #{order.id.slice(0, 8).toUpperCase()}</p>
                    </div>
                    <div className="text-right">
                        <div className="font-serif font-bold text-2xl text-primary-dark tracking-tighter">LPS PERFUME</div>
                        <p className="text-xs text-gray-400 uppercase tracking-widest">Wholesale B2B Algeria</p>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-12 mb-12 py-8 border-y border-gray-50">
                    <div>
                        <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#D4AF37] mb-4">Ship To</h2>
                        <div className="space-y-1">
                            <p className="font-bold text-gray-900 text-lg">{order.customer.shopName}</p>
                            <p className="text-gray-600 font-medium">{order.customer.name}</p>
                            <p className="text-gray-500 leading-relaxed max-w-xs">{order.customer.address}</p>
                            <p className="text-sm font-bold text-gray-900 uppercase">{order.customer.wilaya}, ALGERIA</p>
                            <p className="text-gray-400 mt-2 font-mono text-sm">{order.customer.phone}</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#D4AF37] mb-4">Shipment Details</h2>
                        <div className="space-y-2">
                            <div className="flex justify-end gap-4">
                                <span className="text-gray-400 text-sm">Date:</span>
                                <span className="text-gray-900 font-bold text-sm">{new Date().toLocaleDateString('en-GB')}</span>
                            </div>
                            <div className="flex justify-end gap-4">
                                <span className="text-gray-400 text-sm">Order ID:</span>
                                <span className="text-gray-900 font-mono text-sm">#{order.id.slice(0, 8).toUpperCase()}</span>
                            </div>
                            <div className="flex justify-end gap-4">
                                <span className="text-gray-400 text-sm">Status:</span>
                                <span className="text-primary font-bold text-sm uppercase tracking-tighter">{order.status}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <table className="w-full text-left mb-12">
                    <thead className="border-b-2 border-gray-900">
                        <tr>
                            <th className="py-4 font-bold text-gray-900">#</th>
                            <th className="py-4 font-bold text-gray-900">Product Specification</th>
                            <th className="py-4 font-bold text-gray-900 text-center">Qty / Units</th>
                            <th className="py-4 font-bold text-gray-900 text-right">Box Qty</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {order.items.map((item, index) => (
                            <tr key={item.id}>
                                <td className="py-6 text-gray-400 font-mono">{index + 1}</td>
                                <td className="py-6">
                                    <div className="font-bold text-gray-900">{item.product.name}</div>
                                    <div className="text-xs text-gray-400 uppercase tracking-widest">{item.product.brand} • {Number(item.product.basePrice)} DZD</div>
                                </td>
                                <td className="py-6 text-center font-bold text-primary-dark text-lg">
                                    {item.quantity}
                                </td>
                                <td className="py-6 text-right text-gray-500 font-medium">
                                    Standard Packaging
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                <div className="pt-12 border-t border-gray-900 flex justify-between items-center opacity-50">
                    <p className="text-xs font-bold uppercase tracking-widest">LPS Logistics Department • Official Packing Slip</p>
                    <p className="text-xs font-mono">Ver: 7.0 / {order.id}</p>
                </div>
            </div>

            {/* Client Side Print Script for browser button */}
            <script dangerouslySetInnerHTML={{
                __html: `
                function printDoc() { window.print(); }
            `}} />
        </div>
    );
}
