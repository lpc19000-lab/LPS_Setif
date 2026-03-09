"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";

interface Product {
    id: string;
    name: string;
    brand: string;
    imageUrl: string;
    basePrice: number;
    stockMl: number;
    lowStockThreshold: number;
    status: string;
    category: { id: string; name: string } | null;
}

interface Category {
    id: string;
    name: string;
}

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import SafeImage from "@/components/SafeImage";

function CatalogContent() {
    const searchParams = useSearchParams();
    const initialCategory = searchParams.get("category") || "";

    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
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

    const brands = Array.from(new Set(products.map((p) => p.brand).filter(Boolean)));
    
    return (
        <main className="pt-24 pb-20 min-h-screen bg-[#FAFAF8]">
            <div className="max-w-7xl mx-auto px-6">
                {/* Header */}
                <div className="text-center mb-12">
                    <h1 className="text-3xl md:text-5xl font-serif text-primary-dark mb-3">
                        Our Collection
                    </h1>
                    <p className="text-gray-500 max-w-md mx-auto">
                        Premium fragrances with flexible volume options
                    </p>
                </div>

                {/* Filters */}
                <div className="flex flex-col md:flex-row gap-4 mb-10">
                    <input
                        type="text"
                        placeholder="Search fragrances..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="input-luxury flex-1"
                    />
                    <select
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value)}
                        className="input-luxury md:w-48"
                    >
                        <option value="">All Categories</option>
                        {categories.map((c) => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                    </select>
                    <select
                        value={brandFilter}
                        onChange={(e) => setBrandFilter(e.target.value)}
                        className="input-luxury md:w-48"
                    >
                        <option value="">All Brands</option>
                        {brands.map((b) => (
                            <option key={b} value={b}>{b}</option>
                        ))}
                    </select>
                    <label className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm cursor-pointer hover:border-[#D4AF37]/40 transition-colors whitespace-nowrap">
                        <input
                            type="checkbox"
                            checked={inStockOnly}
                            onChange={(e) => setInStockOnly(e.target.checked)}
                            className="accent-[#D4AF37]"
                        />
                        In Stock Only
                    </label>
                </div>

                {/* Products Grid */}
                {loading ? (
                    <div className="flex justify-center py-20">
                        <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                    </div>
                ) : products.length === 0 ? (
                    <div className="text-center py-20">
                        <p className="text-gray-400 text-lg">No products found</p>
                        <p className="text-gray-300 text-sm mt-2">Try adjusting your search or filters</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {products.map((product, i) => (
                            <motion.div
                                key={product.id}
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.05, duration: 0.5 }}
                            >
                                <Link href={`/product/${product.id}`}>
                                    <div className="product-card group cursor-pointer">
                                        <div className="relative aspect-square bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden">
                                            <SafeImage
                                                src={product.imageUrl}
                                                alt={product.name}
                                                fill
                                                className="object-cover group-hover:scale-105 transition-transform duration-700"
                                            />
                                            {product.stockMl <= 0 && (
                                                <span className="absolute top-3 right-3 bg-gray-900/80 text-white text-xs px-2.5 py-1 rounded-full">
                                                    Out of Stock
                                                </span>
                                            )}
                                            {product.stockMl > 0 && product.stockMl <= product.lowStockThreshold && (
                                                <span className="absolute top-3 right-3 bg-red-500/90 text-white text-xs px-2.5 py-1 rounded-full">
                                                    Low Stock
                                                </span>
                                            )}
                                        </div>
                                        <div className="p-5">
                                            {product.category && (
                                                <p className="text-xs text-primary uppercase tracking-widest mb-1">
                                                    {product.category.name}
                                                </p>
                                            )}
                                            <h3 className="font-serif text-lg text-gray-800 mb-1 group-hover:text-primary-dark transition-colors">
                                                {product.name}
                                            </h3>
                                            <p className="text-gray-400 text-sm mb-3">{product.brand}</p>
                                            <div className="flex items-end justify-between">
                                                <div>
                                                    <p className="text-primary-dark font-bold text-xl">
                                                        {Number(product.basePrice).toLocaleString()} DA
                                                    </p>
                                                    <p className="text-gray-400 text-xs mt-0.5">
                                                        Per 100ml reference
                                                    </p>
                                                </div>
                                                <span className="text-primary text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                                                    View →
                                                </span>
                                            </div>
                                        </div>
                                    </div>
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
                            {loadingMore ? "Loading..." : "Discover More"}
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
