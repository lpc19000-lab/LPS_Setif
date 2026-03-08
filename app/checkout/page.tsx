"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

import { useCart } from "@/context/CartContext";

export default function CheckoutPage() {
    const router = useRouter();
    const { items, totalPrice, clearCart } = useCart();
    const [mounted, setMounted] = useState(false);
    const [placing, setPlacing] = useState(false);
    const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
    const [errorMsg, setErrorMsg] = useState("");

    const [form, setForm] = useState({
        name: "",
        phone: "",
        city: "",
        address: "",
        notes: "",
    });

    useEffect(() => {
        setMounted(true);
    }, []);

    const MIN_ORDER_AMOUNT = 5000;
    const isValidOrder = totalPrice >= MIN_ORDER_AMOUNT;

    const placeOrder = async () => {
        setPlacing(true);
        setStatus("idle");
        setErrorMsg("");
        try {
            const orderItems = items.map((item) => ({
                productId: item.product.id,
                quantity: item.quantity,
                selectedVolume: item.product.selectedVolume,
            }));
            const res = await fetch("/api/orders", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ items: orderItems, shippingData: form }),
            });
            const json = await res.json();
            if (json.success) {
                clearCart();
                router.push("/order-confirmation");
            } else {
                setStatus("error");
                setErrorMsg(json.message || json.error || "Order failed");
            }
        } catch {
            setStatus("error");
            setErrorMsg("Network error. Please try again.");
        }
        setPlacing(false);
    };

    if (!mounted) {
        return (
            <main className="pt-24 min-h-screen flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            </main>
        );
    }

    if (status === "success") {
        return (
            <main className="pt-24 min-h-screen flex items-center justify-center bg-[#FAFAF8]">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-white rounded-2xl p-12 text-center max-w-md border border-gray-100 shadow-lg"
                >
                    <span className="text-5xl block mb-4">✓</span>
                    <h1 className="text-2xl font-serif text-primary-dark mb-3">
                        Order Placed!
                    </h1>
                    <p className="text-gray-500 mb-8">
                        Your order has been confirmed and an invoice has been generated.
                        We&apos;ll process it within 24 hours.
                    </p>
                    <div className="flex flex-col gap-3">
                        <button
                            onClick={() => router.push("/account/orders")}
                            className="btn-primary"
                        >
                            View Order History
                        </button>
                        <button
                            onClick={() => router.push("/catalog")}
                            className="text-gray-400 text-sm hover:text-primary transition-colors"
                        >
                            Continue Shopping
                        </button>
                    </div>
                </motion.div>
            </main>
        );
    }

    return (
        <main className="pt-24 pb-20 min-h-screen bg-[#FAFAF8]">
            <div className="max-w-3xl mx-auto px-6">
                <h1 className="text-3xl md:text-4xl font-serif text-primary-dark mb-8">
                    Checkout
                </h1>

                {items.length === 0 ? (
                    <div className="text-center py-20">
                        <p className="text-gray-400 text-lg mb-4">No items to checkout</p>
                        <button onClick={() => router.push("/catalog")} className="btn-primary">
                            Browse Products
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                        {/* Order Details Column */}
                        <div className="space-y-6">
                            <div className="bg-white rounded-xl p-6 border border-gray-100">
                                <h2 className="font-serif text-lg text-gray-800 mb-4">Shipping Details</h2>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm text-gray-500 mb-1">Company / Name *</label>
                                        <input
                                            type="text"
                                            required
                                            value={form.name}
                                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                                            className="input-luxury w-full"
                                            placeholder="Your name or shop name"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm text-gray-500 mb-1">Phone *</label>
                                            <input
                                                type="text"
                                                required
                                                value={form.phone}
                                                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                                                className="input-luxury w-full"
                                                placeholder="e.g. 0555..."
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm text-gray-500 mb-1">City (Wilaya) *</label>
                                            <input
                                                type="text"
                                                required
                                                value={form.city}
                                                onChange={(e) => setForm({ ...form, city: e.target.value })}
                                                className="input-luxury w-full"
                                                placeholder="City"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm text-gray-500 mb-1">Address *</label>
                                        <input
                                            type="text"
                                            required
                                            value={form.address}
                                            onChange={(e) => setForm({ ...form, address: e.target.value })}
                                            className="input-luxury w-full"
                                            placeholder="Detailed shipping address"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm text-gray-500 mb-1">Order Notes (Optional)</label>
                                        <textarea
                                            value={form.notes}
                                            onChange={(e) => setForm({ ...form, notes: e.target.value })}
                                            className="input-luxury w-full min-h-[100px]"
                                            placeholder="Any special instructions for picking, packing or delivery..."
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Order Summary Column */}
                        <div className="space-y-6">
                            {/* Order Items */}
                            <div className="bg-white rounded-xl p-6 border border-gray-100">
                                <h2 className="font-serif text-lg text-gray-800 mb-4">Order Summary</h2>
                                <div className="divide-y divide-gray-50 max-h-60 overflow-y-auto pr-2">
                                    {items.map((item) => (
                                        <div
                                            key={item.id}
                                            className="flex justify-between items-center py-3"
                                        >
                                            <div>
                                                <p className="text-gray-800 font-medium">
                                                    {item.product.name}
                                                </p>
                                                <p className="text-gray-400 text-sm">
                                                    Qty: {item.quantity} × {Number(item.product.basePrice).toLocaleString()} DA
                                                </p>
                                            </div>
                                            <p className="font-bold text-gray-700">
                                                {(
                                                    Number(item.product.basePrice) * item.quantity
                                                ).toLocaleString()}{" "}
                                                DA
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="bg-white rounded-xl p-6 border border-gray-100">
                                <div className="flex justify-between items-center text-lg mb-4">
                                    <span className="font-serif text-gray-800">Total</span>
                                    <span className="font-bold text-primary-dark text-2xl">
                                        {totalPrice.toLocaleString()} DA
                                    </span>
                                </div>
                                <div className="text-sm">
                                    {isValidOrder ? (
                                        <p className="text-green-600 font-medium">✓ Minimum order amount met</p>
                                    ) : (
                                        <p className="text-red-500 font-medium">
                                            Minimum order amount is 5,000 DA. You need {(MIN_ORDER_AMOUNT - totalPrice).toLocaleString()} DA more.
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Error */}
                            {status === "error" && (
                                <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-600 text-sm">
                                    {errorMsg}
                                </div>
                            )}

                            {/* Place Order */}
                            <button
                                onClick={placeOrder}
                                disabled={placing || !isValidOrder || !form.name || !form.phone || !form.city || !form.address}
                                className="btn-primary w-full text-center text-lg py-4 disabled:opacity-50"
                            >
                                {placing ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        Processing...
                                    </span>
                                ) : (
                                    "Place Order"
                                )}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </main>
    );
}
