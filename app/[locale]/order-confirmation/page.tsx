"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";

export default function OrderConfirmationPage() {
    const router = useRouter();

    return (
        <main className="pt-24 pb-20 min-h-screen flex items-center justify-center bg-[#FAFAF8]">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="bg-white rounded-[2.5rem] p-12 text-center max-w-lg border border-gray-100 shadow-2xl shadow-gray-200/50 relative overflow-hidden group"
            >
                <div className="absolute top-0 right-0 w-64 h-64 bg-green-50 rounded-full blur-[100px] -mr-32 -mt-32 -z-10 transition-colors"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#D4AF37]/5 rounded-full blur-[100px] -ml-32 -mb-32 -z-10 transition-colors"></div>

                <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-8 text-green-500 shadow-inner">
                    <CheckCircle2 className="w-12 h-12" />
                </div>

                <h1 className="text-4xl font-serif text-gray-950 mb-4 tracking-tight">
                    Order Confirmed
                </h1>

                <p className="text-gray-500 mb-10 leading-relaxed font-light text-lg">
                    Thank you for your business. Your wholesale order has been received and is now being processed. We will notify you once it's shipped.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <button
                        onClick={() => router.push("/account/orders")}
                        className="bg-primary text-white px-8 py-4 rounded-xl font-bold flex-1 hover:bg-primary-dark transition-all shadow-lg shadow-primary/20"
                    >
                        View Orders
                    </button>
                    <button
                        onClick={() => router.push("/catalog")}
                        className="bg-white border text-gray-700 px-8 py-4 rounded-xl font-bold flex-1 hover:bg-gray-50 transition-all border-gray-200"
                    >
                        Continue Shopping
                    </button>
                </div>
            </motion.div>
        </main>
    );
}
