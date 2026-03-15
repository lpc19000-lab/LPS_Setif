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
        <div className="bg-primary text-white py-2 relative overflow-hidden group">
            <div className="max-w-7xl mx-auto px-10 relative flex items-center">
                <div className="flex-shrink-0 mr-4 z-10 bg-primary pr-2">
                    <Megaphone className="w-4 h-4 text-[#D4AF37]" />
                </div>
                
                <div className="overflow-hidden flex-1 relative h-6">
                    <div className="whitespace-nowrap flex animate-marquee hover:pause-marquee">
                        {announcements.map((ann, i) => (
                            <span key={`${ann.id}-${i}`} className="mx-8 text-sm font-medium">
                                <span className="text-[#D4AF37] font-bold mr-2">[{ann.title}]</span>
                                {ann.message}
                                {ann.link && (
                                    <a href={ann.link} className="ml-2 underline text-[10px] hover:text-[#D4AF37]">
                                        {isRtl ? 'عرض المزيد' : 'View More'}
                                    </a>
                                )}
                            </span>
                        ))}
                        {/* Duplicate for seamless loop */}
                        {announcements.map((ann, i) => (
                            <span key={`${ann.id}-dup-${i}`} className="mx-8 text-sm font-medium">
                                <span className="text-[#D4AF37] font-bold mr-2">[{ann.title}]</span>
                                {ann.message}
                                {ann.link && (
                                    <a href={ann.link} className="ml-2 underline text-[10px] hover:text-[#D4AF37]">
                                        {isRtl ? 'عرض المزيد' : 'View More'}
                                    </a>
                                )}
                            </span>
                        ))}
                    </div>
                </div>

                <button 
                    onClick={() => setIsVisible(false)}
                    className="flex-shrink-0 ml-4 z-10 bg-primary pl-2 hover:text-[#D4AF37] transition-colors"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>

            <style jsx>{`
                @keyframes marquee {
                    0% { transform: translateX(0); }
                    100% { transform: translateX(-50%); }
                }
                .animate-marquee {
                    animation: marquee 30s linear infinite;
                }
                .pause-marquee:hover {
                    animation-play-state: paused;
                }
            `}</style>
        </div>
    );
}
