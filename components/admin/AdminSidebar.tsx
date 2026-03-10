"use client";

import { useTranslations, useLocale } from "next-intl";
import LogoutButton from "./LogoutButton";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard,
    ShoppingBag,
    FolderTree,
    Layers,
    Tag,
    FileText,
    Users,
    PackageOpen,
    Box,
    Receipt,
    BarChart3,
    History,
    Activity,
    Bell,
    Shield
} from "lucide-react";

const menuItems = [
    { label: "overview", icon: LayoutDashboard, href: "/admin/dashboard" },
    { label: "products", icon: ShoppingBag, href: "/admin/products" },
    { label: "categories", icon: FolderTree, href: "/admin/categories" },
    { label: "collections", icon: Layers, href: "/admin/collections" },
    { label: "tags", icon: Tag, href: "/admin/tags" },
    { label: "orders", icon: FileText, href: "/admin/orders" },
    { label: "customers", icon: Users, href: "/admin/customers" },
    { label: "restock", icon: PackageOpen, href: "/admin/restock" },
    { label: "inventory", icon: Box, href: "/admin/inventory" },
    { label: "invoices", icon: Receipt, href: "/admin/invoices" },
    { label: "analytics", icon: BarChart3, href: "/admin/analytics" },
    { label: "reports", icon: FileText, href: "/admin/reports" },
    { label: "logs", icon: History, href: "/admin/logs" },
    { label: "system", icon: Activity, href: "/admin/system" },
    { label: "notifications", icon: Bell, href: "/admin/notifications" },
];

export default function AdminSidebar() {
    const pathname = usePathname();
    const locale = useLocale();
    const t = useTranslations("admin.sidebar");

    return (
        <aside className={`w-64 border-r border-gray-100 bg-white flex flex-col h-full shrink-0 ${locale === 'ar' ? 'rtl' : 'ltr'}`}>
            {/* Logo Area */}
            <div className="h-20 flex items-center px-8 border-b border-gray-100/50">
                <Link href={`/${locale}/admin/dashboard`} className="flex items-center gap-3 group">
                    <div className="w-8 h-8 rounded-lg bg-[#D4AF37]/10 flex items-center justify-center group-hover:bg-[#D4AF37]/20 transition-colors">
                        <Shield className="w-4 h-4 text-[#D4AF37]" strokeWidth={2} />
                    </div>
                    <div>
                        <span className="font-serif text-lg font-bold text-primary-dark block leading-none tracking-wide">LPS</span>
                        <span className="text-[9px] uppercase tracking-[0.2em] text-gray-400">{t("portal")}</span>
                    </div>
                </Link>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-4 py-8 space-y-1.5 overflow-y-auto custom-scrollbar">
                {menuItems.map((item) => {
                    const fullHref = `/${locale}${item.href}`;
                    const isActive = pathname === fullHref || (item.href !== "/admin/dashboard" && pathname.startsWith(`${fullHref}/`));
                    return (
                        <Link
                            key={item.href}
                            href={fullHref}
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${isActive
                                ? "bg-primary text-white shadow-md shadow-primary/10"
                                : "text-gray-500 hover:bg-gray-50 hover:text-primary"
                                }`}
                        >
                            <item.icon className={`w-5 h-5 ${isActive ? "text-white/90" : "text-gray-400"}`} strokeWidth={isActive ? 2 : 1.5} />
                            <span className="text-sm font-medium tracking-wide">{t(item.label)}</span>
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
