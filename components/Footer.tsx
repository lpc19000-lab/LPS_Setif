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
        <footer className="relative bg-[#0F0F0F] text-white pt-6 pb-6 overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-[#D4AF37]/30 to-transparent" />
            
            <div className="max-w-7xl mx-auto px-6 relative z-10">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8 mb-4">
                    {/* Brand */}
                    <div className="flex flex-col gap-3">
                        <Link href={`/${locale}`} className="flex items-center gap-2">
                            <span className="font-serif text-2xl font-bold text-[#D4AF37] tracking-tight">
                                {t("nav.lps")}
                            </span>
                            <span className="text-[10px] uppercase tracking-[0.4em] text-white/40 mt-1">
                                {t("nav.perfume")}
                            </span>
                        </Link>
                        <p className="text-white/40 text-xs leading-relaxed max-w-xs">
                            Premium B2B wholesale perfume platform for distributors in Algeria.
                        </p>
                    </div>

                    {/* Contact Row */}
                    <div className="flex flex-wrap items-center gap-6">
                        <a href={`https://wa.me/${settings.whatsapp_number.replace(/\+/g, '')}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-white/50 hover:text-[#D4AF37] transition-colors text-sm">
                            <Phone className="w-4 h-4" />
                            <span>{settings.whatsapp_number}</span>
                        </a>
                        <a href={`mailto:${settings.contact_email}`} className="flex items-center gap-2 text-white/50 hover:text-[#D4AF37] transition-colors text-sm">
                            <Mail className="w-4 h-4" />
                            <span>{settings.contact_email || "contact@lps-setif.com"}</span>
                        </a>
                        <span className="flex items-center gap-2 text-white/50 text-sm">
                            <MapPin className="w-4 h-4" />
                            <span>{settings.store_address || "Setif, Algeria"}</span>
                        </span>
                    </div>

                    {/* Social */}
                    <div className="flex items-center gap-3">
                        <a href={`https://facebook.com/${settings.facebook_page}`} target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-full border border-white/10 flex items-center justify-center hover:bg-[#D4AF37] hover:border-transparent transition-all group">
                            <Facebook className="w-4 h-4 text-white/40 group-hover:text-white" />
                        </a>
                        <a href={`https://wa.me/${settings.whatsapp_number.replace(/\+/g, '')}`} target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-full border border-white/10 flex items-center justify-center hover:bg-green-600 hover:border-transparent transition-all group">
                            <MessageCircle className="w-4 h-4 text-white/40 group-hover:text-white" />
                        </a>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="pt-6 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-4">
                    <p className="text-white/20 text-xs">
                        &copy; {new Date().getFullYear()} {t("nav.lps")} {t("nav.perfume")}. All rights reserved.
                    </p>
                    <div className="flex items-center gap-6">
                        <Link href={`/${locale}/catalog`} className="text-white/20 hover:text-white/40 transition-colors text-xs">{t("nav.boutique")}</Link>
                        <Link href={`/${locale}/privacy`} className="text-white/20 hover:text-white/40 transition-colors text-xs">Privacy Policy</Link>
                        <Link href={`/${locale}/terms`} className="text-white/20 hover:text-white/40 transition-colors text-xs">Terms</Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}
