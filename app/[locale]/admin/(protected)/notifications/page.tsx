import { getNotifications } from "@/services/notification-service";
import { Bell, Package, ShoppingCart, UserPlus } from "lucide-react";
import MarkAllReadButton from "@/components/admin/MarkAllReadButton";
import { getTranslations } from "next-intl/server";

export const dynamic = "force-dynamic";

export default async function AdminNotificationsPage({
    params
}: {
    params: Promise<{ locale: string }>
}) {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: "admin.notifications" });

    const notifications: any[] = await getNotifications(50);

    const unreadCount = notifications.filter(n => !n.isRead).length;

    const getIcon = (type: string) => {
        switch (type) {
            case "NEW_ORDER": return <ShoppingCart className="w-4 h-4" />;
            case "LOW_STOCK": return <Package className="w-4 h-4" />;
            case "NEW_CUSTOMER": return <UserPlus className="w-4 h-4" />;
            default: return <Bell className="w-4 h-4" />;
        }
    };

    const getIconColor = (type: string) => {
        switch (type) {
            case "NEW_ORDER": return "bg-blue-50 text-blue-600";
            case "LOW_STOCK": return "bg-red-50 text-red-600";
            case "NEW_CUSTOMER": return "bg-emerald-50 text-emerald-600";
            default: return "bg-gray-50 text-gray-600";
        }
    };

    const formatDate = (date: Date) => {
        return new Intl.DateTimeFormat(locale === 'ar' ? 'ar-DZ' : 'fr-FR', {
            dateStyle: "medium",
            timeStyle: "short",
        }).format(date);
    };

    return (
        <div className={`space-y-8 animate-in fade-in duration-500 ${locale === 'ar' ? 'rtl' : 'ltr'}`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className={locale === 'ar' ? 'text-right' : 'text-left'}>
                    <h1 className="text-3xl font-serif font-bold text-primary-dark tracking-tight">{t("title")}</h1>
                    <p className="text-gray-500 mt-1 tracking-wide">
                        {unreadCount > 0
                            ? t("unread_count", { count: unreadCount })
                            : t("no_unread")}
                    </p>
                </div>
                {unreadCount > 0 && <MarkAllReadButton />}
            </div>

            <div className="space-y-3">
                {notifications.map((notif) => (
                    <div
                        key={notif.id}
                        className={`bg-white rounded-xl border p-4 flex items-start gap-4 transition-all ${notif.isRead ? 'border-gray-100 opacity-70' : 'border-primary/20 shadow-sm'
                            }`}
                    >
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${getIconColor(notif.type)}`}>
                            {getIcon(notif.type)}
                        </div>
                        <div className={`flex-1 min-w-0 ${locale === 'ar' ? 'text-right' : 'text-left'}`}>
                            <div className="flex items-center gap-2">
                                <h3 className="font-semibold text-sm text-gray-900">{notif.title}</h3>
                                {!notif.isRead && (
                                    <span className="w-2 h-2 rounded-full bg-[#D4AF37] shrink-0" />
                                )}
                            </div>
                            <p className="text-sm text-gray-500 mt-0.5">{notif.message}</p>
                            <p className="text-xs text-gray-400 mt-1">{formatDate(notif.createdAt)}</p>
                        </div>
                    </div>
                ))}
                {notifications.length === 0 && (
                    <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
                        <Bell className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500">{t("no_notifications_desc")}</p>
                    </div>
                )}
            </div>
        </div>
    );
}
