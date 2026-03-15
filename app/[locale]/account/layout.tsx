import { ReactNode } from "react";
import Link from "next/link";
import { 
    LayoutDashboard, 
    ShoppingBag, 
    RefreshCcw, 
    Settings, 
    ChevronRight,
    User,
    LogOut,
    ShoppingCart
} from "lucide-react";
import LogoutButton from "@/components/shop/LogoutButton";
import { getTranslations } from "next-intl/server";
import { requireCustomerSession } from "@/lib/customer-auth";

interface Props {
    children: ReactNode;
    params: Promise<{ locale: string }>;
}

export default async function AccountLayout({ children, params }: Props) {
    await requireCustomerSession();
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: "account" });
    const isRtl = locale === 'ar';

    const navItems = [
        { href: `/${locale}/account`, label: t("dashboard"), icon: LayoutDashboard },
        { href: `/${locale}/account/orders`, label: t("my_orders"), icon: ShoppingBag },
        { href: `/${locale}/catalog`, label: t("reorder"), icon: ShoppingCart },
        { href: `/${locale}/account/settings`, label: t("settings"), icon: Settings },
    ];

    return (
        <div className={`min-h-screen bg-[#FDFBF7] pt-28 pb-12 ${isRtl ? 'rtl' : 'ltr'}`}>
            <div className="max-w-7xl mx-auto px-6">
                <div className={`grid grid-cols-1 lg:grid-cols-4 gap-8 ${isRtl ? 'lg:flex lg:flex-row-reverse' : ''}`}>
                    {/* Sidebar */}
                    <aside className="lg:col-span-1">
                        <div className="bg-white rounded-3xl border border-gray-100 shadow-xl shadow-gray-200/50 overflow-hidden sticky top-28">
                            <div className="p-8 bg-primary-dark">
                                <div className="flex items-center gap-3 mb-1">
                                    <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                                        <User className="w-4 h-4 text-primary" />
                                    </div>
                                    <h2 className="font-serif font-bold text-lg text-white tracking-tight">{t("my_account")}</h2>
                                </div>
                                <p className="text-[10px] text-white/40 uppercase tracking-[0.2em] font-black">{t("trader_partner")}</p>
                            </div>
                            
                            <nav className="p-4 space-y-1">
                                {navItems.map((item) => {
                                    const Icon = item.icon;
                                    return (
                                        <Link
                                            key={item.href}
                                            href={item.href}
                                            className={`flex items-center justify-between group px-4 py-4 rounded-2xl transition-all duration-300 hover:bg-primary/5 hover:scale-[1.02] active:scale-[0.98] ${isRtl ? 'flex-row-reverse' : ''}`}
                                        >
                                            <div className={`flex items-center gap-4 ${isRtl ? 'flex-row-reverse' : ''}`}>
                                                <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-white group-hover:text-primary group-hover:shadow-md transition-all">
                                                    <Icon className="w-5 h-5" />
                                                </div>
                                                <span className="font-bold text-sm text-gray-600 group-hover:text-gray-900 transition-colors">{item.label}</span>
                                            </div>
                                            <ChevronRight className={`w-4 h-4 text-gray-300 group-hover:text-primary transition-all ${isRtl ? 'rotate-180' : ''}`} />
                                        </Link>
                                    );
                                })}
                                
                                <div className="pt-4 mt-4 border-t border-gray-50">
                                    <LogoutButton variant="trader" />
                                </div>
                            </nav>
                        </div>
                    </aside>

                    {/* Content Area */}
                    <main className="lg:col-span-3">
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 fill-mode-both">
                            {children}
                        </div>
                    </main>
                </div>
            </div>
        </div>
    );
}
