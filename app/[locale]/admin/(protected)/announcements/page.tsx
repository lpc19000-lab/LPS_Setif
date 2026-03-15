import { supabaseAdmin } from "@/lib/supabase-admin";
import AnnouncementsClient from "@/components/admin/AnnouncementsClient";
import { getTranslations } from "next-intl/server";

export const dynamic = "force-dynamic";

export default async function AdminAnnouncementsPage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: "admin" }); // Assuming admin namespace covers it

    const { data: announcements, error } = await supabaseAdmin
        .from("notifications")
        .select("*")
        .eq("type", "ANNOUNCEMENT")
        .order("created_at", { ascending: false });

    return (
        <div className={`space-y-8 animate-in fade-in duration-500 ${locale === 'ar' ? 'rtl' : 'ltr'}`}>
            <div className={locale === 'ar' ? 'text-right' : 'text-left'}>
                <h1 className="text-3xl font-serif font-bold text-primary-dark tracking-tight">
                    {locale === 'ar' ? 'إعلانات عامة' : 'Public Announcements'}
                </h1>
                <p className="text-gray-500 mt-1 tracking-wide">
                    {locale === 'ar' ? 'إدارة الإعلانات التي تظهر لجميع الزوار.' : 'Manage announcements that appear to all visitors.'}
                </p>
            </div>

            <AnnouncementsClient initialAnnouncements={announcements || []} locale={locale} />
        </div>
    );
}
