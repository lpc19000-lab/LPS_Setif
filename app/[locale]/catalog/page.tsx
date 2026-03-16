"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useSearchParams } from "next/navigation";
import SafeImage from "@/components/SafeImage";
import { useTranslations, useLocale } from "next-intl";

interface Product {
    id: string;
    slug: string;
    name: string;
    brand: string;
    imageUrl: string;
    basePrice: number;
    stockWeight: number;
    lowStockThreshold: number;
    status: string;
    category: { id: string; name: string } | null;
}

interface Category {
    id: string;
    name: string;
}

function CatalogContent() {
    const searchParams = useSearchParams();
    const initialCategory = searchParams.get("category") || "";
    const t = useTranslations("catalog");
    const tCommon = useTranslations("common.labels");
    const tBtn = useTranslations("common.buttons");
    const locale = useLocale();

    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [availableBrands, setAvailableBrands] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [search, setSearch] = useState("");
    const [categoryFilter, setCategoryFilter] = useState(initialCategory);
    const [brandFilter, setBrandFilter] = useState("");
    const [inStockOnly, setInStockOnly] = useState(false);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    useEffect(() => {
        fetchCategories();
        fetchBrands();
    }, []);

    useEffect(() => {
        setPage(1);
        fetchProducts(true);
    }, [search, categoryFilter, brandFilter, inStockOnly]);

    const fetchProducts = async (reset = false) => {
        if (reset) {
            setLoading(true);
        } else {
            setLoadingMore(true);
        }

        try {
            const params = new URLSearchParams();
            if (search) params.set("search", search);
            if (categoryFilter) params.set("categoryId", categoryFilter);
            if (brandFilter) params.set("brand", brandFilter);
            if (inStockOnly) params.set("inStock", "true");
            params.set("page", reset ? "1" : (page + 1).toString());
            params.set("limit", "16");

            const res = await fetch(`/api/products?${params}`);
            const json = await res.json();

            if (json.success) {
                if (reset) {
                    setProducts(json.data);
                } else {
                    setProducts(prev => [...prev, ...json.data]);
                    setPage(prev => prev + 1);
                }
                setTotalPages(json.pagination.totalPages);
            }
        } catch (e) {
            console.error(e);
        }
        setLoading(false);
        setLoadingMore(false);
    };

    const fetchCategories = async () => {
        try {
            const res = await fetch("/api/categories");
            const json = await res.json();
            if (json.success) setCategories(json.data);
        } catch (e) {
            console.error(e);
        }
    };

    const fetchBrands = async () => {
        try {
            const res = await fetch("/api/brands");
            const json = await res.json();
            if (json.success) setAvailableBrands(json.data);
        } catch (e) {
            console.error(e);
        }
    };

    const brands = Array.from(new Set(products.map((p) => p.brand).filter(Boolean)));

    const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

    useEffect(() => {
        // Default to list on mobile
        if (window.innerWidth < 768) {
            setViewMode("list");
        }
    }, []);

    return (
        <main className={`pt-24 pb-20 min-h-screen bg-[#FAFAF8] ${locale === 'ar' ? 'rtl' : 'ltr'}`}>
            <div className="max-w-7xl mx-auto px-6">
                {/* Header */}
                <div className="text-center mb-12">
                    <h1 className="text-3xl md:text-5xl font-serif text-primary-dark mb-3">
                        {t("title")}
                    </h1>
                    <p className="text-gray-500 max-w-md mx-auto">
                        {t("subtitle")}
                    </p>
                </div>

                {/* Filters & View Toggle */}
                <div className="flex flex-col gap-4 mb-10">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="relative flex-1">
                            <input
                                type="text"
                                placeholder={t("search_placeholder")}
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="input-luxury w-full"
                            />
                        </div>
                        <div className="flex gap-2">
                            <select
                                value={categoryFilter}
                                onChange={(e) => setCategoryFilter(e.target.value)}
                                className="input-luxury flex-1 md:w-48"
                            >
                                <option value="">{tCommon("all_categories")}</option>
                                {categories.map((c) => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                            <select
                                value={brandFilter}
                                onChange={(e) => setBrandFilter(e.target.value)}
                                className="input-luxury flex-1 md:w-48"
                            >
                                <option value="">{tCommon("all_brands")}</option>
                                {availableBrands.map((b) => (
                                    <option key={b} value={b}>{b}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                        <label className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm cursor-pointer hover:border-[#D4AF37]/40 transition-colors whitespace-nowrap">
                            <input
                                type="checkbox"
                                checked={inStockOnly}
                                onChange={(e) => setInStockOnly(e.target.checked)}
                                className="accent-[#D4AF37]"
                            />
                            {tCommon("in_stock_only")}
                        </label>

                        {/* View Toggle (Desktop only or optional) */}
                        <div className="hidden md:flex bg-white border border-gray-100 p-1 rounded-xl shadow-sm">
                            <button 
                                onClick={() => setViewMode("grid")}
                                className={`p-2 rounded-lg transition-colors ${viewMode === "grid" ? "bg-primary/10 text-primary" : "text-gray-400 hover:text-gray-600"}`}
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
                            </button>
                            <button 
                                onClick={() => setViewMode("list")}
                                className={`p-2 rounded-lg transition-colors ${viewMode === "list" ? "bg-primary/10 text-primary" : "text-gray-400 hover:text-gray-600"}`}
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" /></svg>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Products Display */}
                {loading && (
                    <div className="flex justify-center py-20">
                        <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                    </div>
                )}

                {!loading && products.length === 0 && (
                    <div className="text-center py-20">
                        <p className="text-gray-400 text-lg">{t("no_products")}</p>
                        <p className="text-gray-300 text-sm mt-2">{t("no_products_hint")}</p>
                    </div>
                )}

                {!loading && products.length > 0 && (
                    <div className={viewMode === "grid" 
                        ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                        : "flex flex-col gap-4"
                    }>
                        {products.map((product, i) => (
                            <motion.div
                                key={product.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.03, duration: 0.4 }}
                            >
                                <Link href={`/${locale}/product/${encodeURIComponent(product.slug || product.id)}`}>
                                    {viewMode === "grid" ? (
                                        <div className={`product-card group cursor-pointer ${locale === 'ar' ? 'text-right' : 'text-left'}`}>
                                            <div className="relative aspect-square bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden">
                                                <SafeImage
                                                    src={product.imageUrl}
                                                    alt={product.name}
                                                    fill
                                                    className="object-cover group-hover:scale-105 transition-transform duration-700"
                                                />
                                                {product.stockWeight <= 0 && (
                                                    <span className={`absolute top-3 ${locale === 'ar' ? 'left-3' : 'right-3'} bg-gray-900/80 text-white text-xs px-2.5 py-1 rounded-full`}>
                                                        {tCommon("out_of_stock")}
                                                    </span>
                                                )}
                                                {product.stockWeight > 0 && product.stockWeight <= product.lowStockThreshold && (
                                                    <span className={`absolute top-3 ${locale === 'ar' ? 'left-3' : 'right-3'} bg-red-500/90 text-white text-xs px-2.5 py-1 rounded-full`}>
                                                        {tCommon("low_stock")}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="p-5">
                                                {product.category && (
                                                    <p className="text-xs text-primary uppercase tracking-widest mb-1">
                                                        {product.category.name}
                                                    </p>
                                                )}
                                                <h3 className="font-serif text-lg text-gray-800 mb-1 group-hover:text-primary-dark transition-colors truncate">
                                                    {product.name}
                                                </h3>
                                                <p className="text-gray-400 text-sm mb-3">{product.brand}</p>
                                                <div className="flex items-end justify-between">
                                                    <div className={locale === 'ar' ? 'text-right' : 'text-left'}>
                                                        <p className="text-primary-dark font-bold text-xl">
                                                            {Number(product.basePrice).toLocaleString(locale === 'ar' ? 'ar-DZ' : 'fr-FR')} {tCommon("currency")}
                                                        </p>
                                                        <p className="text-gray-400 text-xs mt-0.5">
                                                            {tCommon("per_100ml")}
                                                        </p>
                                                    </div>
                                                    <span className={`text-primary text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity ${locale === 'ar' ? 'rotate-180' : ''}`}>
                                                        {tBtn("view")} →
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        /* List Mode Layout */
                                        <div className="bg-white rounded-2xl border border-gray-100 p-3 flex gap-4 hover:shadow-md transition-shadow group">
                                            <div className="relative w-24 h-24 sm:w-32 sm:h-32 bg-gray-50 rounded-xl overflow-hidden shrink-0">
                                                <SafeImage
                                                    src={product.imageUrl}
                                                    alt={product.name}
                                                    fill
                                                    className="object-cover"
                                                />
                                                {product.stockWeight <= 0 && (
                                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                                        <span className="text-[8px] sm:text-xs text-white font-bold uppercase tracking-tighter">
                                                            {tCommon("out_of_stock")}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex-1 flex flex-col justify-between py-1">
                                                <div>
                                                    <div className="flex justify-between items-start gap-2">
                                                        <h3 className="font-serif text-sm sm:text-lg text-gray-900 group-hover:text-primary transition-colors leading-tight">
                                                            {product.name}
                                                        </h3>
                                                        <p className="text-primary-dark font-bold text-sm sm:text-base whitespace-nowrap">
                                                            {Number(product.basePrice).toLocaleString(locale === 'ar' ? 'ar-DZ' : 'fr-FR')} {tCommon("currency")}
                                                        </p>
                                                    </div>
                                                    <p className="text-gray-400 text-[11px] sm:text-sm mt-0.5">{product.brand}</p>
                                                    {product.category && (
                                                        <span className="inline-block mt-2 px-2 py-0.5 bg-gray-50 text-[10px] text-gray-400 uppercase tracking-wider rounded-md">
                                                            {product.category.name}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex items-center justify-between mt-2">
                                                    <span className="text-[10px] text-gray-400">
                                                        {tCommon("per_100ml")}
                                                    </span>
                                                    <button className="text-xs font-bold text-primary flex items-center gap-1 group-hover:translate-x-1 transition-transform rtl:group-hover:-translate-x-1">
                                                        {tBtn("view")}
                                                        <span className={locale === 'ar' ? 'rotate-180' : ''}>→</span>
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </Link>
                            </motion.div>
                        ))}
                    </div>
                )}

                {/* Pagination */}
                {!loading && page < totalPages && (
                    <div className="mt-16 text-center">
                        <button
                            onClick={() => fetchProducts(false)}
                            disabled={loadingMore}
                            className="bg-white border border-gray-200 px-10 py-4 rounded-2xl text-primary font-medium hover:border-primary/40 hover:shadow-lg transition-all duration-300 disabled:opacity-50 flex items-center gap-3 mx-auto"
                        >
                            {loadingMore ? (
                                <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                            ) : null}
                            {loadingMore ? tBtn("loading") : t("discover_more")}
                        </button>
                    </div>
                )}
            </div>
        </main>
    );
}


export default function ShopPage() {
    return (
        <Suspense fallback={
            <main className="pt-24 pb-20 min-h-screen bg-[#FAFAF8] flex justify-center items-center">
                <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            </main>
        }>
            <CatalogContent />
        </Suspense>
    );
}
