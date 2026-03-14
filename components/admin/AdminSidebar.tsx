"use client";

import { useState } from "react";
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
    Settings,
    Menu,
    X,
    Bookmark,
    Award
} from "lucide-react";

interface MenuSection {
    title: string;
    items: {
        label: string;
        icon: any;
        href: string;
    }[];
}

const menuSections: MenuSection[] = [
    {
        title: "Main",
        items: [
            { label: "overview", icon: LayoutDashboard, href: "/admin/dashboard" },
        ]
    },
    {
        title: "Catalog",
        items: [
            { label: "products", icon: ShoppingBag, href: "/admin/products" },
            { label: "categories", icon: FolderTree, href: "/admin/categories" },
            { label: "brands", icon: Award, href: "/admin/brands" },
            { label: "collections", icon: Layers, href: "/admin/collections" },
            { label: "tags", icon: Bookmark, href: "/admin/tags" },
        ]
    },
    {
        title: "Sales & CRM",
        items: [
            { label: "orders", icon: FileText, href: "/admin/orders" },
            { label: "invoices", icon: Receipt, href: "/admin/invoices" },
            { label: "customers", icon: Users, href: "/admin/customers" },
        ]
    },
    {
        title: "Operations",
        items: [
            { label: "inventory", icon: Box, href: "/admin/inventory" },
            { label: "restock", icon: PackageOpen, href: "/admin/restock" },
        ]
    },
    {
        title: "Data & BI",
        items: [
            { label: "analytics", icon: BarChart3, href: "/admin/analytics" },
            { label: "reports", icon: FileText, href: "/admin/reports" },
            { label: "logs", icon: History, href: "/admin/logs" },
        ]
    },
    {
        title: "System",
        items: [
            { label: "notifications", icon: Bell, href: "/admin/notifications" },
            { label: "settings", icon: Settings, href: "/admin/settings" },
            { label: "system", icon: Activity, href: "/admin/system" },
        ]
    }
];

export default function AdminSidebar() {
    const pathname = usePathname();
    const locale = useLocale();
    const t = useTranslations("admin.sidebar");
    const [isOpen, setIsOpen] = useState(false);

    const toggleSidebar = () => setIsOpen(!isOpen);

    return (
        <>
            {/* Mobile Toggle Button */}
            <button
                onClick={toggleSidebar}
                className="lg:hidden fixed top-6 left-6 z-[60] p-2.5 bg-white border border-gray-100 rounded-xl shadow-lg text-primary-dark active:scale-95 transition-all"
            >
                {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>

            {/* Backdrop for mobile */}
            {isOpen && (
                <div 
                    className="fixed inset-0 bg-primary-dark/40 backdrop-blur-sm z-40 lg:hidden"
                    onClick={() => setIsOpen(false)}
                />
            )}

            <aside className={`
                fixed inset-y-0 left-0 z-50 w-64 border-r border-gray-100 bg-white flex flex-col h-full shrink-0 transition-transform duration-300 ease-in-out
                ${isOpen ? "translate-x-0" : "-translate-x-full"}
                lg:translate-x-0 lg:static 
                ${locale === 'ar' ? 'rtl' : 'ltr'}
            `}>
                {/* Logo Area */}
                <div className="h-20 flex items-center px-8 border-b border-gray-100/50">
                    <Link href={`/${locale}/admin/dashboard`} className="flex items-center gap-3 group" onClick={() => setIsOpen(false)}>
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
                <nav className="flex-1 px-4 py-6 space-y-8 overflow-y-auto custom-scrollbar">
                    {menuSections.map((section) => (
                        <div key={section.title} className="space-y-2">
                            <h3 className="px-4 text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400/80">
                                {t(`sections.${section.title.toLowerCase().replace(/ & /g, '_').replace(/ /g, '_')}`)}
                            </h3>
                            <div className="space-y-1">
                                {section.items.map((item) => {
                                    const fullHref = `/${locale}${item.href}`;
                                    const isActive = pathname === fullHref || (item.href !== "/admin/dashboard" && pathname.startsWith(`${fullHref}/`));
                                    return (
                                        <Link
                                            key={item.href}
                                            href={fullHref}
                                            onClick={() => setIsOpen(false)}
                                            className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 ${isActive
                                                ? "bg-primary text-white shadow-md shadow-primary/10"
                                                : "text-gray-500 hover:bg-gray-50 hover:text-primary"
                                                }`}
                                        >
                                            <item.icon className={`w-5 h-5 ${isActive ? "text-white/90" : "text-gray-400"}`} strokeWidth={isActive ? 2 : 1.5} />
                                            <span className="text-sm font-medium tracking-wide">{t(item.label)}</span>
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </nav>

                {/* Footer / Logout */}
                <div className="p-4 border-t border-gray-100 bg-gray-50/50">
                    <LogoutButton />
                </div>
            </aside>
        </>
    );
}
