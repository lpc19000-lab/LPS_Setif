"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Search, ChevronDown, CheckCircle2, Clock, Truck, PackageCheck, XCircle, FileText, X, AlertCircle, Trash2, MapPin, Navigation } from "lucide-react";
import { adminUpdateOrderStatus, updateOrderPayment, generateInvoiceAction, deleteOrderAction } from "@/app/admin/actions/order";
import { OrderStatus } from "@/lib/constants";
import SafeImage from "@/components/SafeImage";
import { useTranslations, useLocale } from "next-intl";

export default function OrderClientView({ orders }: { orders: any[] }) {
    const router = useRouter();
    const [search, setSearch] = useState("");
    const [filterStatus, setFilterStatus] = useState<string>("ALL");
    const [updatingId, setUpdatingId] = useState<string | null>(null);
    const [updatingPaymentId, setUpdatingPaymentId] = useState<string | null>(null);
    const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
    const t = useTranslations("admin.orders");
    const tStatus = useTranslations("common.status");
    const locale = useLocale();
    const isRtl = locale === 'ar';

    useEffect(() => {
        const interval = setInterval(() => {
            router.refresh();
        }, 15000);
        return () => clearInterval(interval);
    }, [router]);

    const filteredOrders = orders.filter(o => {
        const searchLower = search.toLowerCase().trim();
        const matchesStatus = filterStatus === "ALL" || o.status === filterStatus;
        if (!searchLower) return matchesStatus;

        const searchTerms = searchLower.split(/\s+/);
        const searchableText = `${o.id} ${o.customer.shopName} ${o.customer.name} ${o.customer.phone} ${o.customer.wilaya}`.toLowerCase();
        
        const matchesSearch = searchTerms.every(term => searchableText.includes(term));
        return matchesSearch && matchesStatus;
    });

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat(locale === "ar" ? "ar-DZ" : "fr-FR", { style: "currency", currency: "DZD" }).format(amount).replace("DZD", "DA");
    };

    const formatDate = (dateString: string) => {
        return new Intl.DateTimeFormat(locale === "ar" ? "ar-DZ" : "fr-FR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(dateString));
    };

    const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
        if (!confirm(t("update_confirm", { status: tStatus(newStatus) }))) return;
        setUpdatingId(orderId);
        const res = await adminUpdateOrderStatus(orderId, newStatus);
        setUpdatingId(null);
        if (res.success && selectedOrder?.id === orderId) {
            setSelectedOrder({ ...selectedOrder, status: newStatus });
        }
        if (!res.success) alert(res.error);
    };

    const handleGenerateInvoice = async (orderId: string, amount: number) => {
        if (!confirm("Voulez-vous générer la facture officielle pour cette commande ?")) return;
        const res = await generateInvoiceAction(orderId, amount);
        if (res.success) router.refresh();
        else alert(res.error || "Failed to generate invoice");
    };

    const handleDeleteOrder = async (orderId: string) => {
        if (!confirm("Voulez-vous vraiment supprimer cette commande ? Cette action est irréversible.")) return;
        setUpdatingId(orderId);
        const res = await deleteOrderAction(orderId);
        setUpdatingId(null);
        if (res.success) router.refresh();
        else alert(res.error || "Échec de la suppression");
    };

    const handlePaymentUpdate = async (orderId: string, currentPaid: number) => {
        const amountStr = window.prompt("Enter total amount paid (DZD):", currentPaid.toString());
        if (amountStr === null) return;
        const amount = parseFloat(amountStr);
        if (isNaN(amount) || amount < 0) return alert("Please enter a valid amount");
        
        setUpdatingPaymentId(orderId);
        const res = await updateOrderPayment(orderId, amount);
        setUpdatingPaymentId(null);
        if (res.success) {
            setSelectedOrder(null);
            router.refresh();
        } else alert(res.error);
    };

    const StatusBadge = ({ status }: { status: string }) => {
        switch (status) {
            case "PENDING": return <span className="flex items-center gap-1 px-2.5 py-1 bg-amber-50 text-amber-700 rounded-lg text-xs font-bold w-fit"><Clock className="w-3.5 h-3.5" /> {tStatus("PENDING")}</span>;
            case "CONFIRMED": return <span className="flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-700 rounded-lg text-xs font-bold w-fit"><CheckCircle2 className="w-3.5 h-3.5" /> {tStatus("CONFIRMED")}</span>;
            case "PROCESSING": return <span className="flex items-center gap-1 px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-lg text-xs font-bold w-fit"><PackageCheck className="w-3.5 h-3.5" /> {tStatus("PACKED")}</span>;
            case "SHIPPED": return <span className="flex items-center gap-1 px-2.5 py-1 bg-purple-50 text-purple-700 rounded-lg text-xs font-bold w-fit"><Truck className="w-3.5 h-3.5" /> {tStatus("SHIPPED")}</span>;
            case "DELIVERED": return <span className="flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-bold w-fit"><CheckCircle2 className="w-3.5 h-3.5" /> {tStatus("DELIVERED")}</span>;
            case "CANCELLED": return <span className="flex items-center gap-1 px-2.5 py-1 bg-red-50 text-red-700 rounded-lg text-xs font-bold w-fit"><XCircle className="w-3.5 h-3.5" /> {tStatus("CANCELLED")}</span>;
            default: return <span>{status}</span>;
        }
    };

    // Shipping Timeline Component
    const ShippingTimeline = ({ currentStatus }: { currentStatus: string }) => {
        const steps = [
            { id: "PENDING", label: tStatus("PENDING"), icon: Clock },
            { id: "CONFIRMED", label: tStatus("CONFIRMED"), icon: CheckCircle2 },
            { id: "PROCESSING", label: tStatus("PACKED"), icon: PackageCheck },
            { id: "SHIPPED", label: tStatus("SHIPPED"), icon: Truck },
            { id: "DELIVERED", label: tStatus("DELIVERED"), icon: CheckCircle2 },
        ];
        
        let activeIdx = steps.findIndex(s => s.id === currentStatus);
        if (currentStatus === "CANCELLED") activeIdx = -1;

        return (
            <div className="py-6 px-4 bg-white rounded-2xl border border-gray-100 shadow-sm">
                <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                    <Navigation className="w-4 h-4 text-primary" /> {isRtl ? 'حالة الشحن' : 'Shipping Status Workflow'}
                </h4>
                <div className="flex items-center justify-between relative">
                    <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-100 -translate-y-1/2 rounded-full z-0"></div>
                    <div 
                        className="absolute top-1/2 left-0 h-1 bg-emerald-500 -translate-y-1/2 rounded-full z-0 transition-all duration-500"
                        style={{ width: activeIdx >= 0 ? `${(activeIdx / (steps.length - 1)) * 100}%` : '0%' }}
                    ></div>
                    
                    {steps.map((step, idx) => {
                        const isActive = currentStatus === step.id;
                        const isPast = activeIdx > idx;
                        const StepIcon = step.icon;
                        
                        return (
                            <div key={step.id} className="relative z-10 flex flex-col items-center gap-2">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center border-4 border-white shadow-sm transition-colors duration-300 ${isActive ? 'bg-primary text-white scale-110' : isPast ? 'bg-emerald-500 text-white' : 'bg-gray-100 text-gray-400'}`}>
                                    <StepIcon className="w-4 h-4" />
                                </div>
                                <span className={`text-[10px] font-bold uppercase tracking-wider hidden sm:block ${isActive ? 'text-primary' : isPast ? 'text-emerald-600' : 'text-gray-400'}`}>{step.label}</span>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 rtl:left-auto rtl:right-3" />
                    <input
                        type="text"
                        placeholder={t("search_placeholder")}
                        className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/30 shadow-sm rtl:pl-4 rtl:pr-10"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
                    {["ALL", "PENDING", "PROCESSING", "SHIPPED", "DELIVERED"].map((status) => (
                        <button
                            key={status}
                            onClick={() => setFilterStatus(status)}
                            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-colors ${
                                filterStatus === status ? "bg-primary-dark text-white shadow-md shadow-primary/20" : "bg-white text-gray-500 hover:bg-gray-50 border border-gray-200"
                            }`}
                        >
                            {status === "ALL" ? (isRtl ? "الكل" : "All Orders") : tStatus(status)}
                        </button>
                    ))}
                </div>
            </div>

            {/* Mobile Card View (Hidden on medium+ screens) */}
            <div className="grid grid-cols-1 gap-4 md:hidden">
                {filteredOrders.map((order) => (
                    <div key={order.id} className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5 space-y-4">
                        <div className="flex justify-between items-start">
                            <div>
                                <div className="font-mono text-xs font-bold text-gray-400">#{order.id.slice(0, 8).toUpperCase()}</div>
                                <div className="text-lg font-serif font-bold text-gray-900 mt-1">{order.customer.shopName}</div>
                                <div className="text-xs text-gray-500">{formatDate(order.createdAt)}</div>
                            </div>
                            <StatusBadge status={order.status} />
                        </div>
                        
                        <div className="flex items-center gap-2 text-xs text-gray-600 bg-gray-50 p-3 rounded-xl border border-gray-100">
                            <MapPin className="w-4 h-4 text-primary shrink-0" />
                            <span className="truncate">{order.customer.wilaya}</span>
                        </div>

                        <div className="flex items-center justify-between border-t border-gray-50 pt-4">
                            <div>
                                <div className="text-[10px] font-black uppercase text-gray-400 tracking-wider mb-1">Total</div>
                                <div className="font-bold text-primary-dark">{formatCurrency(order.totalPrice)}</div>
                            </div>
                            <button 
                                onClick={() => setSelectedOrder(order)}
                                className="px-5 py-2.5 bg-primary/10 text-primary hover:bg-primary/20 rounded-xl text-xs font-bold uppercase tracking-widest transition-colors"
                            >
                                {isRtl ? 'إدارة الطلب' : 'Manage'}
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Desktop Table View (Hidden on small screens) */}
            <div className="hidden md:block bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden min-h-[400px]">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50/50 border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">{t("table.order_details")}</th>
                                <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">{t("table.customer_info")}</th>
                                <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">{t("table.total_amount")}</th>
                                <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Payment</th>
                                <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">{t("table.status_action")}</th>
                                <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right rtl:text-left">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {filteredOrders.map((order) => (
                                <tr key={order.id} className="hover:bg-primary/5 transition-colors group">
                                    <td className="px-6 py-5">
                                        <div className="font-mono text-xs font-bold text-gray-400 group-hover:text-primary transition-colors">#{order.id.slice(0, 8).toUpperCase()}</div>
                                        <div className="text-xs font-medium text-gray-900 mt-1">{formatDate(order.createdAt)}</div>
                                        <div className="text-xs text-primary mt-1 cursor-pointer hover:underline font-medium" onClick={() => setSelectedOrder(order)}>
                                            {t("items_count", { count: order.items.length })}
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="font-bold text-gray-900">{order.customer.shopName}</div>
                                        <div className="text-xs text-gray-500 mt-0.5">{order.customer.name} | {order.customer.wilaya}</div>
                                    </td>
                                    <td className="px-6 py-5 font-bold text-primary-dark">
                                        {formatCurrency(order.totalPrice)}
                                    </td>
                                    <td className="px-6 py-5">
                                        {order.paymentStatus === "PAID" ? (
                                            <span className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-lg text-[10px] font-black uppercase tracking-widest w-fit"><CheckCircle2 className="w-3.5 h-3.5" /> Paid</span>
                                        ) : order.paymentStatus === "PARTIAL" ? (
                                            <span className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 text-amber-700 rounded-lg text-[10px] font-black uppercase tracking-widest w-fit"><AlertCircle className="w-3.5 h-3.5" /> Partial</span>
                                        ) : (
                                            <span className="flex items-center gap-1.5 px-2.5 py-1 bg-red-50 text-red-700 rounded-lg text-[10px] font-black uppercase tracking-widest w-fit"><Clock className="w-3.5 h-3.5" /> Unpaid</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-5">
                                        <StatusBadge status={order.status} />
                                    </td>
                                    <td className="px-6 py-5 text-right rtl:text-left">
                                        <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button 
                                                onClick={() => setSelectedOrder(order)}
                                                className="px-4 py-2 bg-white border border-gray-200 hover:border-primary/40 text-primary rounded-xl text-[10px] font-black uppercase tracking-widest transition-all hover:shadow-sm"
                                            >
                                                Manage
                                            </button>
                                            <button
                                                onClick={() => handleDeleteOrder(order.id)}
                                                disabled={updatingId === order.id}
                                                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors disabled:opacity-50 border border-transparent hover:border-red-100"
                                                title="Delete Order"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {filteredOrders.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="px-6 py-16 text-center text-gray-500 font-medium">
                                        {t("no_orders")}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Manage Order Modal */}
            {selectedOrder && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
                    <div className="bg-[#FDFBF7] rounded-[2rem] w-full max-w-3xl overflow-hidden shadow-2xl relative flex flex-col max-h-[95vh] border border-white/20">
                        {/* Modal Header */}
                        <div className="px-8 py-6 flex items-center justify-between border-b border-gray-100 bg-white shrink-0">
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900 font-serif flex items-center gap-3">
                                    {t("modal.title")}
                                    <span className="text-xs font-mono font-bold text-primary bg-primary/10 px-3 py-1 rounded-full">#{selectedOrder.id.split('-')[0].toUpperCase()}</span>
                                </h2>
                            </div>
                            <button onClick={() => setSelectedOrder(null)} className="p-2.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors bg-gray-50 border border-gray-100">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-8 overflow-y-auto space-y-8">
                            
                            {/* Shipping Workflow Tracker */}
                            <ShippingTimeline currentStatus={selectedOrder.status} />

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Customer Info Card */}
                                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-bl-[100px] pointer-events-none" />
                                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">{t("modal.customer")}</h4>
                                    <p className="text-xl font-serif font-bold text-primary-dark mb-1">{selectedOrder.customer.shopName}</p>
                                    <p className="text-sm font-bold text-gray-700 mb-4">{selectedOrder.customer.name} | {selectedOrder.customer.phone}</p>
                                    <div className="flex items-start gap-2 text-xs text-gray-500 bg-gray-50 p-3 rounded-xl">
                                        <MapPin className="w-4 h-4 text-[#D4AF37] shrink-0" />
                                        <span>{selectedOrder.customer.address}, {selectedOrder.customer.wilaya}</span>
                                    </div>
                                </div>

                                {/* Order Actions Card */}
                                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Verification & Status</h4>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="text-xs font-bold text-gray-700 block mb-2">Update Shipping Status</label>
                                            <div className="relative">
                                                <select
                                                    className="w-full appearance-none bg-gray-50 border border-gray-200 text-sm font-bold rounded-xl pl-4 pr-10 py-3 focus:outline-none focus:ring-2 focus:ring-primary/30 text-gray-700 cursor-pointer disabled:opacity-50 transition-colors hover:border-primary/40"
                                                    value={selectedOrder.status}
                                                    onChange={(e) => handleStatusChange(selectedOrder.id, e.target.value as OrderStatus)}
                                                    disabled={updatingId === selectedOrder.id}
                                                >
                                                    {Object.keys(OrderStatus).map(status => (
                                                        <option key={status} value={status}>{tStatus(status)}</option>
                                                    ))}
                                                </select>
                                                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                                            </div>
                                        </div>
                                        
                                        <div className="pt-2 border-t border-gray-100">
                                            {selectedOrder.invoice ? (
                                                <div className="flex justify-between items-center bg-blue-50/50 p-3 rounded-xl border border-blue-100">
                                                    <div>
                                                        <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Invoice Issued</p>
                                                        <p className="text-xs font-mono font-bold text-blue-700">{selectedOrder.invoice.invoiceNumber}</p>
                                                    </div>
                                                    <Link 
                                                        href={`/${locale}/admin/orders/${encodeURIComponent(selectedOrder.id)}/invoice/print`}
                                                        target="_blank"
                                                        className="px-4 py-2 bg-blue-600 text-white rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition-colors flex items-center gap-1"
                                                    >
                                                        <FileText className="w-3.5 h-3.5" /> Print
                                                    </Link>
                                                </div>
                                            ) : (
                                                <button 
                                                    onClick={() => handleGenerateInvoice(selectedOrder.id, selectedOrder.totalPrice)}
                                                    className="w-full py-3 bg-gray-900 text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-black transition-colors flex items-center justify-center gap-2"
                                                >
                                                    <FileText className="w-4 h-4 text-[#D4AF37]" /> {t("generate_invoice_btn") || "Issue Invoice"}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Products List */}
                            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                                <div className="px-6 py-4 bg-gray-50/50 border-b border-gray-100">
                                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t("modal.items_included")}</h4>
                                </div>
                                <div className="divide-y divide-gray-50">
                                    {selectedOrder.items.map((item: any, idx: number) => (
                                        <div key={idx} className="flex items-center justify-between p-4 hover:bg-gray-50/50 transition-colors">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 bg-gray-100 rounded-xl overflow-hidden relative shrink-0 border border-gray-200">
                                                    <SafeImage src={item.product?.imageUrl || ''} alt={"Product"} fill className="object-cover" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-gray-900">{item.product?.name || t("modal.unknown_product")}</p>
                                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-0.5">{item.product?.brand}</p>
                                                    {item.volume && (
                                                        <p className="text-[10px] font-bold text-primary uppercase tracking-wider mt-0.5">
                                                            {(() => {
                                                                const weight = item.volume.weight || (typeof item.volume.id === 'string' && item.volume.id.startsWith('v') ? parseInt(item.volume.id.replace('v', '')) : null);
                                                                if (!weight) return null;
                                                                return weight >= 1000 ? `${weight / 1000}kg` : `${weight}g`;
                                                            })()}
                                                        </p>
                                                    )}
                                                    <p className="text-xs text-primary font-bold mt-1">{formatCurrency(item.price)} <span className="text-gray-400 font-medium">× {item.quantity}</span></p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm font-bold text-primary-dark">{formatCurrency(item.price * item.quantity)}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Payment summary */}
                            <div className="bg-primary-dark text-white p-8 rounded-3xl relative overflow-hidden shadow-2xl shadow-primary/20">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -translate-y-32 translate-x-32" />
                                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                                    <div>
                                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#D4AF37] block mb-2">{t("modal.total_validated")}</span>
                                        <span className="text-4xl font-serif font-bold">{formatCurrency(selectedOrder.totalPrice)}</span>
                                        <p className="text-xs text-white/50 mt-2 font-medium bg-white/5 inline-block px-3 py-1 rounded-full uppercase tracking-wider border border-white/5">Yalidine Delivery : Calculated at receipt</p>
                                    </div>
                                    
                                    <div className="w-full md:w-auto grid grid-cols-2 gap-4">
                                        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-md relative group">
                                            <p className="text-[9px] font-black text-white/40 uppercase tracking-widest mb-1">Paid Amount</p>
                                            <p className="text-lg font-bold text-emerald-400">{formatCurrency(selectedOrder.amountPaid || 0)}</p>
                                            <button 
                                                onClick={() => handlePaymentUpdate(selectedOrder.id, selectedOrder.amountPaid || 0)}
                                                disabled={updatingPaymentId === selectedOrder.id}
                                                className="absolute inset-0 bg-primary/90 text-white text-[10px] font-bold items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl flex tracking-widest uppercase"
                                            >
                                                {updatingPaymentId === selectedOrder.id ? "..." : "RECORD PAYMENT"}
                                            </button>
                                        </div>
                                        <div className="bg-black/20 border border-white/5 rounded-2xl p-4 backdrop-blur-md">
                                            <p className="text-[9px] font-black text-white/40 uppercase tracking-widest mb-1">Balance Due</p>
                                            <p className={`text-lg font-bold ${(selectedOrder.totalPrice - (selectedOrder.amountPaid || 0)) > 0 ? 'text-red-400' : 'text-white/40'}`}>{formatCurrency(Math.max(0, selectedOrder.totalPrice - (selectedOrder.amountPaid || 0)))}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
