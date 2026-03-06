"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, ShoppingBag, FolderTree, FileText, Users, Box, Receipt, BarChart3, Shield, Bell, PackageOpen, History, Activity, Layers, Tag } from "lucide-react";
import LogoutButton from "./LogoutButton";

const menuItems = [
    { label: "Overview", icon: LayoutDashboard, href: "/admin/dashboard" },
    { label: "Products", icon: ShoppingBag, href: "/admin/products" },
    { label: "Categories", icon: FolderTree, href: "/admin/categories" },
    { label: "Collections", icon: Layers, href: "/admin/collections" },
    { label: "Tags", icon: Tag, href: "/admin/tags" },
    { label: "Orders & Shipping", icon: FileText, href: "/admin/orders" },
    { label: "Customers", icon: Users, href: "/admin/customers" },
    { label: "Restock Planner", icon: PackageOpen, href: "/admin/restock" },
    { label: "Inventory", icon: Box, href: "/admin/inventory" },
    { label: "Invoices", icon: Receipt, href: "/admin/invoices" },
    { label: "Analytics", icon: BarChart3, href: "/admin/analytics" },
    { label: "Reports", icon: FileText, href: "/admin/reports" },
    { label: "Activity Logs", icon: History, href: "/admin/logs" },
    { label: "System Health", icon: Activity, href: "/admin/system" },
    { label: "Notifications", icon: Bell, href: "/admin/notifications" },
];

export default function AdminSidebar() {
    const pathname = usePathname();

    return (
        <aside className="w-64 border-r border-gray-100 bg-white flex flex-col h-full shrink-0">
            {/* Logo Area */}
            <div className="h-20 flex items-center px-8 border-b border-gray-100/50">
                <Link href="/admin/dashboard" className="flex items-center gap-3 group">
                    <div className="w-8 h-8 rounded-lg bg-[#D4AF37]/10 flex items-center justify-center group-hover:bg-[#D4AF37]/20 transition-colors">
                        <Shield className="w-4 h-4 text-[#D4AF37]" strokeWidth={2} />
                    </div>
                    <div>
                        <span className="font-serif text-lg font-bold text-primary-dark block leading-none tracking-wide">LPS</span>
                        <span className="text-[9px] uppercase tracking-[0.2em] text-gray-400">Admin Portal</span>
                    </div>
                </Link>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-4 py-8 space-y-1.5 overflow-y-auto custom-scrollbar">
                {menuItems.map((item) => {
                    const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${isActive
                                ? "bg-primary text-white shadow-md shadow-primary/10"
                                : "text-gray-500 hover:bg-gray-50 hover:text-primary"
                                }`}
                        >
                            <item.icon className={`w-5 h-5 ${isActive ? "text-white/90" : "text-gray-400"}`} strokeWidth={isActive ? 2 : 1.5} />
                            <span className="text-sm font-medium tracking-wide">{item.label}</span>
                        </Link>
                    );
                })}
            </nav>

            {/* Footer / Logout */}
            <div className="p-4 border-t border-gray-100 bg-gray-50/50">
                <LogoutButton />
            </div>
        </aside>
    );
}
