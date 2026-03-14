"use client";

import Link from "next/link";
import { Facebook, Mail, MapPin, Phone, MessageCircle } from "lucide-react";
import { useTranslations, useLocale } from "next-intl";

interface FooterProps {
    settings: {
        whatsapp_number: string;
        facebook_page: string;
        contact_email: string | null;
        store_address: string | null;
    };
}

export default function Footer({ settings }: FooterProps) {
    const t = useTranslations("common");
    const locale = useLocale();

    return (
        <footer className="relative bg-[#0F0F0F] text-white pt-20 pb-10 overflow-hidden">
            {/* Background Accent */}
            <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-[#D4AF37]/30 to-transparent" />
            
            <div className="max-w-7xl mx-auto px-6 relative z-10">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
                    {/* Brand Info */}
                    <div className="space-y-6">
                        <Link href={`/${locale}`} className="flex items-center gap-2">
                            <span className="font-serif text-3xl font-bold text-[#D4AF37] tracking-tight">
                                {t("nav.lps")}
                            </span>
                            <span className="text-xs uppercase tracking-[0.4em] text-white/40 mt-1">
                                {t("nav.perfume")}
                            </span>
                        </Link>
                        <p className="text-white/50 text-sm leading-relaxed max-w-xs">
                            Premium B2B wholesale platform for perfume distributors in Algeria. Luxury fragrances at wholesale prices.
                        </p>
                        <div className="flex items-center gap-4">
                            <a 
                                href={`https://facebook.com/${settings.facebook_page}`} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center hover:bg-[#D4AF37] hover:border-transparent transition-all duration-300 group"
                            >
                                <Facebook className="w-5 h-5 text-white/40 group-hover:text-white" />
                            </a>
                            <a 
                                href={`https://wa.me/${settings.whatsapp_number.replace(/\+/g, '')}`}
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center hover:bg-green-600 hover:border-transparent transition-all duration-300 group"
                            >
                                <MessageCircle className="w-5 h-5 text-white/40 group-hover:text-white" />
                            </a>
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div className="space-y-6">
                        <h4 className="text-sm font-bold uppercase tracking-widest text-[#D4AF37]">
                            {t("nav.boutique")}
                        </h4>
                        <ul className="space-y-3">
                            <li>
                                <Link href={`/${locale}/catalog`} className="text-white/50 hover:text-white transition-colors text-sm">
                                    {t("nav.boutique")}
                                </Link>
                            </li>
                            <li>
                                <Link href={`/${locale}/register`} className="text-white/50 hover:text-white transition-colors text-sm">
                                    {t("buttons.register")}
                                </Link>
                            </li>
                            <li>
                                <Link href={`/${locale}/login`} className="text-white/50 hover:text-white transition-colors text-sm">
                                    {t("buttons.sign_in")}
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Contact Info */}
                    <div className="space-y-6 col-span-1 lg:col-span-2">
                        <h4 className="text-sm font-bold uppercase tracking-widest text-[#D4AF37]">
                            Contact
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="flex items-start gap-4">
                                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center shrink-0">
                                    <Phone className="w-5 h-5 text-[#D4AF37]" />
                                </div>
                                <div>
                                    <p className="text-xs text-white/40 uppercase tracking-wider mb-1">WhatsApp</p>
                                    <a href={`https://wa.me/${settings.whatsapp_number.replace(/\+/g, '')}`} className="text-sm font-medium hover:text-[#D4AF37] transition-colors">
                                        {settings.whatsapp_number}
                                    </a>
                                </div>
                            </div>
                            <div className="flex items-start gap-4">
                                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center shrink-0">
                                    <Mail className="w-5 h-5 text-[#D4AF37]" />
                                </div>
                                <div>
                                    <p className="text-xs text-white/40 uppercase tracking-wider mb-1">Email</p>
                                    <a href={`mailto:${settings.contact_email}`} className="text-sm font-medium hover:text-[#D4AF37] transition-colors">
                                        {settings.contact_email || "contact@lps-setif.com"}
                                    </a>
                                </div>
                            </div>
                            <div className="flex items-start gap-4 col-span-1 md:col-span-2">
                                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center shrink-0">
                                    <MapPin className="w-5 h-5 text-[#D4AF37]" />
                                </div>
                                <div>
                                    <p className="text-xs text-white/40 uppercase tracking-wider mb-1">Address</p>
                                    <p className="text-sm font-medium text-white/80">
                                        {settings.store_address || "Setif, Algeria"}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="pt-10 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-6">
                    <p className="text-white/20 text-xs text-center md:text-left">
                        © {new Date().getFullYear()} {t("nav.lps")} {t("nav.perfume")}. All rights reserved.
                    </p>
                    <div className="flex items-center gap-6">
                        <Link href={`/${locale}/privacy`} className="text-white/20 hover:text-white/40 transition-colors text-xs">
                            Privacy Policy
                        </Link>
                        <Link href={`/${locale}/terms`} className="text-white/20 hover:text-white/40 transition-colors text-xs">
                            Terms of Service
                        </Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}
