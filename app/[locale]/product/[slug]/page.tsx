"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { useCart } from "@/context/CartContext";
import { ShoppingCart, ArrowLeft, Info, Package, ShieldCheck, Box } from "lucide-react";
import SafeImage from "@/components/SafeImage";
import { useRealtime } from "@/hooks/use-realtime";
import { showToast } from "@/components/ui/Toast";
import { useTranslations, useLocale } from "next-intl";

interface Product {
    id: string;
    name: string;
    brand: string;
    description: string;
    imageUrl: string;
    basePrice: number;
    stockWeight: number;
    category: { id: string; name: string } | null;
    volumes: { id: string; weight: number; price: number }[];
}

export default function ProductPage() {
    const params = useParams();
    const router = useRouter();
    const t = useTranslations("product");
    const c = useTranslations("catalog");
    const locale = useLocale();
    const tCommon = useTranslations("common");
    const isRtl = locale === "ar";

    const [product, setProduct] = useState<Product | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedVolumeId, setSelectedVolumeId] = useState("");
    const [quantity, setQuantity] = useState(1);
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");
    const [adding, setAdding] = useState(false);

    const { addItem } = useCart();

    useEffect(() => {
        if (!params.slug) return;
        console.log(`[ProductPage] Fetching product for slug: ${params.slug}`);
        setLoading(true);
        setError("");

        fetch(`/api/products/${params.slug}`)
            .then((r) => r.json())
            .then((json) => {
                console.log(`[ProductPage] Product API result:`, json);
                if (json.success && json.data) {
                    setProduct(json.data);
                    console.log(`[ProductPage] Product loaded successfully: ${json.data.name} (${json.data.id})`);
                    if (json.data.volumes?.length > 0) {
                        setSelectedVolumeId(json.data.volumes[0].id);
                    }
                    setQuantity(1);
                } else {
                    console.warn(`[ProductPage] Product not found or error:`, json.error);
                    setError(json.error || t("not_found"));
                }
                setLoading(false);
            })
            .catch((err) => {
                console.error("[ProductPage] Fetch error:", err);
                setError(t("not_found"));
                setLoading(false);
            });
    }, [params.slug, t]);

    // ── REALTIME UPDATES ───────────────────────────────────────────────────
    useRealtime("products", (payload: any) => {
        if (payload.eventType === "UPDATE" && product && payload.new.id === product.id) {
            // Apply mapping similar to mapProduct in service
            const updatedData = payload.new;
            const mappedProduct = {
                ...product,
                ...updatedData,
                imageUrl: updatedData.imageUrl || updatedData.image || product.imageUrl,
                basePrice: Number(updatedData.basePrice || updatedData.price || product.basePrice),
            };
            setProduct(mappedProduct);
        }
    });

    const selectedVolume = product?.volumes?.find(v => v.id === selectedVolumeId);

    const adjustQuantity = (delta: number) => {
        if (!product || !selectedVolume) return;
        const next = quantity + delta;
        const requiredWeight = next * selectedVolume.weight;
        if (next >= 1 && requiredWeight <= product.stockWeight) {
            setQuantity(next);
        }
    };

    const handleAddToCart = () => {
        if (!product || !selectedVolume) return;
        setAdding(true);
        setMessage("");

        const result = addItem({
            id: product.id,
            name: product.name,
            brand: product.brand,
            imageUrl: product.imageUrl,
            basePrice: Number(selectedVolume.price),
            volumeId: selectedVolume.id,
            weight: selectedVolume.weight,
            stockWeight: product.stockWeight,
        }, quantity);

        if (result.success) {
            setMessage(t("added_success"));
            showToast(`${product.name} ${t("added_success")}`, "success");
        } else {
            setMessage(result.error || t("added_fail"));
            showToast(result.error || t("added_fail"), "error");
        }

        setAdding(false);
    };

    if (loading) {
        return (
            <main className="pt-24 min-h-screen flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            </main>
        );
    }

    if (error || !product) {
        console.log(`[ProductPage] Error or no product. Error: ${error}`);
        return (
            <main className="pt-24 min-h-screen flex flex-col items-center justify-center gap-4 bg-[#FAFAF8]">
                <div className="w-20 h-20 rounded-full bg-red-50 flex items-center justify-center mb-4">
                    <ShieldCheck className="w-10 h-10 text-red-200" />
                </div>
                <h1 className="text-3xl font-serif text-gray-900 font-bold">{t("not_found")}</h1>
                <p className="text-gray-500 max-w-md text-center mb-8">{error || "The fragrance you are looking for might have been moved or is no longer available."}</p>
                <Link href={`/${locale}/catalog`} className="px-10 py-4 bg-primary text-white rounded-2xl font-bold hover:bg-primary-dark transition-all shadow-xl shadow-primary/20">
                    {t("back_to_shop")}
                </Link>
            </main>
        );
    }

    return (
        <main className={`pt-24 pb-20 min-h-screen bg-[#FAFAF8] ${locale === 'ar' ? 'rtl' : 'ltr'}`}>
            <div className="max-w-7xl mx-auto px-6">
                {/* Header Actions */}
                <div className="flex items-center justify-between mb-12">
                    <Link href={`/${locale}/catalog`} className="flex items-center gap-2 text-gray-400 hover:text-primary transition-all font-bold group text-sm uppercase tracking-widest">
                        <ArrowLeft className={`w-4 h-4 group-hover:${isRtl ? "translate-x-1" : "-translate-x-1"} transition-transform ${isRtl ? "rotate-180" : ""}`} />
                        {t("back_to_catalog")}
                    </Link>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
                    {/* Left: Fixed Image Container */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.8 }}
                        className="lg:sticky lg:top-32"
                    >
                        <div className="aspect-square rounded-[3rem] bg-white border border-gray-100 shadow-sm overflow-hidden p-12 flex items-center justify-center group relative">
                            <SafeImage
                                src={product.imageUrl}
                                alt={product.name}
                                fill
                                className="object-contain group-hover:scale-110 transition-transform duration-1000"
                                priority
                            />

                            {/* Overlay Badge */}
                            <div className={`absolute top-8 ${isRtl ? "left-8" : "right-8"} bg-black/5 backdrop-blur-md px-4 py-2 rounded-full border border-black/5 flex items-center gap-2`}>
                                <ShieldCheck className="w-4 h-4 text-primary" />
                                <span className="text-[10px] font-black uppercase tracking-widest">{t("authentic")}</span>
                            </div>
                        </div>
                    </motion.div>

                    {/* Right: Content */}
                    <div className="flex flex-col">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.2 }}
                            className={isRtl ? "text-right" : "text-left"}
                        >
                            <span className="inline-block px-4 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase tracking-[0.2em] mb-6">
                                {product.category?.name || t("premium_fragrance")}
                            </span>

                            <h1 className="text-5xl md:text-6xl font-serif text-gray-950 mb-4 leading-tight">
                                {product.name}
                            </h1>

                            <div className="flex items-center gap-4 mb-10 overflow-x-auto whitespace-nowrap">
                                <p className="text-xl text-gray-400 font-light font-serif italic">{product.brand}</p>
                                <div className="h-4 w-px bg-gray-200 shrink-0"></div>
                                {product.stockWeight > 0 ? (
                                    <div className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest shrink-0 ${product.stockWeight <= 500 ? "bg-amber-50 text-amber-600" : "bg-green-50 text-green-600"
                                        }`}>
                                        <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${product.stockWeight <= 500 ? "bg-amber-500" : "bg-green-500"
                                            }`}></div>
                                        {product.stockWeight <= 500
                                            ? `${t("low_stock")} (${product.stockWeight >= 1000 ? (product.stockWeight / 1000).toLocaleString(isRtl ? 'ar-DZ' : 'fr-FR', { minimumFractionDigits: 1 }) + "kg" : product.stockWeight + "g"})`
                                            : t("in_stock")}
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-red-50 text-red-600 text-[10px] font-black uppercase tracking-widest shrink-0">
                                        <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>
                                        {t("out_of_stock")}
                                    </div>
                                )}
                            </div>

                            <p className="text-lg text-gray-500 leading-relaxed font-light mb-12 max-w-xl">
                                {product.description}
                            </p>

                            {/* Price Card */}
                            <div className="bg-[#1A1A1A] rounded-[2.5rem] p-10 mb-12 text-white relative overflow-hidden group">
                                <div className="relative z-10">
                                    <p className={`text-[#D4AF37] text-xs font-black uppercase tracking-[0.3em] mb-3 ${isRtl ? "text-right" : "text-left"}`}>{t("professional_grade")}</p>
                                    <div className={`flex items-baseline gap-3 mb-8 ${isRtl ? "flex-row-reverse justify-end" : "flex-row"}`}>
                                        <span className="text-5xl font-bold">
                                            {(selectedVolume?.price || 0).toLocaleString(isRtl ? 'ar-DZ' : 'fr-FR')}
                                        </span>
                                        <span className="text-xl text-gray-500 font-serif">{tCommon('labels.currency')}</span>
                                        <span className={`text-gray-400 text-sm font-light tracking-wide italic ${isRtl ? "mr-4" : "ml-4"}`}>
                                            {t("per_unit")} {selectedVolume ? (selectedVolume.weight >= 1000 ? `${selectedVolume.weight / 1000}kg` : `${selectedVolume.weight}g`) : ""}
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="space-y-1">
                                            <p className="text-[9px] text-gray-500 font-black uppercase tracking-widest">{t("selected_size")}</p>
                                            <p className={`text-lg font-bold flex items-center gap-2 ${isRtl ? "flex-row-reverse mr-0" : ""}`}>
                                                <Box className="w-4 h-4 text-[#D4AF37]" />
                                                {selectedVolume ? (selectedVolume.weight >= 1000 ? `${selectedVolume.weight / 1000}kg` : `${selectedVolume.weight}g`) : ""}
                                            </p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-[9px] text-gray-500 font-black uppercase tracking-widest">{t("order_total")}</p>
                                            <p className="text-lg font-bold text-[#D4AF37]">
                                                {((selectedVolume?.price || 0) * quantity).toLocaleString(isRtl ? 'ar-DZ' : 'fr-FR')} {tCommon('labels.currency')}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                <div className={`absolute top-0 ${isRtl ? "left-0" : "right-0"} w-64 h-64 bg-[#D4AF37]/5 rounded-full blur-[100px] ${isRtl ? "-ml-32" : "-mr-32"} -mt-32`}></div>
                            </div>

                            {/* Controls */}
                            <div className="space-y-8">
                                <div className="space-y-4">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">{t("select_size")}</p>
                                    <div className="flex flex-wrap gap-3">
                                        {product.volumes?.map((v) => (
                                            <button
                                                key={v.id}
                                                onClick={() => setSelectedVolumeId(v.id)}
                                                className={`px-6 py-4 rounded-2xl border transition-all font-bold text-sm ${selectedVolumeId === v.id
                                                    ? "bg-primary border-primary text-white shadow-lg shadow-primary/20 scale-105"
                                                    : "bg-white border-gray-100 text-gray-600 hover:border-primary/30"
                                                    }`}
                                            >
                                                {v.weight >= 1000 ? `${v.weight / 1000}kg` : `${v.weight}g`}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex flex-wrap items-center gap-8">
                                    <div className="space-y-3">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">{t("configure_quantity")}</p>
                                        <div className="flex items-center bg-white border border-gray-100 rounded-2xl p-1.5 shadow-sm">
                                            <button
                                                onClick={() => adjustQuantity(-1)}
                                                disabled={quantity <= 1}
                                                className="w-12 h-12 rounded-xl flex items-center justify-center text-gray-400 hover:bg-gray-50 disabled:opacity-30 transition-all font-bold text-xl"
                                            >
                                                −
                                            </button>
                                            <div className="px-8 text-center min-w-[120px]">
                                                <span className="block text-2xl font-bold text-gray-950">{quantity}</span>
                                                <span className="text-[8px] text-gray-400 font-black uppercase tracking-widest">
                                                    {t("units_of")} {selectedVolume ? (selectedVolume.weight >= 1000 ? `${selectedVolume.weight / 1000}kg` : `${selectedVolume.weight}g`) : ""}
                                                </span>
                                            </div>
                                            <button
                                                onClick={() => adjustQuantity(1)}
                                                disabled={(quantity + 1) * (selectedVolume?.weight || 0) > product.stockWeight}
                                                className="w-12 h-12 rounded-xl flex items-center justify-center text-gray-400 hover:bg-gray-50 disabled:opacity-30 transition-all font-bold text-xl"
                                            >
                                                +
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-4">
                                    <button
                                        onClick={handleAddToCart}
                                        disabled={adding || product.stockWeight === 0}
                                        className="w-full bg-primary text-white py-6 rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-primary-dark transition-all transform active:scale-[0.99] shadow-xl shadow-primary/20 disabled:opacity-50"
                                    >
                                        {adding ? (
                                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        ) : (
                                            <>
                                                <ShoppingCart className="w-5 h-5" />
                                                {t("add_to_cart")}
                                            </>
                                        )}
                                    </button>


                                    <div className="flex items-center gap-2 justify-center text-gray-400 text-[10px] font-medium uppercase tracking-[0.2em]">
                                        <Info className="w-3 h-3 text-primary" />
                                        {t("wholesale_note")}
                                    </div>
                                </div>
                            </div>

                            {message && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className={`mt-8 p-4 rounded-xl text-center text-sm font-bold ${message.includes("success") || message === t("added_success") ? "bg-green-50 text-green-600 border border-green-100" : "bg-red-50 text-red-600 border border-red-100"
                                        }`}
                                >
                                    {message}
                                </motion.div>
                            )}
                        </motion.div>
                    </div>
                </div>
            </div>
        </main>
    );
}
