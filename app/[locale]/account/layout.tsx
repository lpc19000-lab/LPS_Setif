import { ReactNode } from "react";
import Link from "next/link";
import { Package, User, RefreshCcw, LogOut, ChevronRight } from "lucide-react";
import LogoutButton from "@/components/shop/LogoutButton";

export default function AccountLayout({ children }: { children: ReactNode }) {
    const navItems = [
        { href: "/account", label: "Dashboard", icon: <User className="w-5 h-5" /> },
        { href: "/account/orders", label: "My Orders", icon: <Package className="w-5 h-5" /> },
        { href: "/catalog", label: "Reorder Products", icon: <RefreshCcw className="w-5 h-5" /> },
    ];

    return (
        <div className="min-h-screen bg-gray-50 pt-20 pb-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    {/* Sidebar */}
                    <aside className="lg:col-span-1">
                        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden sticky top-24">
                            <div className="p-6 bg-primary-dark text-white">
                                <h2 className="font-serif font-bold text-xl tracking-tight">My Account</h2>
                                <p className="text-xs text-white/50 uppercase tracking-widest mt-1">LPS Wholesale Partner</p>
                            </div>
                            <nav className="p-2">
                                {navItems.map((item) => (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        className="flex items-center justify-between gap-3 px-4 py-3.5 rounded-2xl text-gray-600 hover:bg-gray-50 hover:text-primary transition-all group"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="text-gray-400 group-hover:text-primary transition-colors">
                                                {item.icon}
                                            </div>
                                            <span className="font-semibold text-sm">{item.label}</span>
                                        </div>
                                        <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-all translate-x-[-4px] group-hover:translate-x-0" />
                                    </Link>
                                ))}
                                <div className="mt-4 pt-4 border-t border-gray-50">
                                    <LogoutButton variant="trader" />
                                </div>
                            </nav>
                        </div>
                    </aside>

                    {/* Content Area */}
                    <main className="lg:col-span-3">
                        {children}
                    </main>
                </div>
            </div>
        </div>
    );
}
