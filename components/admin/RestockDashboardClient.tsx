"use client";

import { AlertTriangle, TrendingDown, PackageOpen, AlertCircle, Ghost } from "lucide-react";
import Image from "next/image";

type Suggestion = {
    id: string;
    name: string;
    brand: string;
    imageUrl: string;
    currentStock: number;
    unitsSold30d: number;
    avgDailySales: number;
    estimatedDaysLeft: number;
    recommendation: string;
    status: string;
};

type DeadStock = {
    id: string;
    name: string;
    brand: string;
    imageUrl: string;
    stockQuantity: number;
    wholesalePrice: any;
    costPrice: any;
    valueTieUp: number;
    daysSinceAdded: number;
};

export default function RestockDashboardClient({ suggestions, deadStock }: { suggestions: Suggestion[], deadStock: DeadStock[] }) {

    const formatCurrency = (amt: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "DZD", maximumFractionDigits: 0 }).format(amt);

    const getStatusStyle = (status: string) => {
        switch (status) {
            case "CRITICAL": return "text-red-600 bg-red-50 border border-red-100";
            case "WARNING": return "text-amber-600 bg-amber-50 border border-amber-100";
            case "NORMAL": return "text-emerald-600 bg-emerald-50 border border-emerald-100";
            case "INFO": return "text-blue-600 bg-blue-50 border border-blue-100";
            default: return "text-gray-600 bg-gray-50";
        }
    };

    return (
        <div className="space-y-12 pb-20">

            {/* Smart Restock Section */}
            <section>
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
                        <PackageOpen className="w-5 h-5" />
                    </div>
                    <h2 className="text-xl font-bold text-primary-dark">Restock Suggestions</h2>
                </div>

                <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto custom-scrollbar max-h-[600px]">
                        <table className="w-full text-sm text-left relative">
                            <thead className="bg-gray-50/50 text-xs text-gray-400 uppercase tracking-widest sticky top-0 z-10 backdrop-blur-md">
                                <tr>
                                    <th className="px-6 py-4 font-bold">Product</th>
                                    <th className="px-6 py-4 font-bold text-center">In Stock</th>
                                    <th className="px-6 py-4 font-bold text-center">30d Velocity</th>
                                    <th className="px-6 py-4 font-bold text-center">Runway</th>
                                    <th className="px-6 py-4 font-bold">Recommendation</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {suggestions.map((p) => (
                                    <tr key={p.id} className="hover:bg-gray-50/30 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-lg bg-gray-50 overflow-hidden relative shrink-0 border border-gray-100">
                                                    <Image src={p.imageUrl || 'https://images.unsplash.com/photo-1594035910387-fea47794261f?w=100'} alt={p.name} fill className="object-cover" />
                                                </div>
                                                <div>
                                                    <div className="font-bold text-gray-900">{p.name}</div>
                                                    <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">{p.brand}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className="font-bold text-gray-900 text-lg">{p.currentStock}</span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="flex flex-col items-center">
                                                <span className="font-bold text-gray-900 text-lg">{p.unitsSold30d}</span>
                                                <span className="text-[10px] text-gray-400 font-medium">({p.avgDailySales}/day)</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`font-serif text-xl font-bold ${p.estimatedDaysLeft < 7 ? "text-red-500" :
                                                    p.estimatedDaysLeft < 14 ? "text-amber-500" :
                                                        p.estimatedDaysLeft > 60 ? "text-blue-500" :
                                                            "text-emerald-500"
                                                }`}>
                                                {p.estimatedDaysLeft === 999 ? "∞" : p.estimatedDaysLeft}
                                                <span className="text-xs font-sans text-gray-400 font-bold uppercase tracking-widest ml-1">Days</span>
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest whitespace-nowrap ${getStatusStyle(p.status)}`}>
                                                {p.recommendation}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </section>

            {/* Dead Stock Section */}
            <section>
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600">
                        <Ghost className="w-5 h-5" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-primary-dark">Dead Stock Analysis</h2>
                        <p className="text-xs text-gray-500 mt-0.5">Products with 0 sales in the last 60 days.</p>
                    </div>
                </div>

                {deadStock.length === 0 ? (
                    <div className="bg-white p-8 rounded-3xl border border-emerald-100 flex flex-col items-center justify-center text-center shadow-sm">
                        <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mb-4">
                            <TrendingDown className="w-8 h-8" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900">No Dead Stock Detected</h3>
                        <p className="text-sm text-gray-500 mt-2 max-w-sm">All products in your warehouse have seen movement in the last 60 days. Your inventory is highly liquid.</p>
                    </div>
                ) : (
                    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="overflow-x-auto custom-scrollbar max-h-[500px]">
                            <table className="w-full text-sm text-left relative">
                                <thead className="bg-gray-50/50 text-xs text-gray-400 uppercase tracking-widest sticky top-0 z-10 backdrop-blur-md">
                                    <tr>
                                        <th className="px-6 py-4 font-bold">Product</th>
                                        <th className="px-6 py-4 font-bold text-center">Unsold Stock</th>
                                        <th className="px-6 py-4 font-bold text-center">Days Stagnant</th>
                                        <th className="px-6 py-4 font-bold text-right">Value Tied Up</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {deadStock.map((p) => (
                                        <tr key={p.id} className="hover:bg-gray-50/30 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-lg bg-gray-50 overflow-hidden relative shrink-0 border border-gray-100">
                                                        <Image src={p.imageUrl || 'https://images.unsplash.com/photo-1594035910387-fea47794261f?w=100'} alt={p.name} fill className="object-cover" />
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-gray-900">{p.name}</div>
                                                        <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">{p.brand}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className="font-bold text-gray-900 text-lg">{p.stockQuantity}</span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <div className="flex items-center justify-center gap-1.5 text-red-500 font-bold">
                                                    <AlertCircle className="w-4 h-4" /> {p.daysSinceAdded} days
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <span className="font-bold text-purple-700">{formatCurrency(p.valueTieUp)}</span>
                                            </td>
                                        </tr>
                                    ))}
                                    <tr className="bg-gray-50/50">
                                        <td colSpan={3} className="px-6 py-4 text-right font-bold text-gray-500 uppercase tracking-widest text-xs">Total Dead Capital:</td>
                                        <td className="px-6 py-4 text-right font-serif font-bold text-2xl text-purple-700">
                                            {formatCurrency(deadStock.reduce((sum, item) => sum + item.valueTieUp, 0))}
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </section>
        </div>
    );
}
