"use client";

import { Button } from "@/components/ui/Button";
import { ShoppingCart } from "lucide-react";
import SafeImage from "@/components/SafeImage";
import { useTranslations, useLocale } from "next-intl";
import Link from "next/link";

interface ProductProps {
    product: {
        id: string;
        slug?: string;
        name: string;
        brand: string;
        description: string;
        imageUrl: string;
        basePrice: number;
    };
}

export default function ProductCard({ product }: ProductProps) {
    const t = useTranslations("product");
    const com = useTranslations("common");
    const locale = useLocale();

    return (
        <div className="group bg-white rounded-2xl overflow-hidden border border-gray-100 hover:border-primary/30 transition-all duration-300 hover:shadow-xl flex flex-col h-full">
            {/* Image Container */}
            <div className="relative aspect-square overflow-hidden bg-gray-50">
                <SafeImage
                    src={product.imageUrl}
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
                            <span className="text-xs text-gray-400 uppercase tracking-widest">
                                {t("base_price")} ({com("labels.per_100ml")})
                            </span>
                            <span className="text-2xl font-semibold text-primary">{product.basePrice} {com("labels.currency")}</span>
                        </div>
                    </div>

                    <Link href={`/${locale}/product/${product.slug || product.id}`} className="w-full">
                        <Button className="w-full gap-2 py-6">
                            <ShoppingCart size={18} />
                            {t("view_details")}
                        </Button>
                    </Link>
                </div>
            </div>
        </div>
    );
}
