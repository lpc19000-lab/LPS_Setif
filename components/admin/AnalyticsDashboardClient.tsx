"use client";

import { useMemo } from "react";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
    LineChart, Line, AreaChart, Area
} from "recharts";
import { TrendingUp, Users, ShoppingBag, AlertTriangle, ArrowUpRight } from "lucide-react";
import Image from "next/image";
import { useTranslations, useLocale } from "next-intl";

type AnalyticsData = {
    productAnalytics: any[];
    revenueMetrics: { dailyRevenue: any[]; monthlyRevenue: any[] };
    topCustomers: any[];
    profitSnapshot: {
        dailyProfit: any[];
        globalMarginPercent: number;
        overallProfit: number;
        topProfitableProducts: any[];
    };
};

export default function AnalyticsDashboardClient({ productAnalytics, revenueMetrics, topCustomers, profitSnapshot }: AnalyticsData) {
    const t = useTranslations("admin.analytics");
    const locale = useLocale();

    const formatCurrency = (amt: number) => new Intl.NumberFormat(locale === "ar" ? "ar-DZ" : "fr-FR", { style: "currency", currency: "DZD", maximumFractionDigits: 0 }).format(amt);

    // Summary stats
    const totalRevenue30d = useMemo(() => revenueMetrics.dailyRevenue.reduce((sum, d) => sum + d.revenue, 0), [revenueMetrics]);
    const totalOrders30d = useMemo(() => revenueMetrics.dailyRevenue.reduce((sum, d) => sum + d.orders, 0), [revenueMetrics]);

    return (
        <div className="space-y-8 pb-20">
            {/* Top Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-[100px] -mr-8 -mt-8" />
                    <div className="flex items-center gap-3 relative z-10">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                            <TrendingUp className="w-5 h-5" />
                        </div>
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">{t("stats.revenue_30d")}</h3>
                    </div>
                    <p className="text-3xl font-serif font-bold text-primary-dark relative z-10">{formatCurrency(totalRevenue30d)}</p>
                </div>

                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-bl-[100px] -mr-8 -mt-8" />
                    <div className="flex items-center gap-3 relative z-10">
                        <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                            <ShoppingBag className="w-5 h-5" />
                        </div>
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">{t("stats.orders_30d")}</h3>
                    </div>
                    <p className="text-3xl font-serif font-bold text-primary-dark relative z-10">{totalOrders30d}</p>
                </div>

                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-[#D4AF37]/5 rounded-bl-[100px] -mr-8 -mt-8" />
                    <div className="flex items-center gap-3 relative z-10">
                        <div className="w-10 h-10 rounded-full bg-[#D4AF37]/10 flex items-center justify-center text-[#D4AF37]">
                            <Users className="w-5 h-5" />
                        </div>
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">{t("stats.top_buyers")}</h3>
                    </div>
                    <p className="text-3xl font-serif font-bold text-primary-dark relative z-10">{topCustomers.length}</p>
                </div>

                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-bl-[100px] -mr-8 -mt-8" />
                    <div className="flex items-center gap-3 relative z-10">
                        <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600">
                            <TrendingUp className="w-5 h-5" />
                        </div>
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">{t("stats.profit_30d")}</h3>
                    </div>
                    <p className="text-3xl font-serif font-bold text-primary-dark relative z-10">{formatCurrency(profitSnapshot.overallProfit)}</p>
                </div>

                <div className="bg-primary-dark rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4 relative overflow-hidden text-white">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-bl-[100px] -mr-8 -mt-8" />
                    <div className="flex items-center gap-3 relative z-10">
                        <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white">
                            <ArrowUpRight className="w-5 h-5" />
                        </div>
                        <h3 className="text-xs font-bold text-white/60 uppercase tracking-widest">{t("stats.high_demand")}</h3>
                    </div>
                    <p className="text-3xl font-serif font-bold text-[#D4AF37] relative z-10">
                        {productAnalytics.filter(p => p.demandForecast === "High Demand").length}
                    </p>
                </div>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                    <div className="mb-6">
                        <h2 className="text-lg font-bold text-primary-dark">{t("charts.daily_revenue")}</h2>
                    </div>
                    <div className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={revenueMetrics.dailyRevenue} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#1E2A38" stopOpacity={0.1} />
                                        <stop offset="95%" stopColor="#1E2A38" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9ca3af' }} tickFormatter={(val) => val.slice(5)} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9ca3af' }} tickFormatter={(val) => `${val / 1000}k`} />
                                <RechartsTooltip
                                    formatter={(value: any) => [formatCurrency(Number(value) || 0), t("charts.revenue")]}
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                />
                                <Area type="monotone" dataKey="revenue" stroke="#1E2A38" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                    <div className="mb-6 flex items-center justify-between">
                        <h2 className="text-lg font-bold text-primary-dark">{t("charts.daily_profit_cost")}</h2>
                        <div className="px-3 py-1 bg-purple-50 text-purple-700 rounded-full text-xs font-bold border border-purple-100">
                            {t("charts.avg_margin")} {profitSnapshot.globalMarginPercent.toFixed(1)}%
                        </div>
                    </div>
                    <div className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={profitSnapshot.dailyProfit} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#9333ea" stopOpacity={0.1} />
                                        <stop offset="95%" stopColor="#9333ea" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorCost" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.1} />
                                        <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9ca3af' }} tickFormatter={(val) => val.slice(5)} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9ca3af' }} tickFormatter={(val) => `${val / 1000}k`} />
                                <RechartsTooltip
                                    formatter={(value: any, name: any) => [
                                        formatCurrency(Number(value) || 0),
                                        name === "profit" ? t("charts.profit") : name === "cost" ? t("charts.cost") : String(name)
                                    ]}
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                />
                                <Area type="monotone" dataKey="profit" stroke="#9333ea" strokeWidth={3} fillOpacity={1} fill="url(#colorProfit)" />
                                <Area type="monotone" dataKey="cost" stroke="#f43f5e" strokeWidth={2} fillOpacity={1} fill="url(#colorCost)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                    <div className="mb-6">
                        <h2 className="text-lg font-bold text-primary-dark">{t("charts.daily_orders")}</h2>
                    </div>
                    <div className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={revenueMetrics.dailyRevenue} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9ca3af' }} tickFormatter={(val) => val.slice(5)} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9ca3af' }} />
                                <RechartsTooltip
                                    cursor={{ fill: '#f9fafb' }}
                                    formatter={(value: any) => [value, t("charts.orders")]}
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                />
                                <Bar dataKey="orders" fill="#D4AF37" radius={[4, 4, 0, 0]} maxBarSize={40} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Product Performance Table */}
                <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden lg:col-span-2 flex flex-col">
                    <div className="p-6 border-b border-gray-50 flex items-center justify-between">
                        <h2 className="text-lg font-bold text-primary-dark">{t("performance.title")}</h2>
                    </div>
                    <div className="overflow-x-auto flex-1 custom-scrollbar max-h-[500px]">
                        <table className="w-full text-sm text-left relative">
                            <thead className="bg-gray-50/50 text-xs text-gray-400 uppercase tracking-widest sticky top-0 z-10 backdrop-blur-md">
                                <tr>
                                    <th className="px-6 py-4 font-bold">{t("performance.table.product")}</th>
                                    <th className="px-6 py-4 font-bold text-center">{t("performance.table.demand")}</th>
                                    <th className="px-6 py-4 font-bold text-right rtl:text-left">{t("performance.table.lifetime_sold")}</th>
                                    <th className="px-6 py-4 font-bold text-right rtl:text-left">{t("performance.table.revenue")}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {productAnalytics.map(p => (
                                    <tr key={p.id} className="hover:bg-gray-50/30 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-lg bg-gray-50 overflow-hidden relative shrink-0 border border-gray-100">
                                                    <Image src={p.imageUrl || 'https://images.unsplash.com/photo-1594035910387-fea47794261f?w=100'} alt={p.name} fill className="object-cover" />
                                                </div>
                                                <div>
                                                    <div className="font-bold text-gray-900 line-clamp-1">{p.name}</div>
                                                    <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">{p.brand}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="flex flex-col items-center gap-1">
                                                <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-widest ${p.demandForecast === "High Demand" ? "bg-emerald-50 text-emerald-600 border border-emerald-100" :
                                                    p.demandForecast === "Medium Demand" ? "bg-amber-50 text-amber-600 border border-amber-100" :
                                                        "bg-gray-50 text-gray-500 border border-gray-100"
                                                    }`}>
                                                    {t(`performance.demand_levels.${p.demandForecast}`)}
                                                </span>
                                                <span className="text-xs text-gray-500 font-medium">({p.recentUnits30d} {t("performance.units")})</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <span className="font-bold text-gray-900 text-base">{p.totalUnitsSold}</span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <span className="font-bold text-primary-dark">{formatCurrency(p.totalRevenue)}</span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Top Customers LTV */}
                <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
                    <div className="p-6 border-b border-gray-50">
                        <h2 className="text-lg font-bold text-primary-dark">{t("top_customers.title")}</h2>
                        <p className="text-xs text-gray-500 mt-1">{t("top_customers.subtitle")}</p>
                    </div>
                    <div className="p-2 space-y-1 overflow-y-auto custom-scrollbar max-h-[500px]">
                        {topCustomers.map((c, i) => (
                            <div key={c.id} className="p-4 rounded-2xl hover:bg-gray-50 transition-colors group flex items-start gap-4">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${i === 0 ? "bg-[#D4AF37] text-white shadow-md shadow-[#D4AF37]/30" :
                                    i === 1 ? "bg-gray-200 text-gray-600" :
                                        i === 2 ? "bg-amber-700/20 text-amber-800" :
                                            "bg-gray-50 text-gray-400 border border-gray-100"
                                    }`}>
                                    #{i + 1}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-bold text-gray-900 truncate">{c.shopName}</h4>
                                    <p className="text-xs text-gray-500 truncate">{c.name} • {c.orderCount} {t("top_customers.orders")}</p>
                                    <p className="font-serif font-bold text-primary-dark text-lg mt-1">{formatCurrency(c.totalSpent)}</p>
                                </div>
                            </div>
                        ))}
                        {topCustomers.length === 0 && (
                            <div className="p-8 text-center text-gray-400 text-sm">{t("top_customers.no_data")}</div>
                        )}
                    </div>
                </div>

                {/* Top Profitable Products */}
                <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
                    <div className="p-6 border-b border-gray-50">
                        <h2 className="text-lg font-bold text-primary-dark">{t("top_profitable.title")}</h2>
                        <p className="text-xs text-gray-500 mt-1">{t("top_profitable.subtitle")}</p>
                    </div>
                    <div className="p-2 space-y-1 overflow-y-auto custom-scrollbar max-h-[500px]">
                        {profitSnapshot.topProfitableProducts.map((p, i) => (
                            <div key={p.id} className="p-4 rounded-2xl hover:bg-gray-50 transition-colors group flex items-start gap-4">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${i === 0 ? "bg-purple-600 text-white shadow-md shadow-purple-600/30" :
                                    i === 1 ? "bg-gray-200 text-gray-600" :
                                        i === 2 ? "bg-amber-700/20 text-amber-800" :
                                            "bg-gray-50 text-gray-400 border border-gray-100"
                                    }`}>
                                    #{i + 1}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-bold text-gray-900 truncate">{p.name}</h4>
                                    <p className="text-xs text-gray-500 truncate">{p.unitsSold} {t("top_profitable.units_sold")} • {p.marginPercent.toFixed(1)}% {t("top_profitable.margin")}</p>
                                    <p className="font-serif font-bold text-purple-700 text-lg mt-1">{formatCurrency(p.totalProfit)}</p>
                                </div>
                            </div>
                        ))}
                        {profitSnapshot.topProfitableProducts.length === 0 && (
                            <div className="p-8 text-center text-gray-400 text-sm">{t("top_profitable.no_data")}</div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
