import { requireCustomerSession } from "@/lib/customer-auth";
import { getOrderById } from "@/services/order-service";
import {
    ChevronRight,
    Package,
    Truck,
    CheckCircle2,
    Clock,
    ShieldCheck,
    Hash,
    Calendar,
    ArrowLeft,
    FileText,
    Boxes,
    ShoppingCart,
    MapPin
} from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import ReorderButton from "@/components/shop/ReorderButton";
import CancelOrderButton from "@/components/shop/CancelOrderButton";
import SafeImage from "@/components/SafeImage";

export const dynamic = "force-dynamic";

const STATUS_STEPS = ["PENDING", "CONFIRMED", "PACKED", "SHIPPED", "DELIVERED"];

export default async function OrderDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const customer = await requireCustomerSession();
    const order = await getOrderById(id);

    if (!order) notFound();
    if (order.customerId !== customer.id) redirect("/account/orders");

    const currentStepIndex = STATUS_STEPS.indexOf(order.status);
    const isCancelled = order.status === "CANCELLED";
    const canCancel = order.status === "PENDING";

    return (
        <div className="max-w-7xl mx-auto px-6 pt-32 pb-20">
            {/* Header / Breadcrumb */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                <div className="flex items-center gap-4">
                    <Link
                        href="/account/orders"
                        className="w-10 h-10 rounded-full border border-gray-100 flex items-center justify-center text-gray-400 hover:text-primary hover:border-primary/20 transition-all"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Order Information</span>
                            <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">#{order.id.slice(-8).toUpperCase()}</span>
                        </div>
                        <h1 className="text-3xl font-serif font-bold text-primary-dark">Shipment Tracking</h1>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <Link
                        href={`/api/invoices/${order.id}`} // Assuming invoice PDF download
                        className="flex items-center gap-2 px-5 py-2.5 rounded-full border border-gray-200 text-sm font-bold text-gray-600 hover:bg-gray-50 transition-all"
                    >
                        <FileText className="w-4 h-4" />
                        Download Invoice
                    </Link>
                    {canCancel && <CancelOrderButton orderId={order.id} />}
                    <ReorderButton orderId={order.id} />
                </div>
            </div>

            {/* Tracking Progress Bar */}
            <div className="bg-white p-8 md:p-12 rounded-3xl border border-gray-100 shadow-sm mb-12 relative overflow-hidden">
                {isCancelled ? (
                    <div className="flex flex-col items-center justify-center py-10 text-center">
                        <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center text-red-600 mb-4 animate-pulse">
                            <Truck className="w-10 h-10 opacity-20" />
                        </div>
                        <h3 className="text-2xl font-serif font-bold text-red-600">Order Cancelled</h3>
                        <p className="text-gray-500 mt-2 max-w-md">This order has been cancelled and inventory has been restored. If you believe this is an error, please contact support.</p>
                    </div>
                ) : (
                    <div className="relative">
                        {/* Progress Line */}
                        <div className="absolute top-1/2 left-0 w-full h-0.5 bg-gray-100 -translate-y-1/2 hidden md:block"></div>
                        <div
                            className="absolute top-1/2 left-0 h-0.5 bg-primary -translate-y-1/2 transition-all duration-1000 ease-out hidden md:block"
                            style={{ width: `${(currentStepIndex / (STATUS_STEPS.length - 1)) * 100}%` }}
                        ></div>

                        {/* Steps */}
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center relative z-10 gap-8 md:gap-0">
                            {STATUS_STEPS.map((step, index) => {
                                const isCompleted = index <= currentStepIndex;
                                const isActive = index === currentStepIndex;
                                const StepIcon = index === 0 ? Clock : index === 1 ? ShieldCheck : index === 2 ? Package : index === 3 ? Truck : CheckCircle2;

                                return (
                                    <div key={step} className="flex md:flex-col items-center gap-4 md:gap-4 relative group">
                                        <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-500 ${isCompleted ? "bg-primary text-white shadow-lg shadow-primary/30" : "bg-white border-2 border-gray-100 text-gray-300"
                                            } ${isActive ? "ring-4 ring-primary/10 scale-110" : ""}`}>
                                            <StepIcon className="w-5 h-5" />
                                        </div>
                                        <div className="text-left md:text-center">
                                            <p className={`text-[10px] font-black uppercase tracking-widest ${isCompleted ? "text-primary" : "text-gray-400"}`}>
                                                {step}
                                            </p>
                                            {isActive && (
                                                <p className="text-[9px] font-medium text-gray-400 mt-0.5 hidden md:block">Current Status</p>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Order Items */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
                            <h3 className="font-bold text-gray-900 flex items-center gap-2">
                                <Boxes className="w-5 h-5 text-primary" />
                                Products Ordered
                            </h3>
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{order.items.length} Items</span>
                        </div>
                        <div className="divide-y divide-gray-50">
                            {order.items.map((item) => (
                                <div key={item.id} className="p-6 flex items-center gap-6">
                                    <div className="w-20 h-20 bg-gray-50 rounded-2xl border border-gray-100 flex items-center justify-center overflow-hidden p-2 shrink-0">
                                        <SafeImage
                                            src={item.product.imageUrl}
                                            alt={item.product.name}
                                            fill
                                            className="object-contain"
                                        />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-bold text-gray-900 truncate">{item.product.name}</h4>
                                        <p className="text-xs text-gray-500 mt-1">{item.product.brand}</p>
                                        <div className="flex items-center gap-4 mt-3">
                                            <div className="bg-gray-100 px-3 py-1 rounded-full">
                                                <p className="text-[10px] font-bold text-gray-500">Qty: {item.quantity}</p>
                                            </div>
                                            <p className="text-sm font-bold text-gray-900">{Number(item.price).toLocaleString()} DA <span className="text-[10px] font-normal text-gray-400">/ unit</span></p>
                                        </div>
                                    </div>
                                    <div className="text-right hidden sm:block">
                                        <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Subtotal</p>
                                        <p className="text-lg font-bold text-primary">{(Number(item.price) * item.quantity).toLocaleString()} DA</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Summary Sidebar */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-[#1A1A1A] text-white p-8 rounded-3xl relative overflow-hidden group">
                        <h3 className="text-xl font-serif font-bold mb-8 italic flex items-center gap-2 relative z-10">
                            <ShoppingCart className="w-6 h-6 text-[#D4AF37]" />
                            Order Summary
                        </h3>

                        <div className="space-y-4 relative z-10">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-400">Subtotal</span>
                                <span className="font-bold">{Number(order.totalPrice).toLocaleString()} DA</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-400">Shipping</span>
                                <span className="font-bold text-[#D4AF37]">Free B2B</span>
                            </div>
                            <div className="h-px bg-white/10 my-6"></div>
                            <div className="flex justify-between items-end">
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#D4AF37] mb-1">Total Amount</p>
                                    <p className="text-4xl font-serif font-bold">{Number(order.totalPrice).toLocaleString()}</p>
                                </div>
                                <span className="text-xs text-gray-400 mb-1">DA</span>
                            </div>
                        </div>

                        {/* Background Decoration */}
                        <div className="absolute right-0 top-0 opacity-5 blur-3xl group-hover:opacity-10 transition-opacity">
                            <div className="w-48 h-48 bg-[#D4AF37] rounded-full translate-x-12 -translate-y-12"></div>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                        <h4 className="font-bold text-gray-900 mb-4 text-sm">Delivery Information</h4>
                        <div className="space-y-4 text-xs">
                            <div className="flex gap-3">
                                <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                <div>
                                    <p className="font-bold text-gray-900 mb-1">{customer.shopName}</p>
                                    <p className="text-gray-500 leading-relaxed">{customer.address}, {customer.wilaya}</p>
                                </div>
                            </div>
                            {order.trackingNumber && (
                                <div className="p-3 bg-blue-50 rounded-xl border border-blue-100">
                                    <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-1">Tracking Number</p>
                                    <p className="text-sm font-bold text-blue-900">{order.trackingNumber}</p>
                                    <p className="text-[10px] text-blue-400 mt-1">Status: Ship with {order.shippingCompany}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
