import { Suspense } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { getNewArrivals, getBestSellers, getFeaturedProducts } from "@/services/product-service";
import { ProductSection, FeaturesSection, CTASection } from "@/components/HomeClient";
import { getTranslations } from "next-intl/server";

const FragranceScroll = dynamic(() => import("@/components/FragranceScroll"), {
    loading: () => <div className="h-screen bg-[#121212] animate-pulse" />,
});

// Server-side data fetching — runs on the server with caching
async function ProductSections({ locale }: { locale: string }) {
    const t = await getTranslations({ locale, namespace: "home" });
    const [newArrivals, bestSellers, featured] = await Promise.all([
        getNewArrivals(8),
        getBestSellers(4),
        getFeaturedProducts(4),
    ]);

    return (
        <>
            <ProductSection
                title={t("new_arrivals")}
                subtitle={t("new_arrivals_subtitle")}
                products={JSON.parse(JSON.stringify(newArrivals))}
            />
            <ProductSection
                title={t("best_sellers")}
                subtitle={t("best_sellers_subtitle")}
                products={JSON.parse(JSON.stringify(bestSellers))}
            />
            <ProductSection
                title={t("featured")}
                subtitle={t("featured_subtitle")}
                products={JSON.parse(JSON.stringify(featured))}
            />
        </>
    );
}

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: "home" });
    const tc = await getTranslations({ locale, namespace: "common" });

    return (
        <main className={locale === 'ar' ? 'rtl' : 'ltr'}>
            {/* ── Cinematic Hero ──── */}
            <FragranceScroll />

            {/* ── Product Sections (server-fetched, streamed) ──── */}
            <Suspense
                fallback={
                    <section className="py-20 bg-[#FAFAF8]">
                        <div className="max-w-7xl mx-auto px-6">
                            <div className="text-center mb-12">
                                <div className="h-8 w-48 bg-gray-200 rounded-lg mx-auto mb-3 animate-pulse" />
                                <div className="h-4 w-64 bg-gray-100 rounded mx-auto animate-pulse" />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                                {["skeleton-1", "skeleton-2", "skeleton-3", "skeleton-4"].map((id) => (
                                    <div key={id} className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm">
                                        <div className="aspect-square bg-gray-100 animate-pulse" />
                                        <div className="p-5 space-y-3">
                                            <div className="h-3 w-16 bg-gray-100 rounded animate-pulse" />
                                            <div className="h-5 w-32 bg-gray-200 rounded animate-pulse" />
                                            <div className="h-6 w-24 bg-gray-200 rounded animate-pulse" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>
                }
            >
                <ProductSections locale={locale} />
            </Suspense>

            {/* ── Features Section ──── */}
            <FeaturesSection />

            {/* ── CTA Section ──── */}
            <CTASection />

            {/* ── Footer ──── */}
            <footer className="py-12 bg-[#0a0a0a] border-t border-white/5">
                <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-2">
                        <span className="font-serif text-xl font-bold text-[#D4AF37]">{tc('nav.lps')}</span>
                        <span className="text-white/30 text-xs tracking-[0.3em] uppercase">{tc('nav.perfume')}</span>
                    </div>
                    <div className="flex gap-8 text-white/40 text-sm">
                        <Link href={`/${locale}/catalog`} prefetch={true} className="hover:text-[#D4AF37] transition-colors">{tc('nav.boutique')}</Link>
                        <Link href={`/${locale}/register`} prefetch={true} className="hover:text-[#D4AF37] transition-colors">{tc('buttons.register')}</Link>
                        <Link href={`/${locale}/login`} prefetch={true} className="hover:text-[#D4AF37] transition-colors">{tc('buttons.sign_in')}</Link>
                    </div>
                    <p className="text-white/20 text-xs">
                        © {new Date().getFullYear()} {tc('nav.lps')} {tc('nav.perfume')}. {t("footer_rights")}.
                    </p>
                </div>
            </footer>
        </main>
    );
}
