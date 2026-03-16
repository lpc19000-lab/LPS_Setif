"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import SafeImage from "@/components/SafeImage";

interface ProductListRowProps {
    product: {
        id: string;
        name: string;
        brand: string;
        imageUrl: string;
        basePrice: number;
    };
}

export default function ProductListRow({ product }: ProductListRowProps) {
    const locale = useLocale();
    const t = useTranslations("product");

    return (
        <Link
            href={`/${locale}/product/${product.id}`}
            className="flex items-center gap-4 bg-white p-3 border-b border-gray-100 hover:bg-gray-50 transition-colors"
        >
            {/* Small Product Image */}
            <div className="relative w-16 h-16 flex-shrink-0 bg-gray-50 rounded-lg overflow-hidden border border-gray-100">
                <SafeImage
                    src={product.imageUrl}
                    alt={product.name}
                    fill
                    className="object-contain p-2"
                />
            </div>

            {/* Info Column */}
            <div className="flex-grow min-w-0">
                <div className="flex justify-between items-start">
                    <div className="min-w-0">
                        <h3 className="text-sm font-semibold text-gray-900 truncate">{product.name}</h3>
                        <p className="text-[10px] text-primary uppercase tracking-wider font-medium">{product.brand}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                        <p className="text-sm font-bold text-primary">{product.basePrice} DA</p>
                        <p className="text-[10px] text-gray-400 font-light">{t("base_price")} (100g)</p>
                    </div>
                </div>

                {/* Weight Options Placeholder - Compact */}
                <div className="mt-2 flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                    {["100g", "500g", "1kg"].map((unit) => (
                        <span key={unit} className="px-2 py-0.5 bg-gray-100 text-[9px] font-medium text-gray-500 rounded border border-gray-200">
                            {unit}
                        </span>
                    ))}
                </div>
            </div>
        </Link>
    );
}
