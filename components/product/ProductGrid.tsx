"use client";

import { useState } from "react";
import ProductCard from "./ProductCard";
import { SearchBar } from "@/components/ui/SearchBar";

interface Product {
    id: string;
    name: string;
    brand: string;
    description: string;
    imageUrl: string;
    wholesalePrice: number;
    minimumOrderQuantity: number;
    unitsPerBox: number;
}

export default function ProductGrid({ products }: { products: Product[] }) {
    const [searchTerm, setSearchTerm] = useState("");

    const filteredProducts = products.filter((p) =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.brand.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-12">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <SearchBar
                    placeholder="Search collections..."
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="max-w-md w-full"
                />
                <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span>{filteredProducts.length} Products found</span>
                    <select className="bg-transparent border-b border-gray-300 py-1 outline-none">
                        <option>Featured</option>
                        <option>Price: Low to High</option>
                        <option>Price: High to Low</option>
                    </select>
                </div>
            </div>

            {filteredProducts.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                    {filteredProducts.map((product) => (
                        <ProductCard key={product.id} product={product} />
                    ))}
                </div>
            ) : (
                <div className="py-24 text-center">
                    <h3 className="text-2xl text-gray-400 font-serif">No products found for "{searchTerm}"</h3>
                </div>
            )}
        </div>
    );
}
