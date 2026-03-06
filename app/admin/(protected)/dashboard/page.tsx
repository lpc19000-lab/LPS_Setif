import prisma from "@/lib/db";
import { DollarSign, Package, Users, ShoppingCart, Clock, Trophy, AlertTriangle, Bell, Activity } from "lucide-react";
import { getInventoryHealthScore } from "@/services/intelligence-service";
import SafeImage from "@/components/SafeImage";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
    const [
        totalProducts,
        totalCustomers,
        totalOrders,
        pendingOrders,
        revenueResult,
        lowStockProducts,
        unreadNotifications,
        bestSellers,
        inventoryHealthScore,
    ] = await Promise.all([
        prisma.product.count(),
        prisma.customer.count(),
        prisma.order.count(),
        prisma.order.count({ where: { status: "PENDING" } }),
        prisma.order.aggregate({
            _sum: { totalPrice: true },
            where: { status: { not: "CANCELLED" } }
        }),
        prisma.$queryRaw<[{ count: bigint }]>`SELECT COUNT(*) as count FROM products WHERE stock_quantity <= low_stock_threshold AND stock_quantity > 0`.then(
            (r) => Number(r[0]?.count ?? 0)
        ).catch(() => 0),
        prisma.notification.count({ where: { isRead: false } }),
        prisma.productSales.findMany({
            take: 5,
            orderBy: { unitsSold: "desc" },
            include: { product: { include: { category: true } } }
        }),
        getInventoryHealthScore(),
    ]);

    const revenue = revenueResult._sum.totalPrice ? Number(revenueResult._sum.totalPrice) : 0;

    const recentOrders = await prisma.order.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        include: { customer: true }
    });

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("en-US", { style: "currency", currency: "DZD" }).format(amount);
    };

    const formatDate = (date: Date) => {
        return new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short" }).format(date);
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case "PENDING": return "bg-amber-100 text-amber-700 border-amber-200";
            case "CONFIRMED": return "bg-blue-100 text-blue-700 border-blue-200";
            case "PROCESSING": return "bg-indigo-100 text-indigo-700 border-indigo-200";
            case "SHIPPED": return "bg-purple-100 text-purple-700 border-purple-200";
            case "DELIVERED": return "bg-emerald-100 text-emerald-700 border-emerald-200";
            case "CANCELLED": return "bg-red-100 text-red-700 border-red-200";
            default: return "bg-gray-100 text-gray-700 border-gray-200";
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div>
                <h1 className="text-3xl font-serif font-bold text-primary-dark tracking-tight">Dashboard Overview</h1>
                <p className="text-gray-500 mt-1 tracking-wide">Welcome back. Here is what is happening with your store today.</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
                {/* Inventory Health Score */}
                <div className="bg-white p-6 rounded-2xl border border-primary/10 shadow-sm relative overflow-hidden group flex flex-col justify-between">
                    <div className="flex items-center gap-4 mb-4">
                        <div className={`p-3 rounded-xl ${inventoryHealthScore >= 90 ? "bg-emerald-50 text-emerald-600" :
                                inventoryHealthScore >= 70 ? "bg-amber-50 text-amber-600" :
                                    "bg-red-50 text-red-600"
                            }`}>
                            <Activity className="w-5 h-5" />
                        </div>
                        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider relative z-10">Health Score</h3>
                    </div>
                    <p className={`text-2xl font-bold font-serif relative z-10 ${inventoryHealthScore >= 90 ? "text-emerald-600" :
                            inventoryHealthScore >= 70 ? "text-amber-600" :
                                "text-red-600"
                        }`}>
                        {inventoryHealthScore}%
                    </p>
                </div>
                {/* Revenue */}
                <div className="bg-white p-6 rounded-2xl border border-primary/10 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform duration-300">
                        <DollarSign className="w-16 h-16 text-[#D4AF37]" strokeWidth={1} />
                    </div>
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                            <DollarSign className="w-5 h-5" />
                        </div>
                        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider relative z-10">Total Revenue</h3>
                    </div>
                    <p className="text-2xl font-bold text-primary-dark relative z-10">{formatCurrency(revenue)}</p>
                </div>

                {/* Orders */}
                <div className="bg-white p-6 rounded-2xl border border-primary/10 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform duration-300">
                        <ShoppingCart className="w-16 h-16 text-[#D4AF37]" strokeWidth={1} />
                    </div>
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                            <ShoppingCart className="w-5 h-5" />
                        </div>
                        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider relative z-10">Total Orders</h3>
                    </div>
                    <p className="text-2xl font-bold text-primary-dark relative z-10">{totalOrders}</p>
                </div>

                {/* Pending Orders */}
                <div className="bg-white p-6 rounded-2xl border border-primary/10 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform duration-300">
                        <Clock className="w-16 h-16 text-[#D4AF37]" strokeWidth={1} />
                    </div>
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
                            <Clock className="w-5 h-5" />
                        </div>
                        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider relative z-10">Pending</h3>
                    </div>
                    <p className="text-2xl font-bold text-primary-dark relative z-10">{pendingOrders}</p>
                </div>

                {/* Customers */}
                <div className="bg-white p-6 rounded-2xl border border-primary/10 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform duration-300">
                        <Users className="w-16 h-16 text-[#D4AF37]" strokeWidth={1} />
                    </div>
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
                            <Users className="w-5 h-5" />
                        </div>
                        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider relative z-10">Customers</h3>
                    </div>
                    <p className="text-2xl font-bold text-primary-dark relative z-10">{totalCustomers}</p>
                </div>

                {/* Products */}
                <div className="bg-white p-6 rounded-2xl border border-primary/10 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform duration-300">
                        <Package className="w-16 h-16 text-[#D4AF37]" strokeWidth={1} />
                    </div>
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
                            <Package className="w-5 h-5" />
                        </div>
                        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider relative z-10">Products</h3>
                    </div>
                    <p className="text-2xl font-bold text-primary-dark relative z-10">{totalProducts}</p>
                </div>
            </div>

            {/* Recent Orders Table */}
            <div className="bg-white rounded-2xl border border-primary/10 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                    <h2 className="text-lg font-bold text-primary-dark">Recent Orders</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-gray-500 uppercase tracking-wider bg-gray-50/50">
                            <tr>
                                <th className="px-6 py-4 font-medium">Order ID</th>
                                <th className="px-6 py-4 font-medium">Customer</th>
                                <th className="px-6 py-4 font-medium">Date</th>
                                <th className="px-6 py-4 font-medium">Total</th>
                                <th className="px-6 py-4 font-medium">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {recentOrders.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                                        No orders found yet.
                                    </td>
                                </tr>
                            ) : (
                                recentOrders.map((order) => (
                                    <tr key={order.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-4 font-mono text-xs font-medium text-gray-600">
                                            #{order.id.slice(0, 8).toUpperCase()}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-gray-900">{order.customer.shopName}</div>
                                            <div className="text-xs text-gray-500">{order.customer.name}</div>
                                        </td>
                                        <td className="px-6 py-4 text-gray-500 whitespace-nowrap">
                                            {formatDate(order.createdAt)}
                                        </td>
                                        <td className="px-6 py-4 font-medium text-gray-900">
                                            {formatCurrency(Number(order.totalPrice))}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-3 py-1 text-xs font-medium rounded-full border ${getStatusColor(order.status)}`}>
                                                {order.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Alert Badges */}
            {(unreadNotifications > 0 || lowStockProducts > 0) && (
                <div className="flex gap-4">
                    {unreadNotifications > 0 && (
                        <a href="/admin/notifications" className="flex items-center gap-2 px-4 py-2.5 bg-blue-50 border border-blue-100 rounded-xl hover:bg-blue-100 transition-colors">
                            <Bell className="w-4 h-4 text-blue-600" />
                            <span className="text-sm font-semibold text-blue-700">{unreadNotifications} Unread Notification{unreadNotifications > 1 ? 's' : ''}</span>
                        </a>
                    )}
                    {lowStockProducts > 0 && (
                        <a href="/admin/inventory" className="flex items-center gap-2 px-4 py-2.5 bg-amber-50 border border-amber-100 rounded-xl hover:bg-amber-100 transition-colors">
                            <AlertTriangle className="w-4 h-4 text-amber-600" />
                            <span className="text-sm font-semibold text-amber-700">{lowStockProducts} Low Stock Alert{lowStockProducts > 1 ? 's' : ''}</span>
                        </a>
                    )}
                </div>
            )}

            {/* Best Sellers */}
            {bestSellers.length > 0 && (
                <div className="bg-white rounded-2xl border border-primary/10 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-gray-100 flex items-center gap-3">
                        <Trophy className="w-5 h-5 text-[#D4AF37]" />
                        <h2 className="text-lg font-bold text-primary-dark">Best Sellers</h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-gray-500 uppercase tracking-wider bg-gray-50/50">
                                <tr>
                                    <th className="px-6 py-4 font-medium">#</th>
                                    <th className="px-6 py-4 font-medium">Product</th>
                                    <th className="px-6 py-4 font-medium">Category</th>
                                    <th className="px-6 py-4 font-medium">Units Sold</th>
                                    <th className="px-6 py-4 font-medium">Revenue</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {bestSellers.map((sale, index) => (
                                    <tr key={sale.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${index === 0 ? 'bg-[#D4AF37]/20 text-[#D4AF37]' :
                                                index === 1 ? 'bg-gray-200 text-gray-600' :
                                                    index === 2 ? 'bg-amber-100 text-amber-700' :
                                                        'bg-gray-100 text-gray-500'
                                                }`}>
                                                {index + 1}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg overflow-hidden bg-gray-100 relative shrink-0">
                                                    <SafeImage src={sale.product.imageUrl} alt={sale.product.name} fill className="object-cover" />
                                                </div>
                                                <div className="font-medium text-gray-900">{sale.product.name}</div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-gray-500">{sale.product.category?.name}</td>
                                        <td className="px-6 py-4 font-semibold text-primary-dark">{sale.unitsSold}</td>
                                        <td className="px-6 py-4 font-semibold text-emerald-600">{formatCurrency(Number(sale.revenue))}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
