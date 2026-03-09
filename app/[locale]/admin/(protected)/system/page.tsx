import { getSystemHealth } from "@/services/audit-service";
import {
    Activity,
    Zap,
    Package,
    Users,
    ShoppingCart,
    AlertCircle,
    Database,
    ShieldCheck,
    Server
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function SystemHealthPage() {
    const health = await getSystemHealth();

    const metrics = [
        { label: "Total Products", value: health.metrics.totalProducts, icon: Package, color: "text-blue-600", bg: "bg-blue-50" },
        { label: "Total Customers", value: health.metrics.totalCustomers, icon: Users, color: "text-purple-600", bg: "bg-purple-50" },
        { label: "Total Orders", value: health.metrics.totalOrders, icon: ShoppingCart, color: "text-emerald-600", bg: "bg-emerald-50" },
        { label: "Orders Today", value: health.metrics.ordersToday, icon: Zap, color: "text-amber-500", bg: "bg-amber-50" },
    ];

    return (
        <div className="space-y-8 pb-12">
            <div>
                <h1 className="text-2xl font-serif font-bold text-primary-dark">System Health Dashboard</h1>
                <p className="text-gray-500 text-sm mt-1">Operational metrics and infrastructure status.</p>
            </div>

            {/* Core Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {metrics.map((item) => (
                    <div key={item.label} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
                        <div>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">{item.label}</p>
                            <p className="text-2xl font-bold text-gray-900">{item.value.toLocaleString()}</p>
                        </div>
                        <div className={`w-12 h-12 rounded-xl ${item.bg} flex items-center justify-center ${item.color}`}>
                            <item.icon className="w-6 h-6" />
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* System Status Card */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden">
                        <div className="relative z-10 text-center">
                            <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-4 ${health.stability.status === "HEALTHY" ? "bg-emerald-100 text-emerald-600 shadow-[0_0_20px_rgba(16,185,129,0.2)]" :
                                    health.stability.status === "WARNING" ? "bg-amber-100 text-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.2)]" :
                                        "bg-red-100 text-red-600 shadow-[0_0_20px_rgba(239,68,68,0.2)]"
                                }`}>
                                <ShieldCheck className="w-10 h-10" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-1">System Status</h3>
                            <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-bold uppercase tracking-widest ${health.stability.status === "HEALTHY" ? "text-emerald-600 bg-emerald-50" :
                                    health.stability.status === "WARNING" ? "text-amber-500 bg-amber-50" :
                                        "text-red-600 bg-red-50"
                                }`}>
                                <span className={`w-2 h-2 rounded-full animate-pulse ${health.stability.status === "HEALTHY" ? "bg-emerald-600" :
                                        health.stability.status === "WARNING" ? "bg-amber-500" :
                                            "bg-red-600"
                                    }`}></span>
                                {health.stability.status}
                            </div>
                            <p className="mt-4 text-sm text-gray-500 leading-relaxed px-4">
                                {health.stability.status === "HEALTHY" ? "All systems are operational. No critical errors detected in the last 24 hours." :
                                    health.stability.status === "WARNING" ? "System experiencing minor issues. Check error logs for details." :
                                        "System health is degraded. Immediate attention required."}
                            </p>
                        </div>
                        {/* Abstract background pattern */}
                        <div className="absolute top-0 right-0 p-4 opacity-5">
                            <Activity className="w-32 h-32" />
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-500">
                                <Database className="w-4 h-4" />
                            </div>
                            <h3 className="font-bold text-gray-900">Infrastructure</h3>
                        </div>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-500">Database Engine</span>
                                <span className="font-bold text-gray-900">PostgreSQL (Supabase)</span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-500">Application Server</span>
                                <span className="font-bold text-gray-900">Next.js Edge</span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-500">ORM Layer</span>
                                <span className="font-bold text-gray-900">Prisma Client</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Detailed Health Grid */}
                <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6 h-fit">
                    {/* Inventory Health */}
                    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center text-orange-600">
                                    <Package className="w-5 h-5" />
                                </div>
                                <h3 className="font-bold text-gray-900">Inventory Health</h3>
                            </div>
                        </div>
                        <div className="space-y-6">
                            <div>
                                <div className="flex justify-between text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
                                    <span>Low Stock Items</span>
                                    <span className="text-orange-600">{health.inventory.lowStockProducts}</span>
                                </div>
                                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                    <div className="h-full bg-orange-500" style={{ width: `${Math.min(100, (health.inventory.lowStockProducts / (health.metrics.totalProducts || 1)) * 100)}%` }}></div>
                                </div>
                            </div>
                            <div>
                                <div className="flex justify-between text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
                                    <span>Dead Stock Items</span>
                                    <span className="text-gray-600">{health.inventory.deadProducts}</span>
                                </div>
                                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                    <div className="h-full bg-gray-800" style={{ width: `${Math.min(100, (health.inventory.deadProducts / (health.metrics.totalProducts || 1)) * 100)}%` }}></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Stability Card */}
                    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center text-red-600">
                                    <AlertCircle className="w-5 h-5" />
                                </div>
                                <h3 className="font-bold text-gray-900">Error Frequency</h3>
                            </div>
                        </div>
                        <div className="text-center py-4">
                            <p className="text-4xl font-bold text-gray-900 mb-2">{health.stability.recentErrors24h}</p>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Errors in Last 24h</p>
                        </div>
                        <div className="mt-4 p-3 bg-gray-50 rounded-xl border border-gray-100 text-[10px] text-gray-500 leading-relaxed italic">
                            Error frequency monitoring helps identify regression bugs and API timeout issues early.
                        </div>
                    </div>

                    {/* Quick Access Card */}
                    <div className="md:col-span-2 bg-[#1A1A1A] p-8 rounded-3xl text-white flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden group">
                        <div className="relative z-10 max-w-lg">
                            <div className="flex items-center gap-2 text-[#D4AF37] text-xs font-bold uppercase tracking-[0.3em] mb-4">
                                <Server className="w-4 h-4" />
                                Maintenance Mode
                            </div>
                            <h4 className="text-2xl font-serif font-bold mb-3 italic">System is Production-Ready</h4>
                            <p className="text-gray-400 text-sm leading-relaxed">
                                All performance audits and integrity validations suggest the platform is operating at peak efficiency.
                                Automated backups and health checks are active.
                            </p>
                        </div>
                        <div className="absolute right-0 bottom-0 opacity-10 blur-2xl group-hover:opacity-20 transition-opacity">
                            <div className="w-64 h-64 bg-[#D4AF37] rounded-full"></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
