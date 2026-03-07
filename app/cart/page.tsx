"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ShoppingBag, ChevronRight, Trash2, ArrowRight, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCart } from "@/context/CartContext";
import SafeImage from "@/components/SafeImage";



export default function CartPage() {
    const { items, totalPrice, updateQuantity, removeItem } = useCart();
    const [mounted, setMounted] = useState(false);
    const MIN_ORDER_BILL = 5000;
    const router = useRouter();

    useEffect(() => {
        setMounted(true);
    }, []);

    const handleUpdateQuantity = (cartItemId: string, newQuantity: number) => {
        const result = updateQuantity(cartItemId, newQuantity);
        if (!result.success && result.error) {
            alert(result.error);
        }
    };

    if (!mounted) {
        return (
            <main className="pt-24 min-h-screen flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </main>
        );
    }

    return (
        <main className="pt-24 pb-20 min-h-screen bg-[#FAFAF8]">
            <div className="max-w-7xl mx-auto px-6">
                <div className="flex items-center justify-between mb-10">
                    <h1 className="text-4xl font-serif text-primary-dark font-bold">
                        Wholesale Cart
                    </h1>
                    <Link href="/catalog" className="text-sm font-bold text-primary hover:text-primary-dark transition-colors flex items-center gap-1 group">
                        <ChevronRight className="w-4 h-4 rotate-180" />
                        Back to Catalog
                    </Link>
                </div>

                {items.length === 0 ? (
                    <div className="bg-white rounded-3xl border border-gray-100 p-20 text-center shadow-sm">
                        <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6 text-gray-200">
                            <ShoppingBag className="w-10 h-10" />
                        </div>
                        <h2 className="text-xl font-bold text-gray-900 mb-2">Your cart is empty</h2>
                        <p className="text-gray-500 mb-8 max-w-sm mx-auto">Fill your cart with the finest luxury perfumes for your wholesale business.</p>
                        <Link href="/catalog" className="bg-primary text-white px-8 py-3 rounded-full font-bold hover:bg-primary-dark transition-all shadow-lg shadow-primary/20">
                            Explore Catalog
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                        {/* Cart Items */}
                        <div className="lg:col-span-2 space-y-6">
                            {items.map((item, i) => (
                                <motion.div
                                    key={item.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.05 }}
                                    className="bg-white rounded-3xl p-6 flex items-center gap-6 border border-gray-100 shadow-sm relative group"
                                >
                                    <div className="w-28 h-28 rounded-2xl bg-gray-50 overflow-hidden flex-shrink-0 border border-gray-100 p-2">
                                        <SafeImage
                                            src={item.product.imageUrl || ""}
                                            alt={item.product.name}
                                            fill
                                            className="object-contain group-hover:scale-110 transition-transform duration-500"
                                        />
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between mb-4">
                                            <div>
                                                <h3 className="font-serif text-xl text-gray-900 font-bold truncate">
                                                    {item.product.name}
                                                </h3>
                                                <div className="flex items-center gap-3">
                                                    <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">{item.product.brand}</p>
                                                    <span className="w-1 h-3 border-l border-gray-200"></span>
                                                    <p className="text-[#D4AF37] text-[10px] font-black uppercase tracking-widest">
                                                        {item.product.selectedVolume}ml Edition
                                                    </p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => removeItem(item.id)}
                                                className="w-8 h-8 rounded-full flex items-center justify-center text-gray-300 hover:text-red-500 hover:bg-red-50 transition-all"
                                                aria-label="Remove item"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>

                                        <div className="flex flex-wrap items-center justify-between gap-4">
                                            <div className="flex items-center bg-gray-50 rounded-xl overflow-hidden border border-gray-100">
                                                <button
                                                    onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                                                    disabled={item.quantity <= 1}
                                                    className="px-4 py-2 text-gray-400 hover:text-primary disabled:opacity-30 transition-colors"
                                                >
                                                    −
                                                </button>
                                                <div className="px-4 py-2 text-center min-w-[80px]">
                                                    <span className="block text-sm font-black text-gray-900">{item.quantity}</span>
                                                    <span className="text-[7px] text-gray-400 uppercase font-black">Units of {item.product.selectedVolume}ml</span>
                                                </div>
                                                <button
                                                    onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                                                    className="px-4 py-2 text-gray-400 hover:text-primary transition-colors"
                                                >
                                                    +
                                                </button>
                                            </div>

                                            <div className="text-right">
                                                <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Subtotal</p>
                                                <p className="font-bold text-primary text-xl">
                                                    {(Number(item.product.basePrice) * item.quantity).toLocaleString()} DA
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>

                        {/* Order Summary */}
                        <div className="lg:col-span-1">
                            <div className="bg-[#1A1A1A] text-white rounded-[2.5rem] p-8 shadow-2xl shadow-gray-200 sticky top-28 overflow-hidden group">
                                <h2 className="text-2xl font-serif font-bold mb-8 italic flex items-center gap-2">
                                    <ShoppingBag className="w-6 h-6 text-[#D4AF37]" />
                                    Order Summary
                                </h2>

                                <div className="space-y-4 mb-8">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-400">Products Total</span>
                                        <span className="font-bold">{totalPrice.toLocaleString()} DA</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-400">Shipping Fees</span>
                                        <span className="text-[#D4AF37] font-bold">Standard B2B (Free)</span>
                                    </div>
                                    <div className="h-px bg-white/10 my-6"></div>
                                    <div className="flex justify-between items-end">
                                        <div>
                                            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#D4AF37] mb-1">Grand Total</p>
                                            <p className="text-4xl font-serif font-bold">{totalPrice.toLocaleString()}</p>
                                        </div>
                                        <span className="text-xs text-gray-400 mb-1">DA</span>
                                    </div>
                                    {totalPrice < MIN_ORDER_BILL && (
                                        <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
                                            <p className="text-[10px] text-red-400 font-bold uppercase tracking-wider">
                                                Minimum Order Required: {MIN_ORDER_BILL.toLocaleString()} DA
                                            </p>
                                            <p className="text-[9px] text-gray-400 mt-1">
                                                Please add {(MIN_ORDER_BILL - totalPrice).toLocaleString()} DA more to proceed.
                                            </p>
                                        </div>
                                    )}
                                </div>

                                <Link
                                    href={totalPrice >= MIN_ORDER_BILL ? "/checkout" : "#"}
                                    className={`block w-full text-center py-5 rounded-2xl font-bold transition-all transform active:scale-[0.98] shadow-lg ${totalPrice >= MIN_ORDER_BILL
                                        ? "bg-[#D4AF37] text-black hover:bg-white shadow-[#D4AF37]/10"
                                        : "bg-gray-800 text-gray-500 cursor-not-allowed opacity-50"
                                        }`}
                                    onClick={(e) => {
                                        if (totalPrice < MIN_ORDER_BILL) e.preventDefault();
                                    }}
                                >
                                    Proceed to Checkout
                                </Link>

                                <p className="text-[10px] text-gray-500 text-center mt-6 uppercase tracking-widest leading-relaxed">
                                    By proceeding, you agree to the <br /> B2B wholesale terms of service.
                                </p>

                                {/* Decoration */}
                                <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-[#D4AF37]/5 rounded-full blur-3xl group-hover:bg-[#D4AF37]/10 transition-colors"></div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </main>
    );
}
