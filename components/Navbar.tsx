"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Shield, User, ShoppingCart } from "lucide-react";
import { useCart } from "@/context/CartContext";
import MiniCart from "./shop/MiniCart";

interface NavbarProps {
    customerName?: string | null;
}

export default function Navbar({ customerName }: NavbarProps) {
    const pathname = usePathname();
    const [mobileOpen, setMobileOpen] = useState(false);
    const { totalQuantity, setIsCartOpen } = useCart();

    const isHeroPage = pathname === "/";

    const navLinks = [
        { href: "/", label: "Home" },
        { href: "/catalog", label: "Catalog" },
        ...(customerName
            ? [{ href: "/account", label: "Account" }]
            : [{ href: "/login", label: "Login" }]
        ),
    ];

    return (
        <nav
            className={`fixed top-0 left-0 w-full z-50 transition-all duration-500 ${isHeroPage
                ? "bg-transparent"
                : "bg-white/90 backdrop-blur-lg border-b border-primary/10 shadow-sm"
                }`}
        >
            <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-4">
                {/* Logo */}
                <Link href="/" className="flex items-center gap-2" prefetch={true}>
                    <span
                        className={`font-serif text-2xl font-bold tracking-wider ${isHeroPage ? "text-[#D4AF37]" : "text-primary-dark"
                            }`}
                    >
                        LPS
                    </span>
                    <span
                        className={`text-xs uppercase tracking-[0.3em] ${isHeroPage ? "text-white/60" : "text-gray-400"
                            }`}
                    >
                        Perfume
                    </span>
                </Link>

                {/* Desktop Links */}
                <div className="hidden md:flex items-center gap-8">
                    {navLinks.map((link) => (
                        <Link
                            key={link.href}
                            href={link.href}
                            prefetch={true}
                            className={`text-sm tracking-wide transition-colors duration-300 ${pathname === link.href
                                ? isHeroPage
                                    ? "text-[#D4AF37]"
                                    : "text-primary font-semibold"
                                : isHeroPage
                                    ? "text-white/70 hover:text-white"
                                    : "text-gray-500 hover:text-primary"
                                }`}
                        >
                            {link.label}
                        </Link>
                    ))}

                    {!customerName && (
                        <Link
                            href="/register"
                            prefetch={true}
                            className={`text-sm px-5 py-2 rounded-full font-medium transition-all duration-300 ${isHeroPage
                                ? "border border-[#D4AF37]/50 text-[#D4AF37] hover:bg-[#D4AF37]/10"
                                : "bg-primary text-white hover:bg-primary-dark"
                                }`}
                        >
                            Register
                        </Link>
                    )}

                    {customerName && (
                        <Link
                            href="/account"
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
                            <span className="absolute 0 top-0 right-0 bg-primary text-white text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full border border-white">
                                {totalQuantity}
                            </span>
                        )}
                    </button>

                    {/* Admin Portal Icon */}
                    <Link
                        href="/admin/login"
                        title="Admin Portal"
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
                    <Link
                        href="/admin/login"
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
                                href="/register"
                                prefetch={true}
                                onClick={() => setMobileOpen(false)}
                                className="block mt-4 text-center text-sm px-5 py-2.5 rounded-full bg-primary text-white"
                            >
                                Register
                            </Link>
                        )}
                        {customerName && (
                            <Link
                                href="/account"
                                prefetch={true}
                                onClick={() => setMobileOpen(false)}
                                className="block mt-4 text-center text-sm px-5 py-2.5 rounded-full bg-primary text-white"
                            >
                                My Account ({customerName.split(' ')[0]})
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
