import { requireCustomerSession } from "@/lib/customer-auth";
import { getOrdersByCustomer } from "@/services/order-service";
import {
    User,
    Phone,
    MapPin,
    ShoppingBag,
    TrendingUp,
    ArrowRight,
    LogOut
} from "lucide-react";
import Link from "next/link";
import LogoutButton from "@/components/shop/LogoutButton";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
    const customer = await requireCustomerSession();
    const orders = await getOrdersByCustomer(customer.id);

    const totalSpent = orders
        .filter(o => o.status !== "CANCELLED")
        .reduce((sum, order) => sum + Number(order.totalPrice), 0);

    const stats = [
        { label: "Total Orders", value: orders.length, icon: ShoppingBag, color: "text-blue-600", bg: "bg-blue-50" },
        { label: "Total Spent", value: `${totalSpent.toLocaleString()} DA`, icon: TrendingUp, color: "text-emerald-600", bg: "bg-emerald-50" },
    ];

    return (
        <div className="max-w-7xl mx-auto px-6 pt-32 pb-20">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                <div>
                    <h1 className="text-3xl font-serif font-bold text-primary-dark">Trader Account</h1>
                    <p className="text-gray-500 mt-1">Welcome back, {customer.name}</p>
                </div>
                <LogoutButton variant="trader" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Profile Card */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary text-2xl font-serif font-bold">
                                {customer.name.charAt(0)}
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">{customer.shopName}</h2>
                                <p className="text-sm text-gray-500">{customer.name}</p>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div className="flex items-start gap-4">
                                <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 shrink-0">
                                    <Phone className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-0.5">Phone Number</p>
                                    <p className="text-sm font-medium text-gray-900">{customer.phone}</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-4">
                                <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 shrink-0">
                                    <MapPin className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-0.5">Business Address</p>
                                    <p className="text-sm font-medium text-gray-900 leading-relaxed">
                                        {customer.address}, {customer.wilaya}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <Link
                        href="/catalog"
                        className="flex items-center justify-between p-6 bg-primary rounded-2xl text-white group hover:bg-primary-dark transition-all shadow-lg shadow-primary/20"
                    >
                        <div>
                            <p className="text-sm font-medium opacity-80 mb-1">Stock is ready</p>
                            <p className="text-lg font-bold">Browze Catalog</p>
                        </div>
                        <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                    </Link>
                </div>

                {/* Stats & Recent Orders */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {stats.map((stat) => (
                            <div key={stat.label} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
                                <div>
                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">{stat.label}</p>
                                    <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                                </div>
                                <div className={`w-12 h-12 rounded-xl ${stat.bg} flex items-center justify-center ${stat.color}`}>
                                    <stat.icon className="w-6 h-6" />
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Recent Orders Preview */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                            <h3 className="font-bold text-gray-900">Recent Orders</h3>
                            <Link href="/account/orders" className="text-sm font-bold text-primary hover:text-primary-dark transition-colors">
                                View All
                            </Link>
                        </div>

                        {orders.length === 0 ? (
                            <div className="p-16 text-center">
                                <ShoppingBag className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                                <p className="text-gray-500">No orders placed yet.</p>
                                <Link href="/catalog" className="text-primary font-bold mt-4 inline-block">Start Shopping</Link>
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-50">
                                {orders.slice(0, 5).map((order) => (
                                    <Link
                                        key={order.id}
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
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
