"use client";

import { useCart } from "@/context/CartContext";
import { motion, AnimatePresence } from "framer-motion";
import { X, ShoppingBag, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";
import SafeImage from "@/components/SafeImage";

export default function MiniCart() {
    const { isCartOpen, setIsCartOpen, items, totalQuantity, totalPrice } = useCart();

    // Prevent body scroll when open
    useEffect(() => {
        if (isCartOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "unset";
        }
        return () => {
            document.body.style.overflow = "unset";
        };
    }, [isCartOpen]);

    return (
        <AnimatePresence>
            {isCartOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsCartOpen(false)}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
                    />

                    {/* Drawer */}
                    <motion.div
                        initial={{ x: "100%" }}
                        animate={{ x: 0 }}
                        exit={{ x: "100%" }}
                        transition={{ type: "spring", damping: 25, stiffness: 200 }}
                        className="fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-2xl z-50 flex flex-col"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-6 border-b border-gray-100">
                            <h2 className="text-xl font-serif font-bold text-primary-dark flex items-center gap-2">
                                <ShoppingBag className="w-5 h-5" />
                                Your Cart
                                <span className="text-sm font-sans font-normal text-gray-400">({totalQuantity})</span>
                            </h2>
                            <button
                                onClick={() => setIsCartOpen(false)}
                                className="w-10 h-10 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-50 hover:text-gray-900 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Items */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-6">
                            {items.length === 0 ? (
                                <div className="text-center py-20">
                                    <ShoppingBag className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                                    <p className="text-gray-500 mb-6">Your cart is currently empty.</p>
                                    <button
                                        onClick={() => setIsCartOpen(false)}
                                        className="text-primary font-bold hover:text-primary-dark transition-colors"
                                    >
                                        Continue Shopping
                                    </button>
                                </div>
                            ) : (
                                items.map((item) => (
                                    <div key={item.id} className="flex gap-4 items-center">
                                        <div className="w-20 h-20 bg-gray-50 rounded-xl p-2 border border-gray-100 flex-shrink-0 relative">
                                            <SafeImage
                                                src={item.product.imageUrl}
                                                alt={item.product.name}
                                                fill
                                                className="object-contain"
                                            />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-bold text-gray-900 text-sm truncate">{item.product.name}</h3>
                                            <p className="text-xs text-gray-500 mb-1">{item.product.brand}</p>
                                            <div className="flex items-center justify-between mt-2">
                                                <p className="text-xs font-medium text-gray-500">Qty: {item.quantity}</p>
                                                <p className="text-sm font-bold text-primary">
                                                    {(Number(item.product.wholesalePrice) * item.quantity).toLocaleString()} DA
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Footer */}
                        {items.length > 0 && (
                            <div className="p-6 border-t border-gray-100 bg-gray-50">
                                <div className="flex justify-between items-end mb-6">
                                    <p className="text-gray-500 text-sm font-medium">Subtotal</p>
                                    <p className="text-2xl font-serif font-bold text-primary-dark">
                                        {totalPrice.toLocaleString()} <span className="text-sm text-gray-400 font-sans">DA</span>
                                    </p>
                                </div>
                                <div className="space-y-3">
                                    <Link
                                        href="/cart"
                                        onClick={() => setIsCartOpen(false)}
                                        className="flex items-center justify-center w-full py-3.5 bg-white border border-gray-200 text-gray-900 font-bold rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all"
                                    >
                                        View Cart
                                    </Link>
                                    <Link
                                        href="/checkout"
                                        onClick={() => setIsCartOpen(false)}
                                        className="flex items-center justify-center gap-2 w-full py-3.5 bg-primary text-white font-bold rounded-xl hover:bg-primary-dark transition-all shadow-lg shadow-primary/20 group"
                                    >
                                        Checkout Now
                                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                    </Link>
                                </div>
                            </div>
                        )}
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
