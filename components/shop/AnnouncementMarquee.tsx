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
        <div className="bg-gradient-to-r from-primary-dark via-primary to-primary-dark text-white py-2.5 relative border-b border-[#D4AF37]/20 shadow-sm overflow-hidden group">
            <div className="max-w-7xl mx-auto px-6 relative flex items-center justify-center">
                <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full border border-white/20 z-10">
                    <Megaphone className="w-3.5 h-3.5 text-[#D4AF37] animate-pulse" />
                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#D4AF37]">
                        {isRtl ? 'إعلان' : 'Notice'}
                    </span>
                </div>
                
                <div className="overflow-hidden flex-1 relative h-6 flex items-center">
                    <div className="whitespace-nowrap flex animate-marquee hover:pause-marquee py-1">
                        {announcements.map((ann, i) => (
                            <span key={`${ann.id}-${i}`} className="mx-12 group/ann flex items-center gap-3">
                                <span className="text-white/40 text-[10px] sm:text-xs">✦</span>
                                <span className="text-xs sm:text-sm font-medium tracking-wide">
                                    <span className="text-[#D4AF37] font-bold mr-2 uppercase tracking-tighter">[{ann.title}]</span>
                                    {ann.message}
                                </span>
                                {ann.link && (
                                    <a 
                                        href={ann.link} 
                                        className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-white/10 hover:bg-[#D4AF37] hover:text-primary-dark rounded-md text-[9px] font-bold uppercase tracking-wider transition-all duration-300"
                                    >
                                        {isRtl ? 'عرض المزيد' : 'View More'}
                                    </a>
                                )}
                            </span>
                        ))}
                    </div>
                </div>

                <button 
                    onClick={() => setIsVisible(false)}
                    className="flex-shrink-0 ml-4 p-1.5 text-white/40 hover:text-[#D4AF37] hover:bg-white/5 rounded-full transition-all duration-300 z-10"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>

            <div className="absolute top-0 left-0 w-32 h-full bg-gradient-to-r from-primary-dark to-transparent z-[5]"></div>
            <div className="absolute top-0 right-0 w-32 h-full bg-gradient-to-l from-primary-dark to-transparent z-[5]"></div>

            <style jsx>{`
                @keyframes marquee {
                    0% { transform: translateX(0); }
                    100% { transform: translateX(calc(-50%)); }
                }
                .animate-marquee {
                    animation: marquee 40s linear infinite;
                }
                .pause-marquee:hover {
                    animation-play-state: paused;
                }
            `}</style>
        </div>
    );
}
