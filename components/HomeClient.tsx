"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import SafeImage from "@/components/SafeImage";
import { useTranslations, useLocale } from "next-intl";

interface Product {
    id: string;
    name: string;
    slug: string;
    brand: string;
    imageUrl: string;
    basePrice: number;
    category: { name: string } | null;
}

function ProductCard({ product, i }: Readonly<{ product: Product; i: number }>) {
    const locale = useLocale();
    const tl = useTranslations("common.labels");
    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.08, duration: 0.5 }}
        >
            <Link href={`/${locale}/product/${product.slug || product.id}`} prefetch={true}>
                <div className={`product-card group cursor-pointer relative ${locale === 'ar' ? 'text-right' : 'text-left'}`}>
                    {/* Image */}
                    <div className="relative aspect-square bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden">
                        <img
                            src={product.imageUrl || "/images/placeholder-perfume.svg"}
                            alt={product.name}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                            onError={(e) => {
                                (e.target as HTMLImageElement).src = "/images/placeholder-perfume.svg";
                            }}
                        />
                        {/* Hover Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        {/* Quick View Badge */}
                        <div className={`absolute bottom-4 left-1/2 -translate-x-1/2 px-5 py-1.5 bg-white/90 backdrop-blur-md rounded-full text-[10px] font-black ${locale === 'ar' ? 'tracking-normal' : 'uppercase tracking-[0.2em]'} text-primary-dark opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0 transition-all duration-500 shadow-lg`}>
                            {locale === 'ar' ? 'عرض' : 'View'}
                        </div>
                        {/* Category Badge */}
                        {product.category && (
                            <span className="absolute top-3 left-3 px-2.5 py-1 bg-white/80 backdrop-blur-sm rounded-full text-[9px] font-black uppercase tracking-[0.15em] text-primary-dark border border-primary/10">
                                {product.category.name}
                            </span>
                        )}
                    </div>
                    {/* Info */}
                    <div className="p-5 space-y-1.5">
                        <p className="text-[10px] text-gray-400 uppercase tracking-[0.2em] font-bold">{product.brand}</p>
                        <h3 className="font-serif text-lg text-gray-900 leading-tight group-hover:text-primary-dark transition-colors duration-300 line-clamp-1">
                            {product.name}
                        </h3>
                        <div className="flex items-baseline gap-1.5 pt-1">
                            <span className="text-xl font-serif font-bold text-primary-dark">
                                {Number(product.basePrice).toLocaleString(locale === 'ar' ? 'ar-DZ' : 'fr-FR')}
                            </span>
                            <span className="text-xs font-bold text-gray-400">{tl("currency")}</span>
                        </div>
                    </div>
                    {/* Bottom Gold Accent */}
                    <div className="h-0.5 w-0 group-hover:w-full bg-gradient-to-r from-[#D4AF37] via-[#F5F5DC] to-[#B8860B] transition-all duration-700 ease-out" />
                </div>
            </Link>
        </motion.div>
    );
}

export function ProductSection({ title, subtitle, products }: Readonly<{ title: string; subtitle: string; products: Product[] }>) {
    const locale = useLocale();
    const t = useTranslations("catalog");
    if (products.length === 0) return null;
    return (
        <section className={`py-20 bg-[#FAFAF8] ${locale === 'ar' ? 'rtl' : 'ltr'}`}>
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
                        href={`/${locale}/catalog`}
                        prefetch={true}
                        className="inline-block px-8 py-3 border border-primary/30 text-primary rounded-full text-sm uppercase tracking-widest hover:bg-primary hover:text-white transition-all duration-300"
                    >
                        {t("discover_more")}
                    </Link>
                </div>
            </div>
        </section>
    );
}

export function FeaturesSection() {
    const locale = useLocale();
    const t = useTranslations("home");

    const features = [
        {
            icon: "✦",
            titleKey: "features.wholesale_title",
            descKey: "features.wholesale_desc",
        },
        {
            icon: "◆",
            titleKey: "features.flexible_title",
            descKey: "features.flexible_desc",
        },
        {
            icon: "❖",
            titleKey: "features.fast_delivery_title",
            descKey: "features.fast_delivery_desc",
        },
    ];

    return (
        <section className={`py-24 bg-white ${locale === 'ar' ? 'rtl' : 'ltr'}`}>
            <div className="max-w-6xl mx-auto px-6">
                <motion.h2
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.7 }}
                    className="text-center text-3xl md:text-4xl font-serif text-primary-dark mb-4"
                >
                    {t("features_title")}
                </motion.h2>
                <motion.p
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.2, duration: 0.7 }}
                    className="text-center text-gray-500 mb-16 max-w-lg mx-auto"
                >
                    {t("hero_subtitle")}
                </motion.p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {features.map((f, i) => (
                        <motion.div
                            key={f.icon}
                            initial={{ opacity: 0, y: 40 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.15, duration: 0.6 }}
                            className={`text-center p-8 rounded-2xl bg-[#FAFAF8] border border-gray-100 hover:border-primary/20 transition-all duration-500 hover:shadow-lg ${locale === 'ar' ? 'text-right' : 'text-center'}`}
                        >
                            <span className="text-primary text-3xl mb-4 block text-center">{f.icon}</span>
                            <h3 className="text-lg font-serif font-semibold text-gray-800 mb-2">{t(f.titleKey)}</h3>
                            <p className="text-gray-500 text-sm leading-relaxed">{t(f.descKey)}</p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}

export function CTASection() {
    const locale = useLocale();
    const t = useTranslations("home");
    const b = useTranslations("common.buttons");

    return (
        <section className={`py-24 bg-[#121212] text-center ${locale === 'ar' ? 'rtl' : 'ltr'}`}>
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
                className="max-w-2xl mx-auto px-6"
            >
                <h2 className="text-[#D4AF37] text-3xl md:text-5xl font-serif font-bold mb-6">
                    {t("cta_title")}
                </h2>
                <p className="text-white/60 text-lg mb-10 leading-relaxed">
                    {t("cta_subtitle")}
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Link
                        href={`/${locale}/register`}
                        prefetch={true}
                        className="px-8 py-3.5 bg-[#D4AF37] text-white rounded-full font-medium hover:bg-[#B8860B] transition-all duration-300 text-sm uppercase tracking-widest"
                    >
                        {b("register")}
                    </Link>
                    <Link
                        href={`/${locale}/catalog`}
                        prefetch={true}
                        className="px-8 py-3.5 border border-white/20 text-white/80 rounded-full font-medium hover:border-[#D4AF37]/50 hover:text-[#D4AF37] transition-all duration-300 text-sm uppercase tracking-widest"
                    >
                        {t("cta_browse_catalog")}
                    </Link>
                </div>
            </motion.div>
        </section>
    );
}
