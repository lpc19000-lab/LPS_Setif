"use client";

import Image from "next/image";
import { Button } from "@/components/ui/Button";
import { ShoppingCart } from "lucide-react";

interface ProductProps {
    product: {
        id: string;
        name: string;
        brand: string;
        description: string;
        imageUrl: string;
        wholesalePrice: number;
        minimumOrderQuantity: number;
        unitsPerBox: number;
    };
}

export default function ProductCard({ product }: ProductProps) {
    return (
        <div className="group bg-white rounded-2xl overflow-hidden border border-gray-100 hover:border-primary/30 transition-all duration-300 hover:shadow-xl flex flex-col h-full">
            {/* Image Container */}
            <div className="relative aspect-square overflow-hidden bg-gray-50">
                <Image
                    src={product.imageUrl || "https://images.unsplash.com/photo-1541643600914-78b084683601?q=80&w=500&auto=format&fit=crop"}
                    alt={product.name}
                    fill
                    className="object-contain p-8 group-hover:scale-110 transition-transform duration-500"
                />
            </div>

            {/* Content */}
            <div className="p-6 flex flex-col flex-grow">
                <div className="mb-2">
                    <span className="text-[10px] uppercase tracking-widest text-primary font-semibold mb-1 block">
                        {product.brand}
                    </span>
                    <h3 className="text-xl font-serif text-text line-clamp-1">{product.name}</h3>
                </div>

                <p className="text-sm text-gray-500 line-clamp-2 mb-6 font-light flex-grow">
                    {product.description}
                </p>

                <div className="flex flex-col gap-4 mt-auto">
                    <div className="flex items-center justify-between">
                        <div className="flex flex-col">
                            <span className="text-xs text-gray-400 uppercase tracking-widest">Wholesale Price</span>
                            <span className="text-2xl font-semibold text-primary">{product.wholesalePrice} DZD</span>
                        </div>
                        <div className="text-right">
                            <span className="text-[10px] text-gray-400 uppercase tracking-widest block">Min. Order</span>
                            <span className="font-medium">{product.minimumOrderQuantity} box ({product.unitsPerBox} units)</span>
                        </div>
                    </div>

                    <Button className="w-full gap-2 py-6">
                        <ShoppingCart size={18} />
                        Add to Bulk Cart
                    </Button>
                </div>
            </div>
        </div>
    );
}
