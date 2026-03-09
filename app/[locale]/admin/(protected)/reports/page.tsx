"use client";

import { FileText, Download, TrendingUp, Users, PackageSearch } from "lucide-react";

export default function ReportsPage() {

    const handleExport = (type: string) => {
        // Just navigate to the API route which will trigger the download
        window.location.href = `/api/admin/reports/export?type=${type}`;
    };

    return (
        <div className="p-8 max-w-7xl mx-auto animate-in fade-in duration-500">
            <div className="mb-8">
                <h1 className="text-3xl font-serif font-bold text-primary-dark tracking-tight flex items-center gap-3">
                    <FileText className="w-8 h-8 text-[#D4AF37]" />
                    Business Reports
                </h1>
                <p className="text-sm text-gray-500 mt-2 font-medium">Export raw data into CSV formats for in-depth analysis and accounting.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                {/* Inventory Report Card */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col items-start hover:shadow-md transition-shadow">
                    <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
                        <PackageSearch className="w-6 h-6" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">Inventory Report</h3>
                    <p className="text-sm text-gray-500 mb-6 flex-1">
                        Current snapshot of warehouse stock, low-stock thresholds, and pricing data for all products.
                    </p>
                    <button
                        onClick={() => handleExport("inventory")}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-50 hover:bg-primary-dark hover:text-white text-gray-700 text-sm font-bold uppercase tracking-widest rounded-xl transition-colors border border-gray-100 group"
                    >
                        <Download className="w-4 h-4 group-hover:-translate-y-0.5 transition-transform" />
                        Export CSV
                    </button>
                </div>

                {/* Sales Report Card */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col items-start hover:shadow-md transition-shadow">
                    <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4">
                        <TrendingUp className="w-6 h-6" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">Sales Report</h3>
                    <p className="text-sm text-gray-500 mb-6 flex-1">
                        Full history of valid orders, including dates, exact revenue figures, and connected customers.
                    </p>
                    <button
                        onClick={() => handleExport("sales")}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-50 hover:bg-primary-dark hover:text-white text-gray-700 text-sm font-bold uppercase tracking-widest rounded-xl transition-colors border border-gray-100 group"
                    >
                        <Download className="w-4 h-4 group-hover:-translate-y-0.5 transition-transform" />
                        Export CSV
                    </button>
                </div>

                {/* Customers Report Card */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col items-start hover:shadow-md transition-shadow">
                    <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-4">
                        <Users className="w-6 h-6" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">Customers Report</h3>
                    <p className="text-sm text-gray-500 mb-6 flex-1">
                        List of all B2B clients on the platform, combined with their lifetime value and total purchase count.
                    </p>
                    <button
                        onClick={() => handleExport("customers")}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-50 hover:bg-primary-dark hover:text-white text-gray-700 text-sm font-bold uppercase tracking-widest rounded-xl transition-colors border border-gray-100 group"
                    >
                        <Download className="w-4 h-4 group-hover:-translate-y-0.5 transition-transform" />
                        Export CSV
                    </button>
                </div>

            </div>
        </div>
    );
}
