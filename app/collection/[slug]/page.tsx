"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import SafeImage from "@/components/SafeImage";

interface Product {
    id: string;
    name: string;
    brand: string;
    imageUrl: string;
    basePrice: number;
    category: { name: string } | null;
}


export default function CollectionPage() {
    const params = useParams();
    const slug = params.slug as string;
    const [collection, setCollection] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!slug) return;
        fetch(`/api/collections/${slug}`)
            .then((r) => r.json())
            .then((d) => {
                if (d.success) setCollection(d.data);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, [slug]);

    if (loading) {
        return (
            <main className="pt-24 pb-20 min-h-screen bg-[#FAFAF8] flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            </main>
        );
    }

    if (!collection) {
        return (
            <main className="pt-24 pb-20 min-h-screen bg-[#FAFAF8] flex flex-col items-center justify-center gap-4">
                <p className="text-gray-400 text-lg">Collection not found</p>
                <Link href="/catalog" className="text-primary hover:underline text-sm">← Back to Catalog</Link>
            </main>
        );
    }

    // Extract products from the join table
    const products: Product[] = (collection.products || []).map((pc: any) => pc.product).filter(Boolean);

    return (
        <main className="pt-24 pb-20 min-h-screen bg-[#FAFAF8]">
            <div className="max-w-7xl mx-auto px-6">
                <Link href="/catalog" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-primary mb-8 transition-colors">
                    <ArrowLeft className="w-4 h-4" /> Back to Shop
                </Link>
                <div className="text-center mb-12">
                    <h1 className="text-3xl md:text-5xl font-serif text-primary-dark mb-3">{collection.name}</h1>
                    <p className="text-gray-400 text-sm mt-2">{products.length} products</p>
                </div>

                {products.length === 0 ? (
                    <div className="text-center py-20">
                        <p className="text-gray-400 text-lg">No products in this collection yet</p>
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
                                        </div>
                                        <div className="p-5">
                                            {product.category && (
                                                <p className="text-xs text-primary uppercase tracking-widest mb-1">{product.category.name}</p>
                                            )}
                                            <h3 className="font-serif text-lg text-gray-800 mb-1 group-hover:text-primary-dark transition-colors">{product.name}</h3>
                                            <p className="text-gray-400 text-sm mb-3">{product.brand}</p>
                                            <p className="text-primary-dark font-bold text-xl">{Number(product.basePrice).toLocaleString()} DA</p>
                                        </div>
                                    </div>
                                </Link>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </main>
    );
}
