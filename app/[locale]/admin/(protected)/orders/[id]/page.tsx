import { getOrderById } from "@/services/order-service";
import {
    Clock,
    Package,
    Truck,
    CheckCircle2,
    XCircle,
    Printer,
    FileText,
    MapPin,
    User,
    TrendingUp,
    Calendar,
    ChevronRight,
    ArrowLeft
} from "lucide-react";
import Link from "next/link";
import OrderStatusSelect from "@/components/admin/OrderStatusSelect";
import ShippingInfoForm from "@/components/admin/ShippingInfoForm";
import Image from "next/image";

export const dynamic = "force-dynamic";

export default async function AdminOrderDetailPage({ params }: { params: Promise<{ id: string, locale: string }> }) {
    const { id } = await params;
    const order: any = await getOrderById(id);

    if (!order) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px]">
                <p className="text-gray-500">Order not found.</p>
                <Link href="/admin/orders" className="mt-4 text-primary hover:underline">Back to Orders</Link>
            </div>
        );
    }

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("en-US", { style: "currency", currency: "DZD" }).format(amount);
    };

    const formatDate = (date: Date) => {
        return new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short" }).format(date);
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case "PENDING": return <Clock className="w-5 h-5 text-amber-500" />;
            case "CONFIRMED": return <CheckCircle2 className="w-5 h-5 text-blue-500" />;
            case "PREPARING": return <Package className="w-5 h-5 text-indigo-500" />;
            case "SHIPPED": return <Truck className="w-5 h-5 text-purple-500" />;
            case "DELIVERED": return <CheckCircle2 className="w-5 h-5 text-emerald-500" />;
            case "CANCELLED": return <XCircle className="w-5 h-5 text-red-500" />;
            default: return <Clock className="w-5 h-5 text-gray-500" />;
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500 max-w-6xl mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Link
                        href="/admin/orders"
                        className="w-10 h-10 rounded-xl bg-white border border-gray-100 flex items-center justify-center hover:bg-gray-50 transition-colors shadow-sm"
                    >
                        <ArrowLeft className="w-5 h-5 text-gray-400" />
                    </Link>
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <h1 className="text-2xl font-serif font-bold text-primary-dark tracking-tight">Order #{order.id.slice(0, 8).toUpperCase()}</h1>
                        </div>
                        <p className="text-xs text-gray-400 font-mono">{order.id}</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <Link
                        href={`/admin/orders/${order.id}/packing-list`}
                        className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 text-sm font-semibold rounded-xl hover:bg-gray-50 transition-all shadow-sm"
                    >
                        <FileText className="w-4 h-4" /> Packing List
                    </Link>
                    <a
                        href={`/admin/invoices/${order.invoice?.id}/print`}
                        className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 text-sm font-semibold rounded-xl hover:bg-gray-50 transition-all shadow-sm"
                    >
                        <Printer className="w-4 h-4" /> Print Invoice
                    </a>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Content (Left) */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Order Status & Shipping Info */}
                    <div className="bg-white rounded-2xl border border-primary/10 shadow-sm overflow-hidden p-6">
                        <div className="flex flex-col md:flex-row gap-8 justify-between">
                            <div className="space-y-4 flex-1">
                                <h2 className="text-sm font-bold uppercase tracking-widest text-gray-400">Order Management</h2>
                                <OrderStatusSelect orderId={order.id} currentStatus={order.status} />
                                <p className="text-sm text-gray-500 italic">Changing status triggers an automated log entry and stock adjustment where applicable.</p>
                            </div>
                            <div className="w-px bg-gray-100 hidden md:block" />
                            <div className="space-y-4 flex-1">
                                <h2 className="text-sm font-bold uppercase tracking-widest text-gray-400">Shipping Details</h2>
                                <ShippingInfoForm
                                    orderId={order.id}
                                    initialData={{
                                        shippingCompany: order.shippingCompany || "",
                                        trackingNumber: order.trackingNumber || "",
                                        shippingDate: order.shippingDate ? order.shippingDate.toISOString().split('T')[0] : ""
                                    }}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Order Items */}
                    <div className="bg-white rounded-2xl border border-primary/10 shadow-sm overflow-hidden">
                        <div className="p-6 border-b border-gray-50 bg-gray-50/30">
                            <h2 className="text-lg font-bold text-primary-dark">Products List</h2>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs text-gray-500 uppercase tracking-wider bg-gray-50/50">
                                    <tr>
                                        <th className="px-6 py-4 font-medium">Product</th>
                                        <th className="px-6 py-4 font-medium text-center">Qty</th>
                                        <th className="px-6 py-4 font-medium text-right">Unit Price</th>
                                        <th className="px-6 py-4 font-medium text-right">Total</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {order.items.map((item: any) => (
                                        <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100 relative shrink-0">
                                                        <Image src={item.product.imageUrl || 'https://images.unsplash.com/photo-1594035910387-fea47794261f?w=100'} alt={item.product.name} fill className="object-cover" />
                                                    </div>
                                                    <div>
                                                        <div className="font-medium text-gray-900">{item.product.name}</div>
                                                        <div className="text-xs text-gray-500">{item.product.brand}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-center font-medium">
                                                {item.quantity} units
                                            </td>
                                            <td className="px-6 py-4 text-right text-gray-500">
                                                {formatCurrency(Number(item.price))}
                                            </td>
                                            <td className="px-6 py-4 text-right font-bold text-primary-dark">
                                                {formatCurrency(Number(item.price) * item.quantity)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot className="bg-gray-50/30 border-t border-gray-100">
                                    <tr>
                                        <td colSpan={3} className="px-6 py-4 text-right font-medium text-gray-500 uppercase tracking-wider">Subtotal</td>
                                        <td className="px-6 py-4 text-right font-bold text-2xl text-primary-dark">{formatCurrency(Number(order.totalPrice))}</td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </div>

                    {/* Timeline (System 5) */}
                    <div className="bg-white rounded-2xl border border-primary/10 shadow-sm overflow-hidden">
                        <div className="p-6 border-b border-gray-50 bg-gray-50/30">
                            <h2 className="text-lg font-bold text-primary-dark">Order Activity Log</h2>
                        </div>
                        <div className="p-6">
                            <div className="space-y-6 relative before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-px before:bg-gray-100">
                                {order.logs.map((log: any) => (
                                    <div key={log.id} className="relative pl-10">
                                        <div className={`absolute left-0 top-1 w-5 h-5 rounded-full border-4 border-white shadow-sm flex items-center justify-center shrink-0 ${log.status === "DELIVERED" ? 'bg-emerald-500' :
                                            log.status === "CANCELLED" ? 'bg-red-500' :
                                                'bg-primary'
                                            }`} />
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                            <h3 className="text-sm font-bold text-gray-900">{log.message}</h3>
                                            <span className="text-xs text-gray-400 font-medium whitespace-nowrap">{formatDate(log.createdAt)}</span>
                                        </div>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-[10px] uppercase font-bold tracking-widest text-gray-400 bg-gray-50 px-2 py-0.5 rounded-md border border-gray-100">
                                                {log.changedBy}
                                            </span>
                                            <span className="text-xs text-gray-500">Status: <span className="font-semibold text-primary">{log.status}</span></span>
                                        </div>
                                    </div>
                                ))}
                                {order.logs.length === 0 && (
                                    <p className="text-sm text-gray-500 italic text-center py-4">No activity recorded yet.</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sidebar Details (Right) */}
                <div className="space-y-8">
                    {/* Customer Info */}
                    <div className="bg-white rounded-2xl border border-primary/10 shadow-sm p-6 space-y-6">
                        <h2 className="text-sm font-bold uppercase tracking-widest text-[#D4AF37]">Customer Info</h2>
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary-dark font-serif font-bold text-xl uppercase">
                                {order.customer.shopName.charAt(0)}
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-900">{order.customer.shopName}</h3>
                                <p className="text-sm text-gray-500">{order.customer.name}</p>
                            </div>
                        </div>
                        <div className="space-y-3 pt-4 border-t border-gray-50">
                            <div className="flex items-start gap-3">
                                <MapPin className="w-5 h-5 text-gray-400 shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-sm text-gray-900 leading-snug">{order.customer.address}</p>
                                    <p className="text-xs text-gray-400 mt-0.5 uppercase tracking-wide font-bold">{order.customer.wilaya}, Algeria</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <User className="w-5 h-5 text-gray-400 shrink-0" />
                                <p className="text-sm text-gray-900">{order.customer.phone}</p>
                            </div>
                        </div>
                        <Link
                            href={`/admin/customers?id=${order.customer.id}`}
                            className="flex items-center justify-between gap-2 w-full px-4 py-2.5 bg-gray-50 text-gray-600 text-xs font-bold uppercase tracking-widest rounded-xl hover:bg-gray-100 transition-colors group"
                        >
                            View CRM Profile
                            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </Link>
                    </div>

                    {/* Invoice Summary */}
                    <div className="bg-primary-dark rounded-2xl p-6 text-white space-y-4">
                        <div className="flex items-center gap-2 opacity-60">
                            <TrendingUp className="w-4 h-4" />
                            <span className="text-xs font-bold uppercase tracking-widest">Financial Summary</span>
                        </div>
                        <div>
                            <p className="text-3xl font-serif font-bold text-[#D4AF37]">{formatCurrency(Number(order.totalPrice))}</p>
                            <p className="text-xs text-white/50 mt-1 uppercase tracking-wide">Included in invoice {order.invoice?.invoiceNumber}</p>
                        </div>
                        <div className="pt-4 border-t border-white/10 flex items-center justify-between">
                            <span className="text-xs text-white/60">Status</span>
                            <span className="text-xs font-bold px-2 py-0.5 bg-white/10 rounded uppercase tracking-tighter">{order.status}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
