"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search, ChevronDown, CheckCircle2, Clock, Truck, PackageCheck, XCircle, FileText, X, DollarSign, AlertCircle } from "lucide-react";
import { adminUpdateOrderStatus, updateOrderPayment } from "@/app/admin/actions/order";
import { OrderStatus } from "@/lib/constants";
import SafeImage from "@/components/SafeImage";
import { useTranslations, useLocale } from "next-intl";

export default function OrderClientView({ orders }: { orders: any[] }) {
    const router = useRouter();
    const [search, setSearch] = useState("");
    const [updatingId, setUpdatingId] = useState<string | null>(null);
    const [updatingPaymentId, setUpdatingPaymentId] = useState<string | null>(null);
    const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
    const t = useTranslations("admin.orders");
    const tStatus = useTranslations("common.status");
    const locale = useLocale();

    // Dynamic data refreshing (Polling) for real-time feel
    useEffect(() => {
        const interval = setInterval(() => {
            router.refresh();
        }, 15000); // Poll every 15s to keep it fresh
        return () => clearInterval(interval);
    }, [router]);

    const filteredOrders = orders.filter(o =>
        o.id.toLowerCase().includes(search.toLowerCase()) ||
        o.customer.shopName.toLowerCase().includes(search.toLowerCase())
    );

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

        if (!res.success) alert(res.error);
    };

    const handlePaymentUpdate = async (orderId: string, currentPaid: number) => {
        const amountStr = window.prompt("Enter total amount paid (DZD):", currentPaid.toString());
        if (amountStr === null) return;
        
        const amount = parseFloat(amountStr);
        if (isNaN(amount) || amount < 0) {
            alert("Please enter a valid amount");
            return;
        }

        setUpdatingPaymentId(orderId);
        const res = await updateOrderPayment(orderId, amount);
        setUpdatingPaymentId(null);

        if (res.success) {
            // Close modal and refresh to see changes
            setSelectedOrder(null);
            router.refresh();
        } else {
            alert(res.error);
        }
    };

    const StatusBadge = ({ status }: { status: string }) => {
        switch (status) {
            case "PENDING": return <span className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 text-amber-700 rounded-lg text-xs font-medium"><Clock className="w-3.5 h-3.5" /> {tStatus("PENDING")}</span>;
            case "CONFIRMED": return <span className="flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 text-blue-700 rounded-lg text-xs font-medium"><CheckCircle2 className="w-3.5 h-3.5" /> {tStatus("CONFIRMED")}</span>;
            case "PROCESSING": return <span className="flex items-center gap-1.5 px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-lg text-xs font-medium"><PackageCheck className="w-3.5 h-3.5" /> {tStatus("PACKED")}</span>; // Using PACKED as fallback for PROCESSING
            case "SHIPPED": return <span className="flex items-center gap-1.5 px-2.5 py-1 bg-purple-50 text-purple-700 rounded-lg text-xs font-medium"><Truck className="w-3.5 h-3.5" /> {tStatus("SHIPPED")}</span>;
            case "DELIVERED": return <span className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-medium"><CheckCircle2 className="w-3.5 h-3.5" /> {tStatus("DELIVERED")}</span>;
            case "CANCELLED": return <span className="flex items-center gap-1.5 px-2.5 py-1 bg-red-50 text-red-700 rounded-lg text-xs font-medium"><XCircle className="w-3.5 h-3.5" /> {tStatus("CANCELLED")}</span>;
            default: return <span>{status}</span>;
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="relative w-full sm:w-96">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 rtl:left-auto rtl:right-3" />
                    <input
                        type="text"
                        placeholder={t("search_placeholder")}
                        className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/30 rtl:pl-4 rtl:pr-10"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden min-h-[400px]">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-gray-500 uppercase tracking-wider bg-gray-50/50">
                            <tr>
                                <th className="px-6 py-4 font-medium">{t("table.order_details")}</th>
                                <th className="px-6 py-4 font-medium">{t("table.customer_info")}</th>
                                <th className="px-6 py-4 font-medium">{t("table.total_amount")}</th>
                                <th className="px-6 py-4 font-medium">Payment</th>
                                <th className="px-6 py-4 font-medium">{t("table.status_action")}</th>
                                <th className="px-6 py-4 font-medium text-right rtl:text-left">{t("table.invoice")}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredOrders.map((order) => (
                                <tr key={order.id} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="font-mono text-xs font-medium text-gray-800">#{order.id.slice(0, 8).toUpperCase()}</div>
                                        <div className="text-xs text-gray-500 mt-1">{formatDate(order.createdAt)}</div>
                                        <div className="text-xs text-primary mt-1 cursor-pointer hover:underline" onClick={() => setSelectedOrder(order)}>
                                            {t("items_count", { count: order.items.length })}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="font-medium text-gray-900">{order.customer.shopName}</div>
                                        <div className="text-xs text-gray-500">{order.customer.name}</div>
                                        <div className="text-xs text-gray-400 mt-0.5">{order.customer.wilaya}</div>
                                    </td>
                                    <td className="px-6 py-4 font-medium text-gray-900">
                                        {formatCurrency(order.totalPrice)}
                                    </td>
                                    <td className="px-6 py-4">
                                        {order.paymentStatus === "PAID" ? (
                                            <span className="flex items-center gap-1 px-2 py-1 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-medium w-fit"><CheckCircle2 className="w-3 h-3" /> Paid</span>
                                        ) : order.paymentStatus === "PARTIAL" ? (
                                            <span className="flex items-center gap-1 px-2 py-1 bg-amber-50 text-amber-700 rounded-lg text-xs font-medium w-fit"><AlertCircle className="w-3 h-3" /> Partial</span>
                                        ) : (
                                            <span className="flex items-center gap-1 px-2 py-1 bg-red-50 text-red-700 rounded-lg text-xs font-medium w-fit"><Clock className="w-3 h-3" /> Unpaid</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col gap-2 items-start">
                                            <StatusBadge status={order.status} />
                                            <div className="relative">
                                                <select
                                                    className="appearance-none bg-white border border-gray-200 text-xs rounded-lg pl-3 pr-8 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/30 text-gray-600 disabled:opacity-50 rtl:pl-8 rtl:pr-3"
                                                    value={order.status}
                                                    onChange={(e) => handleStatusChange(order.id, e.target.value as OrderStatus)}
                                                    disabled={updatingId === order.id}
                                                >
                                                    {Object.keys(OrderStatus).map(status => (
                                                        <option key={status} value={status}>{tStatus(status)}</option>
                                                    ))}
                                                </select>
                                                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none rtl:right-auto rtl:left-2.5" />
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right rtl:text-left">
                                        {order.invoice ? (
                                            <div className="flex flex-col items-end gap-1">
                                                <span className="text-xs font-mono text-gray-500">{order.invoice.invoiceNumber}</span>
                                                <button className="text-xs text-blue-600 hover:underline flex items-center gap-1 rtl:flex-row-reverse">
                                                    <FileText className="w-3.5 h-3.5" /> {t("view_invoice")}
                                                </button>
                                            </div>
                                        ) : (
                                            <span className="text-xs text-gray-400 italic">{t("no_invoice")}</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {filteredOrders.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="px-6 py-10 text-center text-gray-500">
                                        {t("no_orders")}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* View Order Modal */}
            {selectedOrder && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl relative flex flex-col max-h-[90vh]">
                        <div className="px-6 py-4 flex items-center justify-between border-b border-gray-100 bg-gray-50/50 shrink-0">
                            <div>
                                <h2 className="text-lg font-bold text-primary-dark font-serif">{t("modal.title")}</h2>
                                <p className="text-xs font-mono text-gray-500">#{selectedOrder.id}</p>
                            </div>
                            <button onClick={() => setSelectedOrder(null)} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-white rounded-full transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto">
                            <div className="mb-6 grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-xl border border-gray-100">
                                <div>
                                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">{t("modal.customer")}</p>
                                    <p className="text-sm font-semibold text-gray-900">{selectedOrder.customer.shopName}</p>
                                    <p className="text-sm text-gray-600">{selectedOrder.customer.name} | {selectedOrder.customer.phone}</p>
                                    <p className="text-sm text-gray-600">{selectedOrder.customer.address}, {selectedOrder.customer.wilaya}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">{t("table.status_action")}</p>
                                    <div className="flex justify-end mb-2"><StatusBadge status={selectedOrder.status} /></div>
                                    <p className="text-xs text-gray-500">{formatDate(selectedOrder.createdAt)}</p>
                                </div>
                            </div>

                            <h3 className="font-medium text-gray-900 mb-3 border-b border-gray-100 pb-2">{t("modal.items_included")}</h3>
                            <div className="space-y-3">
                                {selectedOrder.items.map((item: any, idx: number) => (
                                    <div key={idx} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0 hover:bg-gray-50/50 p-2 rounded-lg transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-gray-100 rounded overflow-hidden relative shrink-0">
                                                <SafeImage src={item.product?.imageUrl || ''} alt={item.product?.name || t("modal.unknown_product")} fill className="object-cover" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-gray-900">{item.product?.name || t("modal.unknown_product")}</p>
                                                <p className="text-xs text-gray-500">{formatCurrency(item.price)} {t("modal.per_unit")}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-semibold text-gray-900">x{item.quantity}</p>
                                            <p className="text-sm font-medium text-primary-dark">{formatCurrency(item.price * item.quantity)}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="mt-6 border-t border-gray-100 pt-4 space-y-3">
                                <div className="flex justify-between items-center bg-primary/5 p-4 rounded-xl border border-primary/10">
                                    <span className="font-serif font-bold text-gray-900">{t("modal.total_validated")}</span>
                                    <span className="text-xl font-bold text-primary-dark">{formatCurrency(selectedOrder.totalPrice)}</span>
                                </div>
                                <div className="grid grid-cols-3 gap-3">
                                    <div className="bg-gray-50 rounded-lg p-3 text-center relative group">
                                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Paid</p>
                                        <p className="text-sm font-bold text-emerald-700">{formatCurrency(selectedOrder.amountPaid || 0)}</p>
                                        <button 
                                            onClick={() => handlePaymentUpdate(selectedOrder.id, selectedOrder.amountPaid || 0)}
                                            disabled={updatingPaymentId === selectedOrder.id}
                                            className="absolute inset-0 bg-primary/90 text-white text-[10px] font-bold items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex"
                                        >
                                            {updatingPaymentId === selectedOrder.id ? "..." : "RECORD PAYMENT"}
                                        </button>
                                    </div>
                                    <div className="bg-gray-50 rounded-lg p-3 text-center">
                                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Balance</p>
                                        <p className={`text-sm font-bold ${(selectedOrder.totalPrice - (selectedOrder.amountPaid || 0)) > 0 ? 'text-red-600' : 'text-gray-400'}`}>{formatCurrency(Math.max(0, selectedOrder.totalPrice - (selectedOrder.amountPaid || 0)))}</p>
                                    </div>
                                    <div className="bg-gray-50 rounded-lg p-3 text-center">
                                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Status</p>
                                        <p className="text-sm font-bold text-gray-700">{selectedOrder.paymentStatus || 'UNPAID'}</p>
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
