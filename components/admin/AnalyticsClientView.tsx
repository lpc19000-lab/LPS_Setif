"use client";

import { useState, useEffect } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

interface ChartDataPoint {
    date: string;
    revenue: number;
    orders: number;
    newCustomers: number;
}

export default function AnalyticsClientView({ data }: { data: ChartDataPoint[] }) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return <div className="h-[400px] bg-white rounded-2xl animate-pulse" />; // Hydration skeleton placeholder
    }

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('en-DZ', {
            style: 'currency',
            currency: 'DZD',
            maximumFractionDigits: 0
        }).format(value);
    };

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-xl">
                    <p className="font-semibold text-gray-900 mb-2">{label}</p>
                    {payload.map((entry: any, index: number) => (
                        <div key={index} className="flex items-center gap-2 text-sm">
                            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
                            <span className="text-gray-600 capitalize">{entry.name}:</span>
                            <span className="font-medium text-gray-900">
                                {entry.dataKey === 'revenue' ? formatCurrency(entry.value) : entry.value}
                            </span>
                        </div>
                    ))}
                </div>
            );
        }
        return null;
    };

    return (
        <div className="space-y-6">
            <div className="bg-white p-6 sm:p-8 rounded-2xl border border-primary/10 shadow-sm relative overflow-hidden">
                <div className="mb-6">
                    <h2 className="text-lg font-bold text-primary-dark">Revenue Trend (7-Day)</h2>
                    <p className="text-sm text-gray-500">Gross income excluding cancelled operations.</p>
                </div>
                <div className="h-[350px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data} margin={{ top: 10, right: 30, left: 20, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#D4AF37" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                            <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} dy={10} />
                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                                tick={{ fill: '#9ca3af', fontSize: 12 }}
                            />
                            <Tooltip content={<CustomTooltip />} />
                            <Area type="monotone" dataKey="revenue" stroke="#D4AF37" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white p-6 sm:p-8 rounded-2xl border border-primary/10 shadow-sm relative overflow-hidden">
                    <div className="mb-6">
                        <h2 className="text-lg font-bold text-primary-dark">Orders Volume</h2>
                        <p className="text-sm text-gray-500">Daily number of placed orders.</p>
                    </div>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data} margin={{ top: 10, right: 30, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} />
                                <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8f9fa' }} />
                                <Bar dataKey="orders" fill="#1e3a8a" radius={[4, 4, 0, 0]} barSize={30} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-white p-6 sm:p-8 rounded-2xl border border-primary/10 shadow-sm relative overflow-hidden">
                    <div className="mb-6">
                        <h2 className="text-lg font-bold text-primary-dark">Customer Acquisitions</h2>
                        <p className="text-sm text-gray-500">New verified customer registrations.</p>
                    </div>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data} margin={{ top: 10, right: 30, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} allowDecimals={false} />
                                <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8f9fa' }} />
                                <Bar dataKey="newCustomers" fill="#059669" radius={[4, 4, 0, 0]} barSize={30} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
}
