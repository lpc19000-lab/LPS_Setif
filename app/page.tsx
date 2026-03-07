"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import dynamic from "next/dynamic";
import SafeImage from "@/components/SafeImage";

const FragranceScroll = dynamic(() => import("@/components/FragranceScroll"), {
    ssr: false,
    loading: () => <div className="h-screen bg-[#121212] animate-pulse" />
});

interface Product {
    id: string;
    name: string;
    brand: string;
    imageUrl: string;
    wholesalePrice: number;
    minimumOrderQuantity: number;
    stockQuantity: number;
    category: { name: string } | null;
}

const features = [
    {
        icon: "✦",
        title: "Wholesale Pricing",
        desc: "Exclusive B2B prices for registered distributors across Algeria.",
    },
    {
        icon: "◆",
        title: "Bulk Ordering",
        desc: "Order by the box with minimum quantities designed for retailers.",
    },
    {
        icon: "❖",
        title: "Fast Delivery",
        desc: "Nationwide delivery across all 58 wilayas within 48 hours.",
    },
];

function ProductCard({ product, i }: { product: Product; i: number }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.08, duration: 0.5 }}
        >
            <Link href={`/product/${product.id}`} prefetch={true}>
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
                        <h3 className="font-serif text-lg text-gray-800 mb-1 group-hover:text-primary-dark transition-colors">
                            {product.name}
                        </h3>
                        <p className="text-gray-400 text-sm mb-3">{product.brand}</p>
                        <p className="text-primary-dark font-bold text-xl">
                            {Number(product.wholesalePrice).toLocaleString()} DA
                        </p>
                    </div>
                </div>
            </Link>
        </motion.div>
    );
}

function ProductSection({ title, subtitle, products }: { title: string; subtitle: string; products: Product[] }) {
    if (products.length === 0) return null;
    return (
        <section className="py-20 bg-[#FAFAF8]">
            <div className="max-w-7xl mx-auto px-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className="text-center mb-12"
                >
                    <h2 className="text-3xl md:text-4xl font-serif text-primary-dark mb-3">{title}</h2>
                    <p className="text-gray-500 max-w-md mx-auto">{subtitle}</p>
                </motion.div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {products.map((p, i) => (
                        <ProductCard key={p.id} product={p} i={i} />
                    ))}
                </div>
                <div className="text-center mt-10">
                    <Link
                        href="/catalog"
                        prefetch={true}
                        className="inline-block px-8 py-3 border border-primary/30 text-primary rounded-full text-sm uppercase tracking-widest hover:bg-primary hover:text-white transition-all duration-300"
                    >
                        View All
                    </Link>
                </div>
            </div>
        </section>
    );
}

export default function HomePage() {
    const [newArrivals, setNewArrivals] = useState<Product[]>([]);
    const [bestSellers, setBestSellers] = useState<Product[]>([]);
    const [featured, setFeatured] = useState<Product[]>([]);

    useEffect(() => {
        const fetchOptions = { next: { revalidate: 3600 } };
        fetch("/api/products?limit=8", fetchOptions).then(r => r.json()).then(d => { if (d.success) setFeatured(d.data.slice(0, 4)); });
        fetch("/api/products", fetchOptions).then(r => r.json()).then(d => { if (d.success) setNewArrivals(d.data.slice(0, 8)); });
        fetch("/api/products?limit=4", fetchOptions).then(r => r.json()).then(d => { if (d.success) setBestSellers(d.data.slice(0, 4)); });
    }, []);

    return (
        <main>
            {/* ── Cinematic Hero ──── */}
            <FragranceScroll />

            {/* ── New Arrivals ──── */}
            <ProductSection
                title="New Arrivals"
                subtitle="The latest additions to our premium collection"
                products={newArrivals}
            />

            {/* ── Best Sellers ──── */}
            <ProductSection
                title="Best Sellers"
                subtitle="Most popular fragrances among our partners"
                products={bestSellers}
            />

            {/* ── Featured ──── */}
            <ProductSection
                title="Featured Perfumes"
                subtitle="Hand-picked selections for your store"
                products={featured}
            />

            {/* ── Features Section ──── */}
            <section className="py-24 bg-white">
                <div className="max-w-6xl mx-auto px-6">
                    <motion.h2
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.7 }}
                        className="text-center text-3xl md:text-4xl font-serif text-primary-dark mb-4"
                    >
                        Why LPS Perfume?
                    </motion.h2>
                    <motion.p
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.2, duration: 0.7 }}
                        className="text-center text-gray-500 mb-16 max-w-lg mx-auto"
                    >
                        Algeria&apos;s premier B2B perfume distribution platform
                    </motion.p>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {features.map((f, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 40 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.15, duration: 0.6 }}
                                className="text-center p-8 rounded-2xl bg-[#FAFAF8] border border-gray-100 hover:border-primary/20 transition-all duration-500 hover:shadow-lg"
                            >
                                <span className="text-primary text-3xl mb-4 block">{f.icon}</span>
                                <h3 className="text-lg font-serif font-semibold text-gray-800 mb-2">{f.title}</h3>
                                <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── CTA Section ──── */}
            <section className="py-24 bg-[#121212] text-center">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8 }}
                    className="max-w-2xl mx-auto px-6"
                >
                    <h2 className="text-[#D4AF37] text-3xl md:text-5xl font-serif font-bold mb-6">
                        Ready to Partner?
                    </h2>
                    <p className="text-white/60 text-lg mb-10 leading-relaxed">
                        Join hundreds of retailers across Algeria. Register today and access
                        exclusive wholesale pricing on premium fragrances.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link
                            href="/register"
                            prefetch={true}
                            className="px-8 py-3.5 bg-[#D4AF37] text-white rounded-full font-medium hover:bg-[#B8860B] transition-all duration-300 text-sm uppercase tracking-widest"
                        >
                            Register Now
                        </Link>
                        <Link
                            href="/catalog"
                            prefetch={true}
                            className="px-8 py-3.5 border border-white/20 text-white/80 rounded-full font-medium hover:border-[#D4AF37]/50 hover:text-[#D4AF37] transition-all duration-300 text-sm uppercase tracking-widest"
                        >
                            Browse Catalog
                        </Link>
                    </div>
                </motion.div>
            </section>

            {/* ── Footer ──── */}
            <footer className="py-12 bg-[#0a0a0a] border-t border-white/5">
                <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-2">
                        <span className="font-serif text-xl font-bold text-[#D4AF37]">LPS</span>
                        <span className="text-white/30 text-xs tracking-[0.3em] uppercase">Perfume</span>
                    </div>
                    <div className="flex gap-8 text-white/40 text-sm">
                        <Link href="/catalog" prefetch={true} className="hover:text-[#D4AF37] transition-colors">Catalog</Link>
                        <Link href="/register" prefetch={true} className="hover:text-[#D4AF37] transition-colors">Register</Link>
                        <Link href="/login" prefetch={true} className="hover:text-[#D4AF37] transition-colors">Login</Link>
                    </div>
                    <p className="text-white/20 text-xs">
                        © {new Date().getFullYear()} LPS Perfume. All rights reserved.
                    </p>
                </div>
            </footer>
        </main>
    );
}
