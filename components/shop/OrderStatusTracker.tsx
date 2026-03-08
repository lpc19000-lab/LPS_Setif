"use client";

import { CheckCircle2, Clock, Package, Truck, XCircle } from "lucide-react";

interface OrderStatusTrackerProps {
    currentStatus: string;
}

const STEPS = [
    { key: "PENDING", label: "Pending", icon: Clock },
    { key: "CONFIRMED", label: "Confirmed", icon: CheckCircle2 },
    { key: "PACKED", label: "Packed", icon: Package },
    { key: "SHIPPED", label: "Shipped", icon: Truck },
    { key: "DELIVERED", label: "Delivered", icon: CheckCircle2 },
];

const STATUS_ORDER: Record<string, number> = {
    PENDING: 0,
    CONFIRMED: 1,
    PREPARING: 1,
    PROCESSING: 1,
    PACKED: 2,
    SHIPPED: 3,
    DELIVERED: 4,
    CANCELLED: -1,
};

export default function OrderStatusTracker({ currentStatus }: OrderStatusTrackerProps) {
    const currentIndex = STATUS_ORDER[currentStatus] ?? 0;
    const isCancelled = currentStatus === "CANCELLED";

    if (isCancelled) {
        return (
            <div className="bg-red-50 border border-red-100 rounded-2xl p-6">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                        <XCircle className="w-5 h-5 text-red-500" />
                    </div>
                    <div>
                        <p className="font-bold text-red-600 text-sm">Order Cancelled</p>
                        <p className="text-red-400 text-xs">This order has been cancelled.</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-6">
                Order Progress
            </p>

            {/* Desktop tracker */}
            <div className="hidden sm:block">
                <div className="flex items-center justify-between relative">
                    {/* Progress line */}
                    <div className="absolute top-5 left-0 right-0 h-0.5 bg-gray-100 z-0" />
                    <div
                        className="absolute top-5 left-0 h-0.5 bg-primary transition-all duration-700 z-0"
                        style={{ width: `${(currentIndex / (STEPS.length - 1)) * 100}%` }}
                    />

                    {STEPS.map((step, i) => {
                        const isComplete = i <= currentIndex;
                        const isCurrent = i === currentIndex;
                        const StepIcon = step.icon;

                        return (
                            <div key={step.key} className="flex flex-col items-center relative z-10">
                                <div
                                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-500 ${isComplete
                                            ? "bg-primary text-white shadow-lg shadow-primary/20"
                                            : "bg-gray-100 text-gray-300"
                                        } ${isCurrent ? "ring-4 ring-primary/20 scale-110" : ""}`}
                                >
                                    <StepIcon className="w-4 h-4" />
                                </div>
                                <p
                                    className={`mt-2 text-[10px] font-bold uppercase tracking-widest ${isComplete ? "text-primary" : "text-gray-300"
                                        }`}
                                >
                                    {step.label}
                                </p>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Mobile tracker */}
            <div className="sm:hidden space-y-3">
                {STEPS.map((step, i) => {
                    const isComplete = i <= currentIndex;
                    const isCurrent = i === currentIndex;
                    const StepIcon = step.icon;

                    return (
                        <div key={step.key} className="flex items-center gap-3">
                            <div className="flex flex-col items-center">
                                <div
                                    className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${isComplete
                                            ? "bg-primary text-white"
                                            : "bg-gray-100 text-gray-300"
                                        } ${isCurrent ? "ring-2 ring-primary/20" : ""}`}
                                >
                                    <StepIcon className="w-3.5 h-3.5" />
                                </div>
                                {i < STEPS.length - 1 && (
                                    <div
                                        className={`w-0.5 h-4 ${i < currentIndex ? "bg-primary" : "bg-gray-100"
                                            }`}
                                    />
                                )}
                            </div>
                            <p
                                className={`text-xs font-bold ${isComplete ? "text-gray-900" : "text-gray-300"
                                    } ${isCurrent ? "text-primary" : ""}`}
                            >
                                {step.label}
                            </p>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
