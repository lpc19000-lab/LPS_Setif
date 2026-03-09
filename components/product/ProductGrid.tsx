"use client";

import { useState } from "react";
import ProductCard from "./ProductCard";
import ProductListRow from "./ProductListRow";
import { SearchBar } from "@/components/ui/SearchBar";
import { useTranslations } from "next-intl";

interface Product {
    id: string;
    name: string;
    brand: string;
    description: string;
    imageUrl: string;
    basePrice: number;
}

export default function ProductGrid({ products }: { products: Product[] }) {
    const t = useTranslations("catalog");
    const [searchTerm, setSearchTerm] = useState("");

    const filteredProducts = products.filter((p) =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.brand.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6 md:space-y-12">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6 px-4 md:px-0">
                <SearchBar
                    placeholder={t("search_placeholder")}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="max-w-md w-full"
                />
                <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span>{filteredProducts.length} {t("products_found")}</span>
                    <select className="bg-transparent border-b border-gray-300 py-1 outline-none">
                        <option>{t("sort_featured")}</option>
                        <option>{t("sort_low_high")}</option>
                        <option>{t("sort_high_low")}</option>
                    </select>
                </div>
            </div>

            {filteredProducts.length > 0 ? (
                <>
                    {/* Mobile: Vertical List Mode (Excel-style) */}
                    <div className="md:hidden flex flex-col bg-white border-t border-gray-100">
                        {filteredProducts.map((product) => (
                            <ProductListRow key={product.id} product={product} />
                        ))}
                    </div>

                    {/* Desktop: Grid Layout */}
                    <div className="hidden md:grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                        {filteredProducts.map((product) => (
                            <ProductCard key={product.id} product={product} />
                        ))}
                    </div>
                </>
            ) : (
                <div className="py-24 text-center">
                    <h3 className="text-2xl text-gray-400 font-serif">{t("no_products")} "{searchTerm}"</h3>
                </div>
            )}
        </div>
    );
}
