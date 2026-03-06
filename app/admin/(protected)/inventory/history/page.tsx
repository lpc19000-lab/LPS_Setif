import prisma from "@/lib/db";
import { History, Package, ArrowLeft, Filter, Search } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export const dynamic = "force-dynamic";

export default async function InventoryHistoryPage({
    searchParams
}: {
    searchParams: Promise<{ productId?: string; changeType?: string; source?: string }>
}) {
    const params = await searchParams;

    const filters: any = {};
    if (params.productId) filters.productId = params.productId;
    if (params.changeType) filters.changeType = params.changeType;
    if (params.source) filters.source = params.source;

    const logs = await prisma.inventoryLog.findMany({
        where: filters,
        include: { product: true },
        orderBy: { createdAt: 'desc' },
        take: 100 // Limit for performance, in a real app add pagination
    });

    const products = await prisma.product.findMany({
        select: { id: true, name: true }
    });

    const formatDate = (date: Date) => {
        return new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeStyle: 'short' }).format(date);
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
                        href="/admin/inventory"
                        className="w-10 h-10 rounded-xl bg-white border border-gray-100 flex items-center justify-center hover:bg-gray-50 transition-colors shadow-sm"
                    >
                        <ArrowLeft className="w-5 h-5 text-gray-400" />
                    </Link>
                    <div>
                        <h1 className="text-3xl font-serif font-bold text-primary-dark tracking-tight flex items-center gap-3">
                            <History className="w-8 h-8 text-[#D4AF37]" />
                            Inventory History
                        </h1>
                        <p className="text-sm text-gray-500 mt-2 font-medium">Tracking all stock movements across sales, cancellations, and manual adjustments.</p>
                    </div>
                </div>
            </div>

            {/* Simple Server-Side Filter Form */}
            <form className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm mb-8 flex flex-col md:flex-row gap-4 items-end">
                <div className="flex-1 w-full space-y-1.5">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Product</label>
                    <select
                        name="productId"
                        defaultValue={params.productId || ""}
                        className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-primary/20 appearance-none font-medium text-gray-700"
                    >
                        <option value="">All Products</option>
                        {products.map(p => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                    </select>
                </div>
                <div className="flex-1 w-full space-y-1.5">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Change Type</label>
                    <select
                        name="changeType"
                        defaultValue={params.changeType || ""}
                        className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-primary/20 appearance-none font-medium text-gray-700"
                    >
                        <option value="">All Types</option>
                        <option value="SALE">Sale</option>
                        <option value="CANCEL">Cancel</option>
                        <option value="RESTOCK">Restock</option>
                        <option value="MANUAL_ADJUSTMENT">Manual Adjustment</option>
                    </select>
                </div>
                <div className="flex-1 w-full space-y-1.5">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Source</label>
                    <select
                        name="source"
                        defaultValue={params.source || ""}
                        className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-primary/20 appearance-none font-medium text-gray-700"
                    >
                        <option value="">All Sources</option>
                        <option value="ORDER">Order</option>
                        <option value="ADMIN">Admin</option>
                        <option value="SYSTEM">System</option>
                    </select>
                </div>
                <div className="flex gap-2 w-full md:w-auto mt-4 md:mt-0">
                    <button type="submit" className="flex-1 px-8 py-3 bg-primary text-white font-bold rounded-xl shadow-md shadow-primary/20 hover:bg-primary-dark transition-all">
                        Filter
                    </button>
                    {(params.productId || params.changeType || params.source) && (
                        <Link href="/admin/inventory/history" className="px-6 py-3 bg-gray-100 text-gray-600 font-bold rounded-xl hover:bg-gray-200 transition-all text-center">
                            Reset
                        </Link>
                    )}
                </div>
            </form>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50/50 text-xs text-gray-400 uppercase tracking-widest">
                            <tr>
                                <th className="px-6 py-4 font-bold">Date & Time</th>
                                <th className="px-6 py-4 font-bold">Product</th>
                                <th className="px-6 py-4 font-bold">Type</th>
                                <th className="px-6 py-4 font-bold text-center">Change</th>
                                <th className="px-6 py-4 font-bold">Source & Reason</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {logs.map((log) => (
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
                                            {log.changeType.replace('_', ' ')}
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
                                        No inventory history found matching the filters.
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
