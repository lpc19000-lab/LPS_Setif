"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, XCircle, Info, X } from "lucide-react";

type ToastType = "success" | "error" | "info";

interface ToastItem {
    id: string;
    message: string;
    type: ToastType;
}

let toastListener: ((toast: ToastItem) => void) | null = null;

// Global function to show toasts from anywhere
export function showToast(message: string, type: ToastType = "info") {
    if (toastListener) {
        toastListener({
            id: Date.now().toString(),
            message,
            type,
        });
    }
}

const iconMap = {
    success: CheckCircle2,
    error: XCircle,
    info: Info,
};

const colorMap = {
    success: "bg-emerald-50 border-emerald-200 text-emerald-800",
    error: "bg-red-50 border-red-200 text-red-800",
    info: "bg-blue-50 border-blue-200 text-blue-800",
};

const iconColorMap = {
    success: "text-emerald-500",
    error: "text-red-500",
    info: "text-blue-500",
};

export default function ToastContainer() {
    const [toasts, setToasts] = useState<ToastItem[]>([]);

    const addToast = useCallback((toast: ToastItem) => {
        setToasts((prev) => [...prev, toast]);
        // Auto-remove after 4s
        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== toast.id));
        }, 4000);
    }, []);

    useEffect(() => {
        toastListener = addToast;
        return () => {
            toastListener = null;
        };
    }, [addToast]);

    const removeToast = (id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    };

    return (
        <div className="fixed bottom-6 right-6 z-[100] space-y-3 max-w-sm">
            <AnimatePresence mode="popLayout">
                {toasts.map((toast) => {
                    const Icon = iconMap[toast.type];
                    return (
                        <motion.div
                            key={toast.id}
                            layout
                            initial={{ opacity: 0, y: 20, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -10, scale: 0.95 }}
                            transition={{ duration: 0.25 }}
                            className={`flex items-start gap-3 p-4 rounded-xl border shadow-lg backdrop-blur-sm ${colorMap[toast.type]}`}
                        >
                            <Icon className={`w-5 h-5 mt-0.5 shrink-0 ${iconColorMap[toast.type]}`} />
                            <p className="text-sm font-medium flex-1">{toast.message}</p>
                            <button
                                onClick={() => removeToast(toast.id)}
                                className="shrink-0 opacity-50 hover:opacity-100 transition-opacity"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </motion.div>
                    );
                })}
            </AnimatePresence>
        </div>
    );
}
