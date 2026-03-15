"use client";

import { useState, useEffect, useRef } from "react";
import { Bell, X, Megaphone } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useLocale } from 'next-intl';

export default function NotificationBell({ isHeroPage }: { isHeroPage: boolean }) {
    const [announcements, setAnnouncements] = useState<any[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [hasUnread, setHasUnread] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const locale = useLocale();
    const isRtl = locale === 'ar';

    useEffect(() => {
        const fetchAnnouncements = async () => {
            const { data } = await supabase
                .from("notifications")
                .select("*")
                .eq("type", "ANNOUNCEMENT")
                .order("created_at", { ascending: false })
                .limit(10);

            if (data && data.length > 0) {
                setAnnouncements(data);
                // Simple way to handle "unread": checking if user has seen these specific IDs
                const seenIds = JSON.parse(localStorage.getItem('seenAnnouncements') || '[]');
                const newUnread = data.some(a => !seenIds.includes(a.id));
                setHasUnread(newUnread);
            }
        };

        fetchAnnouncements();

        const channel = supabase
            .channel('public:notifications')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications', filter: "type=eq.ANNOUNCEMENT" }, payload => {
                fetchAnnouncements();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [supabase]);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const toggleOpen = () => {
        if (!isOpen && hasUnread) {
            // Mark as read in local storage
            const ids = announcements.map(a => a.id);
            localStorage.setItem('seenAnnouncements', JSON.stringify(ids));
            setHasUnread(false);
        }
        setIsOpen(!isOpen);
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={toggleOpen}
                className={`relative p-2 rounded-full transition-all duration-300 ${isHeroPage
                        ? "text-white/70 hover:text-[#D4AF37] hover:bg-white/5"
                        : "text-gray-500 hover:text-primary hover:bg-primary/5"
                    }`}
            >
                <Bell className="w-5 h-5" />
                {hasUnread && (
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full animate-pulse border border-white" />
                )}
            </button>

            {isOpen && (
                <div className={`absolute top-full mt-2 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 p-4 z-50 ${isRtl ? 'left-0' : 'right-0'}`}>
                    <div className={`flex items-center justify-between mb-4 pb-2 border-b border-gray-50 ${isRtl ? 'flex-row-reverse' : ''}`}>
                        <h3 className="font-bold text-gray-900 flex items-center gap-2">
                            <Megaphone className="w-4 h-4 text-[#D4AF37]" />
                            {isRtl ? 'الإعلانات' : 'Announcements'}
                        </h3>
                        <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
                        {announcements.length === 0 ? (
                            <div className="py-8 text-center">
                                <Megaphone className="w-8 h-8 text-gray-200 mx-auto mb-3" />
                                <p className="text-sm text-gray-400 font-medium">{isRtl ? 'لا توجد إعلانات حالياً' : 'No announcements yet'}</p>
                            </div>
                        ) : (
                            announcements.map((announcement) => (
                                <div key={announcement.id} className={`p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors ${isRtl ? 'text-right' : 'text-left'}`}>
                                    <h4 className="font-bold text-sm text-primary-dark mb-1">{announcement.title}</h4>
                                    <p className="text-xs text-gray-600 leading-relaxed">{announcement.message}</p>
                                    <div className={`flex items-center justify-between mt-2 ${isRtl ? 'flex-row-reverse' : ''}`}>
                                        <span className="text-[10px] text-gray-400">
                                            {new Intl.DateTimeFormat(isRtl ? 'ar-DZ' : 'fr-FR', { dateStyle: 'medium' }).format(new Date(announcement.created_at))}
                                        </span>
                                        {announcement.link && (
                                            <a href={announcement.link} className="text-[10px] font-bold text-primary hover:underline">
                                                {isRtl ? 'عرض المزيد' : 'View Details'}
                                            </a>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
