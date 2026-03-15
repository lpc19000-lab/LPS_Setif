"use client";

import { useState } from "react";
import { createAnnouncement, deleteAnnouncement } from "@/app/api/admin/announcements/actions";
import { Megaphone, Trash2, Plus, AlertCircle, Link as LinkIcon, Edit2 } from "lucide-react";

export default function AnnouncementsClient({ initialAnnouncements, locale }: { initialAnnouncements: any[], locale: string }) {
    const [announcements, setAnnouncements] = useState(initialAnnouncements);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [title, setTitle] = useState("");
    const [message, setMessage] = useState("");
    const [link, setLink] = useState("");
    const [error, setError] = useState("");
    const isRtl = locale === 'ar';

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        
        if (!title.trim() || !message.trim()) {
            setError(isRtl ? "عنوان ونص الإعلان مطلوبان" : "Title and message are required");
            return;
        }

        setIsSubmitting(true);
        const res = await createAnnouncement({ title, message, link });
        if (res.success) {
            // Optimistic update - actually we should just refresh data but Next.js router.refresh() 
            // is better, or just rely on the server action revalidation.
            setTitle("");
            setMessage("");
            setLink("");
            window.location.reload();
        } else {
            setError(res.error || "Failed to create announcement");
        }
        setIsSubmitting(false);
    };

    const handleDelete = async (id: string) => {
        if (!confirm(isRtl ? "هل أنت متأكد من حذف هذا الإعلان؟" : "Are you sure you want to delete this announcement?")) return;
        
        const res = await deleteAnnouncement(id);
        if (res.success) {
            setAnnouncements(announcements.filter(a => a.id !== id));
        } else {
            alert(res.error || "Failed to delete");
        }
    };

    return (
        <div className={`grid grid-cols-1 lg:grid-cols-3 gap-8 ${isRtl ? 'rtl' : 'ltr'}`}>
            
            {/* Create Form */}
            <div className="lg:col-span-1">
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm sticky top-24">
                    <h2 className="font-bold text-gray-900 mb-6 flex items-center gap-2">
                        <Plus className="w-5 h-5 text-primary" />
                        {isRtl ? 'إعلان جديد' : 'New Announcement'}
                    </h2>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {error && (
                            <div className="p-3 bg-red-50 text-red-600 rounded-xl text-xs font-bold flex items-center gap-2">
                                <AlertCircle className="w-4 h-4" />
                                {error}
                            </div>
                        )}

                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">{isRtl ? 'عنوان' : 'Title'}</label>
                            <input
                                type="text"
                                value={title}
                                onChange={e => setTitle(e.target.value)}
                                className={`w-full px-4 py-2.5 rounded-xl border border-gray-200 outline-none focus:border-primary transition-colors ${isRtl ? 'text-right' : 'text-left'}`}
                                placeholder={isRtl ? 'عرض خاص...' : 'Special Offer...'}
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">{isRtl ? 'النص' : 'Message'}</label>
                            <textarea
                                value={message}
                                onChange={e => setMessage(e.target.value)}
                                rows={4}
                                className={`w-full px-4 py-2.5 rounded-xl border border-gray-200 outline-none focus:border-primary transition-colors resize-none ${isRtl ? 'text-right' : 'text-left'}`}
                                placeholder={isRtl ? 'تفاصيل الإعلان...' : 'Announcement details...'}
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1 flex items-center gap-1">
                                {isRtl ? 'رابط (اختياري)' : 'Link (Optional)'}
                            </label>
                            <div className="relative">
                                <LinkIcon className={`absolute top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 ${isRtl ? 'right-4' : 'left-4'}`} />
                                <input
                                    type="text"
                                    value={link}
                                    onChange={e => setLink(e.target.value)}
                                    className={`w-full py-2.5 rounded-xl border border-gray-200 outline-none focus:border-primary transition-colors ${isRtl ? 'pr-10 text-right' : 'pl-10 text-left'}`}
                                    placeholder="https://..."
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full py-3 bg-primary text-white rounded-xl font-bold mt-4 hover:bg-primary-dark transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {isSubmitting ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    <Megaphone className="w-5 h-5" />
                                    {isRtl ? 'نشر الإعلان' : 'Publish Announcement'}
                                </>
                            )}
                        </button>
                    </form>
                </div>
            </div>

            {/* List */}
            <div className="lg:col-span-2 space-y-4">
                <h2 className="font-bold text-gray-900 mb-6 flex items-center gap-2">
                    <Megaphone className="w-5 h-5 text-primary" />
                    {isRtl ? 'الإعلانات النشطة' : 'Active Announcements'}
                </h2>

                {announcements.length === 0 ? (
                    <div className="bg-white p-12 rounded-2xl border border-gray-100 text-center">
                        <Megaphone className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                        <p className="text-gray-500 font-medium">{isRtl ? 'لا توجد إعلانات نشطة' : 'No active announcements'}</p>
                    </div>
                ) : (
                    announcements.map((item) => (
                        <div key={item.id} className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex gap-4 group hover:border-primary/20 transition-all">
                            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                <Megaphone className="w-5 h-5 text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className={`flex items-start justify-between gap-4 ${isRtl ? 'flex-row-reverse' : ''}`}>
                                    <div className={isRtl ? 'text-right' : 'text-left'}>
                                        <h3 className="font-bold text-gray-900 leading-tight mb-1">{item.title}</h3>
                                        <p className="text-sm text-gray-600 leading-relaxed mb-3">{item.message}</p>
                                        
                                        <div className={`flex items-center gap-4 text-xs ${isRtl ? 'flex-row-reverse' : ''}`}>
                                            <span className="text-gray-400 font-medium">
                                                {new Intl.DateTimeFormat(isRtl ? 'ar-DZ' : 'fr-FR', { dateStyle: 'long', timeStyle: 'short' }).format(new Date(item.created_at))}
                                            </span>
                                            {item.link && (
                                                <a href={item.link} target="_blank" rel="noreferrer" className="text-primary font-bold flex items-center gap-1 hover:underline">
                                                    <LinkIcon className="w-3 h-3" />
                                                    {isRtl ? 'الرابط المرفق' : 'Attached Link'}
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                    
                                    <button
                                        onClick={() => handleDelete(item.id)}
                                        className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors shrink-0"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
