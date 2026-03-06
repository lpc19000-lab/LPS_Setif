"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { useCart } from "@/context/CartContext";
import { ShoppingCart, ArrowLeft, Info, Package, ShieldCheck, Box } from "lucide-react";
import SafeImage from "@/components/SafeImage";

interface Product {
    id: string;
    name: string;
    brand: string;
    description: string;
    imageUrl: string;
    wholesalePrice: number;
    retailPrice: number;
    minimumOrderQuantity: number;
    unitsPerBox: number;
    stockQuantity: number;
    category: { id: string; name: string } | null;
}

export default function ProductPage() {
    const params = useParams();
    const router = useRouter();
    const [product, setProduct] = useState<Product | null>(null);
    const [loading, setLoading] = useState(true);
    const [quantity, setQuantity] = useState(0);
    const [message, setMessage] = useState("");
    const [adding, setAdding] = useState(false);

    const { addItem } = useCart();

    useEffect(() => {
        if (!params.slug) return;
        fetch(`/api/products/${params.slug}`)
            .then((r) => r.json())
            .then((json) => {
                if (json.success) {
                    setProduct(json.data);
                    setQuantity(json.data.minimumOrderQuantity);
                }
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, [params.slug]);

    const adjustQuantity = (delta: number) => {
        if (!product) return;
        const next = quantity + delta * product.unitsPerBox;
        if (next >= product.minimumOrderQuantity && next <= product.stockQuantity) {
            setQuantity(next);
        }
    };

    const handleAddToCart = () => {
        if (!product) return;
        setAdding(true);
        setMessage("");

        const result = addItem({
            id: product.id,
            name: product.name,
            brand: product.brand,
            imageUrl: product.imageUrl,
            wholesalePrice: product.wholesalePrice,
            unitsPerBox: product.unitsPerBox,
            minimumOrderQuantity: product.minimumOrderQuantity,
            stockQuantity: product.stockQuantity,
        }, quantity);

        if (result.success) {
            setMessage("Added to cart successfully!");
        } else {
            setMessage(result.error || "Failed to add to cart");
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

    if (!product) {
        return (
            <main className="pt-24 min-h-screen flex flex-col items-center justify-center gap-4">
                <h1 className="text-2xl font-serif text-gray-400">Product not found</h1>
                <Link href="/catalog" className="btn-primary">
                    Back to Shop
                </Link>
            </main>
        );
    }

    return (
        <main className="pt-24 pb-20 min-h-screen bg-[#FAFAF8]">
            <div className="max-w-7xl mx-auto px-6">
                {/* Header Actions */}
                <div className="flex items-center justify-between mb-12">
                    <Link href="/catalog" className="flex items-center gap-2 text-gray-400 hover:text-primary transition-all font-bold group text-sm uppercase tracking-widest">
                        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                        Back to Catalog
                    </Link>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
                    {/* Left: Fixed Image Container */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.8 }}
                        className="sticky top-32"
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
                            <div className="absolute top-8 right-8 bg-black/5 backdrop-blur-md px-4 py-2 rounded-full border border-black/5 flex items-center gap-2">
                                <ShieldCheck className="w-4 h-4 text-primary" />
                                <span className="text-[10px] font-black uppercase tracking-widest">Authentic</span>
                            </div>
                        </div>
                    </motion.div>

                    {/* Right: Content */}
                    <div className="flex flex-col">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.2 }}
                        >
                            <span className="inline-block px-4 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase tracking-[0.2em] mb-6">
                                {product.category?.name || "Premium Fragrance"}
                            </span>

                            <h1 className="text-5xl md:text-6xl font-serif text-gray-950 mb-4 leading-tight">
                                {product.name}
                            </h1>

                            <div className="flex items-center gap-4 mb-10">
                                <p className="text-xl text-gray-400 font-light font-serif italic">{product.brand}</p>
                                <div className="h-4 w-px bg-gray-200"></div>
                                {product.stockQuantity > 0 ? (
                                    <div className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${
                                        product.stockQuantity <= 10 ? "bg-amber-50 text-amber-600" : "bg-green-50 text-green-600"
                                    }`}>
                                        <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${
                                            product.stockQuantity <= 10 ? "bg-amber-500" : "bg-green-500"
                                        }`}></div>
                                        {product.stockQuantity <= 10 ? `Low Stock (${product.stockQuantity} left)` : "In Stock"}
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-red-50 text-red-600 text-[10px] font-black uppercase tracking-widest">
                                        <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>
                                        Out of Stock
                                    </div>
                                )}
                            </div>

                            <p className="text-lg text-gray-500 leading-relaxed font-light mb-12 max-w-xl">
                                {product.description}
                            </p>

                            {/* Price Card */}
                            <div className="bg-[#1A1A1A] rounded-[2.5rem] p-10 mb-12 text-white relative overflow-hidden group">
                                <div className="relative z-10">
                                    <p className="text-[#D4AF37] text-xs font-black uppercase tracking-[0.3em] mb-3">Wholesale Price</p>
                                    <div className="flex items-baseline gap-3 mb-8">
                                        <span className="text-5xl font-bold">{Number(product.wholesalePrice).toLocaleString()}</span>
                                        <span className="text-xl text-gray-500 font-serif">DA</span>
                                        <span className="ml-4 text-gray-500 line-through text-lg font-light">
                                            {Number(product.retailPrice).toLocaleString()} DA
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-3 gap-6">
                                        <div className="space-y-1">
                                            <p className="text-[9px] text-gray-500 font-black uppercase tracking-widest">Min. Units</p>
                                            <p className="text-lg font-bold flex items-center gap-2">
                                                <Package className="w-4 h-4 text-[#D4AF37]" />
                                                {product.minimumOrderQuantity}
                                            </p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-[9px] text-gray-500 font-black uppercase tracking-widest">Box Units</p>
                                            <p className="text-lg font-bold flex items-center gap-2">
                                                <Box className="w-4 h-4 text-[#D4AF37]" />
                                                {product.unitsPerBox}
                                            </p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-[9px] text-gray-500 font-black uppercase tracking-widest">Subtotal</p>
                                            <p className="text-lg font-bold text-[#D4AF37]">
                                                {(Number(product.wholesalePrice) * quantity).toLocaleString()} DA
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                <div className="absolute top-0 right-0 w-64 h-64 bg-[#D4AF37]/5 rounded-full blur-[100px] -mr-32 -mt-32"></div>
                            </div>

                            {/* Controls */}
                            <div className="space-y-8">
                                <div className="flex flex-wrap items-center gap-8">
                                    <div className="space-y-3">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Specify Bulk Quantity</p>
                                        <div className="flex items-center bg-white border border-gray-100 rounded-2xl p-1.5 shadow-sm">
                                            <button
                                                onClick={() => adjustQuantity(-1)}
                                                disabled={quantity <= product.minimumOrderQuantity}
                                                className="w-12 h-12 rounded-xl flex items-center justify-center text-gray-400 hover:bg-gray-50 disabled:opacity-30 transition-all font-bold text-xl"
                                            >
                                                −
                                            </button>
                                            <div className="px-8 text-center min-w-[100px]">
                                                <span className="block text-2xl font-bold text-gray-950">{quantity}</span>
                                                <span className="text-[8px] text-gray-400 font-black uppercase tracking-widest">Units Selected</span>
                                            </div>
                                            <button
                                                onClick={() => adjustQuantity(1)}
                                                disabled={quantity + product.unitsPerBox > product.stockQuantity}
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
                                        disabled={adding || product.stockQuantity === 0}
                                        className="w-full bg-primary text-white py-6 rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-primary-dark transition-all transform active:scale-[0.99] shadow-xl shadow-primary/20 disabled:opacity-50"
                                    >
                                        {adding ? (
                                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        ) : (
                                            <>
                                                <ShoppingCart className="w-5 h-5" />
                                                Add to Wholesale Cart
                                            </>
                                        )}
                                    </button>

                                    <div className="flex items-center gap-2 justify-center text-gray-400 text-[10px] font-medium uppercase tracking-[0.2em]">
                                        <Info className="w-3 h-3 text-primary" />
                                        Increments restricted to boxes of {product.unitsPerBox} units
                                    </div>
                                </div>
                            </div>

                            {message && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className={`mt-8 p-4 rounded-xl text-center text-sm font-bold ${message.includes("success") ? "bg-green-50 text-green-600 border border-green-100" : "bg-red-50 text-red-600 border border-red-100"
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
