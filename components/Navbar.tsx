"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Shield, User, ShoppingCart } from "lucide-react";
import { useCart } from "@/context/CartContext";
import dynamic from "next/dynamic";
import { useTranslations, useLocale } from 'next-intl';
import LanguageSwitcher from "./LanguageSwitcher";

const MiniCart = dynamic(() => import("./shop/MiniCart"), {
    ssr: false,
});
import NotificationBell from "./shop/NotificationBell";

interface NavbarProps {
    customerName?: string | null;
}

function getLinkClass(isActive: boolean, isHero: boolean): string {
    if (isActive) {
        return isHero ? "text-[#D4AF37]" : "text-primary font-semibold";
    }
    return isHero ? "text-white/70 hover:text-white" : "text-gray-500 hover:text-primary";
}

export default function Navbar({ customerName, settings }: Readonly<NavbarProps & { settings?: any }>) {
    const pathname = usePathname();
    const locale = useLocale();
    const t = useTranslations('common.nav');
    const b = useTranslations('common.buttons');
    const [mobileOpen, setMobileOpen] = useState(false);
    const { totalQuantity, setIsCartOpen } = useCart();

    const isHeroPage = pathname === `/${locale}` || pathname === `/${locale}/`;

    const navLinks = [
        { href: `/${locale}`, label: t('home') },
        { href: `/${locale}/catalog`, label: t('boutique') },
        ...(customerName
            ? [{ href: `/${locale}/account`, label: t('compte') }]
            : [{ href: `/${locale}/login`, label: b('checkout').split(' ')[0] }] // fallback if no specific login label
        ),
    ];

    return (
        <nav
            className={`fixed top-0 left-0 w-full z-50 transition-all duration-500 ${isHeroPage
                ? "bg-transparent"
                : "bg-white/90 backdrop-blur-lg border-b border-primary/10 shadow-sm"
                }`}
        >
            <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-2.5">
                {/* Logo */}
                <Link href={`/${locale}`} className="flex items-center gap-2" prefetch={true}>
                    {settings?.logo_url ? (
                        <div className="relative w-10 h-10 sm:w-12 sm:h-12 overflow-hidden rounded-full border border-primary/20 shadow-sm bg-white/10 backdrop-blur-md">
                            <img 
                                src={settings.logo_url} 
                                alt="LPS Logo" 
                                className={`w-full h-full object-cover transition-all ${isHeroPage ? 'brightness-125' : ''}`}
                            />
                        </div>
                    ) : (
                        <span
                            className={`font-serif text-2xl font-bold tracking-wider ${isHeroPage ? "text-[#D4AF37]" : "text-primary-dark"
                                }`}
                        >
                            {t('lps')}
                        </span>
                    )}
                    <div className="flex flex-col">
                        {!settings?.logo_url && (
                             <span
                                className={`text-xs uppercase tracking-[0.3em] font-serif font-bold ${isHeroPage ? "text-[#D4AF37]" : "text-primary-dark"}`}
                            >
                                {t('lps')}
                            </span>
                        )}
                        <span
                            className={`text-[9px] uppercase tracking-[0.3em] ${isHeroPage ? "text-white/60" : "text-gray-400"
                                }`}
                        >
                            {t('perfume')}
                        </span>
                    </div>
                </Link>

                {/* Desktop Links */}
                <div className="hidden md:flex items-center gap-8">
                    {navLinks.map((link) => (
                        <Link
                            key={link.href}
                            href={link.href}
                            prefetch={true}
                            className={`text-sm tracking-wide transition-colors duration-300 ${getLinkClass(pathname === link.href, isHeroPage)}`}
                        >
                            {link.label}
                        </Link>
                    ))}

                    <LanguageSwitcher isHeroPage={isHeroPage} />

                    {!customerName && (
                        <Link
                            href={`/${locale}/register`}
                            prefetch={true}
                            className={`text-sm px-5 py-2 rounded-full font-medium transition-all duration-300 ${isHeroPage
                                ? "border border-[#D4AF37]/50 text-[#D4AF37] hover:bg-[#D4AF37]/10"
                                : "bg-primary text-white hover:bg-primary-dark"
                                }`}
                        >
                            {b('register')}
                        </Link>
                    )}

                    {customerName && (
                        <Link
                            href={`/${locale}/account`}
                            prefetch={true}
                            className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-all duration-300 ${isHeroPage
                                ? "border-[#D4AF37]/30 text-[#D4AF37] hover:bg-[#D4AF37]/10"
                                : "border-primary/10 bg-primary/5 text-primary hover:bg-primary/10"
                                }`}
                        >
                            <User className="w-4 h-4" />
                            <span className="text-xs font-bold">{customerName.split(' ')[0]}</span>
                        </Link>
                    )}

                    {/* Cart Trigger */}
                    <button
                        onClick={() => setIsCartOpen(true)}
                        className={`relative p-2 rounded-full transition-all duration-300 ${isHeroPage
                            ? "text-white/70 hover:text-[#D4AF37] hover:bg-white/5"
                            : "text-gray-500 hover:text-primary hover:bg-primary/5"
                            }`}
                    >
                        <ShoppingCart className="w-5 h-5" />
                        {totalQuantity > 0 && (
                            <span className="absolute top-0 right-0 bg-primary text-white text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full border border-white">
                                {totalQuantity}
                            </span>
                        )}
                    </button>

                    <NotificationBell isHeroPage={isHeroPage} />

                    {/* Admin Portal Icon */}
                    <Link
                        href={`/${locale}/admin/login`}
                        title={t('admin_portal')}
                        prefetch={true}
                        className={`p-2 rounded-full transition-all duration-300 ${isHeroPage
                            ? "text-white/50 hover:text-[#D4AF37] hover:bg-white/5"
                            : "text-gray-400 hover:text-primary hover:bg-primary/5"
                            }`}
                    >
                        <Shield className="w-5 h-5" strokeWidth={1.5} />
                    </Link>
                </div>

                {/* Mobile Icons + Toggle */}
                <div className="md:hidden flex items-center gap-2">
                    <LanguageSwitcher isHeroPage={isHeroPage} />
                    {/* Mobile Cart Trigger */}
                    <button
                        onClick={() => setIsCartOpen(true)}
                        className={`relative p-2 rounded-full ${isHeroPage ? "text-white/70" : "text-gray-500"}`}
                    >
                        <ShoppingCart className="w-5 h-5" />
                        {totalQuantity > 0 && (
                            <span className="absolute top-0 right-0 bg-primary text-white text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full border border-white">
                                {totalQuantity}
                            </span>
                        )}
                    </button>
                    <NotificationBell isHeroPage={isHeroPage} />
                    <Link
                        href={`/${locale}/admin/login`}
                        prefetch={true}
                        className={`p-1.5 rounded-full ${isHeroPage ? "text-white/70" : "text-gray-500"}`}
                    >
                        <Shield className="w-5 h-5" strokeWidth={1.5} />
                    </Link>
                    <button
                        className="flex flex-col gap-1.5"
                        onClick={() => setMobileOpen(!mobileOpen)}
                        aria-label="Toggle menu"
                    >
                        <span className={`block w-6 h-0.5 transition-all ${isHeroPage ? "bg-white" : "bg-gray-700"} ${mobileOpen ? "rotate-45 translate-y-2" : ""}`} />
                        <span className={`block w-6 h-0.5 transition-all ${isHeroPage ? "bg-white" : "bg-gray-700"} ${mobileOpen ? "opacity-0" : ""}`} />
                        <span className={`block w-6 h-0.5 transition-all ${isHeroPage ? "bg-white" : "bg-gray-700"} ${mobileOpen ? "-rotate-45 -translate-y-2" : ""}`} />
                    </button>
                </div>
            </div>

            {/* Mobile Menu */}
            {
                mobileOpen && (
                    <div className={`md:hidden px-6 pb-6 ${isHeroPage ? "bg-black/80 backdrop-blur-lg" : "bg-white"}`}>
                        {navLinks.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                prefetch={true}
                                onClick={() => setMobileOpen(false)}
                                className={`block py-3 text-sm tracking-wide border-b ${isHeroPage
                                    ? "text-white/80 border-white/10"
                                    : "text-gray-600 border-gray-100"
                                    }`}
                            >
                                {link.label}
                            </Link>
                        ))}
                        {!customerName && (
                            <Link
                                href={`/${locale}/register`}
                                prefetch={true}
                                onClick={() => setMobileOpen(false)}
                                className="block mt-4 text-center text-sm px-5 py-2.5 rounded-full bg-primary text-white"
                            >
                                {b('register')}
                            </Link>
                        )}
                        {customerName && (
                            <Link
                                href={`/${locale}/account`}
                                prefetch={true}
                                onClick={() => setMobileOpen(false)}
                                className="block mt-4 text-center text-sm px-5 py-2.5 rounded-full bg-primary text-white"
                            >
                                {b('my_account')} ({customerName.split(' ')[0]})
                            </Link>
                        )}
                    </div>
                )
            }
            {/* Mini Cart Component */}
            <MiniCart />
        </nav >
    );
}
