import prisma from "@/lib/db";
import InventoryManagerClient from "@/components/admin/InventoryManagerClient";
import { PackageSearch, History } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AdminInventoryPage() {
    const products = await prisma.product.findMany({
        orderBy: [{ stockQuantity: 'asc' }],
    });

    return (
        <div className="p-8 max-w-7xl mx-auto animate-in fade-in duration-500">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-8">
                <div>
                    <h1 className="text-3xl font-serif font-bold text-primary-dark tracking-tight flex items-center gap-3">
                        <PackageSearch className="w-8 h-8 text-[#D4AF37]" />
                        Warehouse Overview
                    </h1>
                    <p className="text-sm text-gray-500 mt-2 font-medium">Manage stock levels, perform adjustments, and view inventory history.</p>
                </div>
                <Link
                    href="/admin/inventory/history"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-gray-50 hover:bg-gray-100 text-gray-700 text-sm font-bold uppercase tracking-widest rounded-2xl transition-all border border-gray-100 shadow-sm"
                >
                    <History className="w-4 h-4" /> Move History
                </Link>
            </div>

            <InventoryManagerClient initialProducts={products} />
        </div>
    );
}
