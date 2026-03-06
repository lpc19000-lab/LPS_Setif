import { requireCustomerSession } from "@/lib/customer-auth";
import { getOrdersByCustomer } from "@/services/order-service";
import {
    ShoppingBag,
    Calendar,
    Hash,
    CreditCard,
    ChevronRight,
    Clock,
    CheckCircle2,
    Truck,
    XCircle,
    Package
} from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

const getStatusStyles = (status: string) => {
    switch (status) {
        case "DELIVERED":
            return "bg-emerald-50 text-emerald-600 border-emerald-100";
        case "CANCELLED":
            return "bg-red-50 text-red-600 border-red-100";
        case "SHIPPED":
            return "bg-blue-50 text-blue-600 border-blue-100";
        case "PACKED":
        case "CONFIRMED":
            return "bg-indigo-50 text-indigo-600 border-indigo-100";
        default:
            return "bg-amber-50 text-amber-600 border-amber-100";
    }
};

const getStatusIcon = (status: string) => {
    switch (status) {
        case "DELIVERED": return CheckCircle2;
        case "SHIPPED": return Truck;
        case "CANCELLED": return XCircle;
        case "PACKED": return Package;
        default: return Clock;
    }
};

export default async function OrderHistoryPage() {
    const customer = await requireCustomerSession();
    const orders = await getOrdersByCustomer(customer.id);

    return (
        <div className="max-w-7xl mx-auto px-6 pt-32 pb-20">
            <div className="flex items-center gap-4 mb-10">
                <Link
                    href="/account"
                    className="w-10 h-10 rounded-full border border-gray-100 flex items-center justify-center text-gray-400 hover:text-primary hover:border-primary/20 transition-all"
                >
                    <ChevronRight className="w-5 h-5 rotate-180" />
                </Link>
                <div>
                    <h1 className="text-3xl font-serif font-bold text-primary-dark">Order History</h1>
                    <p className="text-sm text-gray-500 mt-1">Manage and track your wholesale shipments.</p>
                </div>
            </div>

            {orders.length === 0 ? (
                <div className="bg-white rounded-3xl border border-gray-100 p-20 text-center shadow-sm">
                    <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6 text-gray-200">
                        <ShoppingBag className="w-10 h-10" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 mb-2">No orders found</h2>
                    <p className="text-gray-500 mb-8 max-w-sm mx-auto">You haven't placed any orders yet. Visit our shop to browse our latest collection.</p>
                    <Link href="/catalog" className="bg-primary text-white px-8 py-3 rounded-full font-bold hover:bg-primary-dark transition-all shadow-lg shadow-primary/20">
                        Start Shopping
                    </Link>
                </div>
            ) : (
                <div className="space-y-4">
                    {/* Desktop View Table */}
                    <div className="hidden md:block bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-gray-50/50 border-b border-gray-100">
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Order ID</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Date</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Status</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 text-right">Total Amount</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {orders.map((order) => {
                                    const StatusIcon = getStatusIcon(order.status);
                                    return (
                                        <tr key={order.id} className="hover:bg-gray-50/50 transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <Hash className="w-3 h-3 text-gray-300" />
                                                    <span className="text-sm font-bold text-gray-900 uppercase">
                                                        {order.id.slice(-8)}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2 text-gray-500">
                                                    <Calendar className="w-4 h-4" />
                                                    <span className="text-sm">
                                                        {new Date(order.createdAt).toLocaleDateString("en-GB", {
                                                            day: "2-digit",
                                                            month: "short",
                                                            year: "numeric"
                                                        })}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[10px] font-black uppercase tracking-widest ${getStatusStyles(order.status)}`}>
                                                    <StatusIcon className="w-3 h-3" />
                                                    {order.status}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2 text-gray-900 font-bold">
                                                    <span className="text-sm">{Number(order.totalPrice).toLocaleString()}</span>
                                                    <span className="text-[10px] text-gray-400">DA</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <Link
                                                    href={`/account/orders/${order.id}`}
                                                    className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:text-primary-dark transition-colors"
                                                >
                                                    Details
                                                    <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                                                </Link>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile View List */}
                    <div className="md:hidden space-y-4">
                        {orders.map((order) => {
                            const StatusIcon = getStatusIcon(order.status);
                            return (
                                <Link
                                    key={order.id}
                                    href={`/account/orders/${order.id}`}
                                    className="block bg-white p-5 rounded-2xl border border-gray-100 shadow-sm active:scale-[0.98] transition-all"
                                >
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-black text-gray-300 uppercase">#{order.id.slice(-6)}</span>
                                            <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full border text-[9px] font-black uppercase tracking-widest ${getStatusStyles(order.status)}`}>
                                                <StatusIcon className="w-2.5 h-2.5" />
                                                {order.status}
                                            </div>
                                        </div>
                                        <p className="text-xs text-gray-400 font-medium">
                                            {new Date(order.createdAt).toLocaleDateString()}
                                        </p>
                                    </div>
                                    <div className="flex items-end justify-between">
                                        <div>
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Amount</p>
                                            <p className="text-lg font-bold text-gray-900">{Number(order.totalPrice).toLocaleString()} <span className="text-xs font-normal text-gray-400">DA</span></p>
                                        </div>
                                        <div className="flex items-center gap-1 text-xs font-bold text-primary">
                                            Manage
                                            <ChevronRight className="w-4 h-4" />
                                        </div>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
