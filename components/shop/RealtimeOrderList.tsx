"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingBag, ArrowRight } from "lucide-react";
import { useRealtime } from "@/hooks/use-realtime";

interface Order {
    id: string;
    totalPrice: number;
    status: string;
    createdAt: string | Date;
}

interface RealtimeOrderListProps {
    initialOrders: any[];
    customerId: string;
}

// Map Supabase snake_case fields to camelCase
function mapRealtimeOrder(raw: Record<string, any>): Partial<Order> {
    return {
        id: raw.id,
        totalPrice: raw.total_price ?? raw.totalPrice,
        status: raw.status,
        createdAt: raw.created_at ?? raw.createdAt,
    };
}

export default function RealtimeOrderList({ initialOrders, customerId }: RealtimeOrderListProps) {
    const [orders, setOrders] = useState<Order[]>(initialOrders);

    useRealtime("orders", (payload: any) => {
        const mapped = mapRealtimeOrder(payload.new);

        // Check if this order belongs to the current customer
        const incomingCustomerId = payload.new.customer_id ?? payload.new.customerId;
        if (incomingCustomerId !== customerId) return;

        if (payload.eventType === "INSERT") {
            setOrders((prev) => [{ ...mapped as Order }, ...prev]);
        } else if (payload.eventType === "UPDATE") {
            setOrders((prev) =>
                prev.map((o) => (o.id === mapped.id ? { ...o, ...mapped } : o))
            );
        }
    });

    if (orders.length === 0) {
        return (
            <div className="p-16 text-center">
                <ShoppingBag className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                <p className="text-gray-500">No orders placed yet.</p>
                <Link href="/catalog" className="text-primary font-bold mt-4 inline-block">Start Shopping</Link>
            </div>
        );
    }

    return (
        <div className="divide-y divide-gray-50">
            <AnimatePresence mode="popLayout">
                {orders.slice(0, 5).map((order) => (
                    <motion.div
                        key={order.id}
                        layout
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        transition={{ duration: 0.3 }}
                    >
                        <Link
                            href={`/account/orders/${order.id}`}
                            className="flex items-center justify-between p-6 hover:bg-gray-50 transition-colors group"
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                                    <ShoppingBag className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-gray-900">Order #{order.id.slice(-6).toUpperCase()}</p>
                                    <p className="text-xs text-gray-400">{new Date(order.createdAt).toLocaleDateString()}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-6 text-right">
                                <div>
                                    <p className="text-sm font-bold text-gray-900">{Number(order.totalPrice).toLocaleString()} DA</p>
                                    <span className={`text-[10px] font-black uppercase tracking-widest ${order.status === "DELIVERED" ? "text-emerald-600" :
                                        order.status === "CANCELLED" ? "text-red-600" :
                                            "text-amber-500"
                                        }`}>
                                        {order.status}
                                    </span>
                                </div>
                                <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                            </div>
                        </Link>
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
}
