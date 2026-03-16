"use client";

import { useState, useEffect } from "react";
import { Megaphone, X } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useLocale } from 'next-intl';
import { motion, AnimatePresence } from "framer-motion";

export default function AnnouncementMarquee() {
    const [announcements, setAnnouncements] = useState<any[]>([]);
    const [isVisible, setIsVisible] = useState(true);
    const locale = useLocale();
    const isRtl = locale === 'ar';

    useEffect(() => {
        const fetchAnnouncements = async () => {
            const { data } = await supabase
                .from("notifications")
                .select("*")
                .eq("type", "ANNOUNCEMENT")
                .order("created_at", { ascending: false })
                .limit(5);

            if (data && data.length > 0) {
                setAnnouncements(data);
            }
        };

        fetchAnnouncements();

        const channel = supabase
            .channel('public:notifications_marquee')
            .on('postgres_changes', { 
                event: '*', 
                schema: 'public', 
                table: 'notifications', 
                filter: "type=eq.ANNOUNCEMENT" 
            }, () => {
                fetchAnnouncements();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    if (!isVisible || announcements.length === 0) return null;

    return (
        <div className="bg-[#1a1a1a] text-white/90 py-1 relative border-b border-white/5 overflow-hidden">
            <div className="max-w-7xl mx-auto px-6 relative flex items-center gap-8">
                <div className="hidden sm:flex items-center gap-2 shrink-0">
                    <Megaphone className="w-3 h-3 text-[#D4AF37]" />
                    <span className="text-[9px] font-bold uppercase tracking-[0.3em] text-[#D4AF37]">
                        {isRtl ? 'إعلان' : 'News'}
                    </span>
                </div>
                
                <div className="overflow-hidden flex-1 relative h-5 flex items-center">
                    <div className="whitespace-nowrap flex animate-marquee hover:pause-marquee">
                        {announcements.map((ann, i) => (
                            <div key={`${ann.id}-${i}`} className="mx-8 flex items-center gap-4">
                                <span className="text-[#D4AF37] opacity-40 text-[10px]">✦</span>
                                <span className="text-[11px] sm:text-xs font-light tracking-wide flex items-center gap-3">
                                    <span className="text-white font-medium">{ann.title}</span>
                                    <span className="text-white/60">{ann.message}</span>
                                </span>
                                {ann.link && (
                                    <a 
                                        href={ann.link} 
                                        className="text-[#D4AF37] hover:text-white text-[9px] font-bold uppercase tracking-widest transition-colors"
                                    >
                                        {isRtl ? 'التفاصيل' : 'Details'}
                                    </a>
                                )}
                            </div>
                        ))}
                        {/* Duplicate for seamless loop if needed, but 40s is usually enough for 5 items */}
                    </div>
                </div>

                <button 
                    onClick={() => setIsVisible(false)}
                    className="shrink-0 p-1 hover:text-[#D4AF37] transition-colors"
                >
                    <X className="w-3.5 h-3.5 opacity-30" />
                </button>
            </div>

            <style jsx>{`
                @keyframes marquee {
                    0% { transform: translateX(10%); }
                    100% { transform: translateX(-100%); }
                }
                .animate-marquee {
                    animation: marquee 35s linear infinite;
                }
                .pause-marquee:hover {
                    animation-play-state: paused;
                }
            `}</style>
        </div>
    );
}
