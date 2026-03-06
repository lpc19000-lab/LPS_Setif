"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard,
    Package,
    ShoppingBag,
    Users,
    FileText,
    Settings,
    LogOut
} from "lucide-react";
import { cn } from "@/utils/cn";

const menuItems = [
    { icon: LayoutDashboard, label: "Overview", href: "/admin/dashboard" },
    { icon: ShoppingBag, label: "Orders", href: "/admin/orders" },
    { icon: Package, label: "Products", href: "/admin/products" },
    { icon: Users, label: "Customers", href: "/admin/customers" },
    { icon: FileText, label: "Invoices", href: "/admin/invoices" },
];

export default function AdminSidebar() {
    const pathname = usePathname();

    return (
        <aside className="w-64 bg-white border-r border-gray-100 flex flex-col h-screen sticky top-0">
            <div className="p-8">
                <h1 className="text-xl font-serif font-bold text-primary tracking-tighter">
                    LPS ADMIN
                </h1>
            </div>

            <nav className="flex-grow px-4 space-y-2 mt-4">
                {menuItems.map((item) => (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                            "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200",
                            pathname === item.href
                                ? "bg-primary/10 text-primary shadow-sm"
                                : "text-gray-500 hover:bg-gray-50 hover:text-text"
                        )}
                    >
                        <item.icon size={20} />
                        {item.label}
                    </Link>
                ))}
            </nav>

            <div className="p-4 mt-auto border-t border-gray-50">
                <button className="flex items-center gap-3 w-full px-4 py-3 text-sm font-medium text-gray-400 hover:text-red-500 transition-colors">
                    <LogOut size={20} />
                    Logout
                </button>
            </div>
        </aside>
    );
}
