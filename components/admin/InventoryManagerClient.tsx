"use client";

import { useRouter, useParams } from "next/navigation";
import { useTranslations } from "next-intl";

import { useState } from "react";
import { Package, AlertTriangle, XCircle, Search, Edit2, ArrowRightLeft, History } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

type ProductWithStock = {
    id: string;
    name: string;
    brand: string;
    imageUrl: string;
    stockWeight: number;
    lowStockThreshold: number;
    basePrice: any;
};

export default function InventoryManagerClient({
    initialProducts
}: {
    initialProducts: ProductWithStock[]
}) {
    const t = useTranslations("admin.inventory");
    const params = useParams();
    const locale = params.locale as string;
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("ALL");
    const [isAdjusting, setIsAdjusting] = useState<string | null>(null);
    const [adjustQuantity, setAdjustQuantity] = useState<number>(0);
    const [adjustReason, setAdjustReason] = useState("");
    const [loading, setLoading] = useState(false);

    const router = useRouter();

    const getStatus = (stock: number, min: number) => {
        if (stock === 0) return "OUT_OF_STOCK";
        if (stock <= min) return "LOW_STOCK";
        return "NORMAL";
    };

    const filteredProducts = initialProducts.filter(p => {
        const pName = p.name || "";
        const pBrand = p.brand || "";
        const pCategory = (p as any).categoryName || "";
        const pDescription = (p as any).description || "";

        const searchLower = searchTerm.toLowerCase().trim();
        if (!searchLower) return statusFilter === "ALL" || status === statusFilter;

        const searchTerms = searchLower.split(/\s+/);
        const searchableText = `${pName} ${pBrand} ${pCategory} ${pDescription}`.toLowerCase();

        const matchesSearch = searchTerms.every(term => searchableText.includes(term));
            
        const matchesStatus = statusFilter === "ALL" || status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const getStatusDisplay = (status: string) => {
        const placeholder = t("modal.reason_placeholder") || "";
        const parts = placeholder.includes("،") ? placeholder.split("،") : placeholder.split(",");
        
        switch (status) {
            case "NORMAL": return <span className="flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest"><Package className="w-3 h-3" /> {t("modal.type.SET")?.split(" ")[0] || "Stock"}</span>;
            case "LOW_STOCK": return <span className="flex items-center gap-1 text-amber-600 bg-amber-50 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest"><AlertTriangle className="w-3 h-3" /> {parts[1]?.trim() || t("modal.reason_placeholder")}</span>;
            case "OUT_OF_STOCK": return <span className="flex items-center gap-1 text-red-600 bg-red-50 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest"><XCircle className="w-3 h-3" /> {parts[0]?.trim() || t("modal.reason_placeholder")}</span>;
            default: return null;
        }
    };

    const handleAdjust = async (productId: string) => {
        if (adjustQuantity === 0 || !adjustReason) {
            alert("Quantity cannot be 0 and reason is required.");
            return;
        }

        setLoading(true);
        try {
            const res = await fetch("/api/admin/inventory/adjust", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ productId, quantity: adjustQuantity, reason: adjustReason }),
            });
            const data = await res.json();
            if (data.success) {
                setIsAdjusting(null);
                setAdjustQuantity(0);
                setAdjustReason("");
                router.refresh();
            } else {
                alert(data.error);
            }
        } catch (e: any) {
            alert(e.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                <div className="relative w-full sm:max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 rtl:left-auto rtl:right-3" />
                    <input
                        type="text"
                        placeholder={t("search_placeholder")}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-gray-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-primary/20 rtl:pl-4 rtl:pr-10"
                    />
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                    {["ALL", "NORMAL", "LOW_STOCK", "OUT_OF_STOCK"].map((status) => (
                        <button
                            key={status}
                            onClick={() => setStatusFilter(status)}
                            className={`px-4 py-2 rounded-xl text-xs font-bold tracking-widest uppercase transition-all flex-1 sm:flex-none ${statusFilter === status
                                ? "bg-primary-dark text-white shadow-md shadow-primary-dark/20"
                                : "bg-gray-50 text-gray-500 hover:bg-gray-100"
                                }`}
                        >
                            {status.replace(/_/g, " ")}
                        </button>
                    ))}
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50/50 text-xs text-gray-400 uppercase tracking-widest">
                            <tr>
                                <th className="px-6 py-4 font-bold">{t("table.product")}</th>
                                <th className="px-6 py-4 font-bold">{t("table.brand")}</th>
                                <th className="px-6 py-4 font-bold text-center">{t("table.stock")}</th>
                                <th className="px-6 py-4 font-bold text-center">{t("modal.current_stock")}</th>
                                <th className="px-6 py-4 font-bold text-right rtl:text-left">{t("table.actions")}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {filteredProducts.map((product) => (
                                <tr key={product.id} className="hover:bg-gray-50/30 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-xl bg-gray-50 overflow-hidden relative shrink-0 border border-gray-100">
                                                <Image src={product.imageUrl || 'https://images.unsplash.com/photo-1594035910387-fea47794261f?w=100'} alt={product.name} fill className="object-cover" />
                                            </div>
                                            <div>
                                                <div className="font-bold text-gray-900">{product.name}</div>
                                                <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">{product.brand}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {getStatusDisplay(getStatus(product.stockWeight, product.lowStockThreshold))}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span className={`font-serif text-xl font-bold ${product.stockWeight === 0 ? "text-red-500" :
                                            product.stockWeight <= product.lowStockThreshold ? "text-amber-500" :
                                                "text-primary-dark"
                                            }`}>
                                            {product.stockWeight}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-center text-gray-400 font-bold">
                                        {product.lowStockThreshold}g
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center justify-end gap-2 rtl:justify-start">
                                            <Link
                                                href={`/${locale}/admin/inventory/history?productId=${product.id}`}
                                                className="p-2 text-gray-400 hover:text-primary bg-gray-50 hover:bg-primary/5 rounded-lg transition-colors tooltip-trigger relative group"
                                            >
                                                <History className="w-4 h-4" />
                                                <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">{t("modal.view_history")}</span>
                                            </Link>
                                            <button
                                                onClick={() => setIsAdjusting(isAdjusting === product.id ? null : product.id)}
                                                className="flex items-center gap-1.5 px-3 py-2 bg-gray-50 hover:bg-primary-dark hover:text-white text-gray-600 text-xs font-bold rounded-lg transition-colors border border-gray-100 uppercase tracking-widest"
                                            >
                                                <ArrowRightLeft className="w-3 h-3" /> {t("modal.adjust_stock").split(" ")[0]}
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Adjustment Modal Overlay style inside the row would be better, but let's do a top-level modal for simplicity */}
            {isAdjusting && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="font-serif font-bold text-xl text-primary-dark tracking-tight">{t("modal.adjust_stock")}</h3>
                            <button onClick={() => setIsAdjusting(null)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors">
                                <XCircle className="w-5 h-5" />
                            </button>
                        </div>

                        {(() => {
                            const p = initialProducts.find(x => x.id === isAdjusting)!;
                            return (
                                <div className="space-y-5">
                                    <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-2xl">
                                        <div className="w-12 h-12 rounded-xl bg-white overflow-hidden relative shrink-0">
                                            <Image src={p.imageUrl || 'https://images.unsplash.com/photo-1594035910387-fea47794261f?w=100'} alt={p.name} fill className="object-cover" />
                                        </div>
                                        <div>
                                            <div className="font-bold text-gray-900 text-sm">{p.name}</div>
                                            <div className="text-xs text-gray-500 font-medium tracking-wide">{t("modal.current_stock")} <span className="font-bold text-primary-dark">{p.stockWeight}g</span></div>
                                        </div>
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1 rtl:ml-0 rtl:mr-1">{t("modal.amount_label")}</label>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                value={adjustQuantity}
                                                onChange={(e) => setAdjustQuantity(Number(e.target.value))}
                                                className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl text-gray-900 font-bold focus:ring-2 focus:ring-primary/20"
                                            />
                                            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">
                                                {adjustQuantity > 0 ? `+${adjustQuantity} (${t("modal.add")})` : adjustQuantity < 0 ? `${adjustQuantity} (${t("modal.remove")})` : `(${t("modal.no_change")})`}
                                            </div>
                                        </div>
                                        <p className="text-[10px] text-primary font-bold uppercase">{t("modal.resulting_stock")} {p.stockWeight + adjustQuantity}g</p>
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">{t("modal.reason_label_detailed")}</label>
                                        <input
                                            type="text"
                                            placeholder={t("modal.reason_placeholder")}
                                            value={adjustReason}
                                            onChange={(e) => setAdjustReason(e.target.value)}
                                            className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-primary/20"
                                        />
                                    </div>

                                    <button
                                        onClick={() => handleAdjust(p.id)}
                                        disabled={loading || adjustQuantity === 0 || !adjustReason}
                                        className="w-full py-4 bg-primary text-white rounded-xl font-bold shadow-lg shadow-primary/20 hover:bg-primary-dark transition-all disabled:opacity-50 disabled:shadow-none mt-4"
                                    >
                                        {loading ? t("modal.updating") : t("modal.update")}
                                    </button>
                                </div>
                            );
                        })()}
                    </div>
                </div>
            )}
        </div>
    );
}
