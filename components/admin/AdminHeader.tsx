"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useTranslations, useLocale } from "next-intl";
import { AlertCircle, AlertTriangle, Info, ChevronRight, Bell, Activity } from "lucide-react";

type Alert = {
    type: "CRITICAL" | "WARNING" | "INFO";
    message: string;
};

export default function AdminHeader() {
    const locale = useLocale();
    const t = useTranslations("admin.header");
    const [alerts, setAlerts] = useState<Alert[]>([]);
    const [healthScore, setHealthScore] = useState<number>(100);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const res = await fetch("/api/admin/intelligence/dashboard");
                const data = await res.json();
                if (data.success) {
                    setAlerts(data.data.alerts);
                    setHealthScore(data.data.healthScore);
                }
            } catch (e) {
                console.error("Failed to fetch intelligence dashboard:", e);
            } finally {
                setLoading(false);
            }
        };

        const fetchUnreadCount = async () => {
            try {
                const res = await fetch("/api/admin/notifications/unread-count");
                const data = await res.json();
                if (data.success) {
                    setUnreadCount(data.count);
                }
            } catch (e) {
                console.error("Failed to fetch unread count:", e);
            }
        };

        fetchDashboardData();
        fetchUnreadCount();

        // Polling for realtime-ish feel
        const interval = setInterval(fetchUnreadCount, 15000); // 15 seconds
        return () => clearInterval(interval);
    }, []);

    if (loading) return null;

    // Show only the highest severity alert or an aggregate if multiple
    let highestAlert = null;
    if (alerts.length > 0) {
        highestAlert = alerts.find(a => a.type === "CRITICAL")
            || alerts.find(a => a.type === "WARNING")
            || alerts.find(a => a.type === "INFO");
    }

    const getAlertIcon = (type: string) => {
        switch (type) {
            case "CRITICAL": return <AlertCircle className="w-5 h-5 text-red-500" />;
            case "WARNING": return <AlertTriangle className="w-5 h-5 text-amber-500" />;
            case "INFO": return <Info className="w-5 h-5 text-blue-500" />;
            default: return <Info className="w-5 h-5" />;
        }
    };

    const getAlertStyle = (type: string) => {
        switch (type) {
            case "CRITICAL": return "bg-red-50 border-red-100 text-red-900";
            case "WARNING": return "bg-amber-50 border-amber-100 text-amber-900";
            case "INFO": return "bg-blue-50 border-blue-100 text-blue-900";
            default: return "bg-gray-50 border-gray-100";
        }
    };

    return (
        <header className="flex flex-col sm:flex-row items-center justify-between gap-3 w-full bg-white rounded-xl border border-gray-100 shadow-sm px-4 py-2 mb-4">
            <div className="flex items-center gap-4 flex-1">
                {highestAlert ? (
                    <Link href={`/${locale}/admin/restock`} className={`flex-1 flex items-center justify-between px-4 py-3 rounded-xl border transition-colors group ${getAlertStyle(highestAlert.type)} hover:opacity-90`}>
                        <div className="flex items-center gap-3">
                            {getAlertIcon(highestAlert.type)}
                            <div>
                                <span className="font-bold text-sm block leading-none mb-1">{t("smart_alert")}</span>
                                <span className="text-xs opacity-80">{highestAlert.message}</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-1 text-xs font-bold uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                            {t("view_details")} <ChevronRight className="w-4 h-4" />
                        </div>
                    </Link>
                ) : (
                    <div className="flex-1 px-4 py-3 rounded-xl bg-gray-50 border border-gray-100 flex items-center gap-3 text-gray-400">
                        <Info className="w-5 h-5" />
                        <span className="text-sm font-medium">{t("no_alerts")}</span>
                    </div>
                )}
            </div>

            {/* Notifications and Health */}
            <div className="shrink-0 flex items-center gap-6 pl-4 sm:border-l border-gray-100">
                {/* Notification Bell */}
                <Link href={`/${locale}/admin/notifications`} className="relative p-2 text-gray-400 hover:text-primary transition-colors hover:bg-gray-50 rounded-xl">
                    <Bell className="w-6 h-6" />
                    {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-white ring-2 ring-red-500/10">
                            {unreadCount > 9 ? "9+" : unreadCount}
                        </span>
                    )}
                </Link>

                <div className="flex items-center gap-4">
                    <div className="text-right">
                        <span className="block text-[10px] uppercase tracking-widest font-bold text-gray-400">{t("inventory_health")}</span>
                        <span className={`font-serif text-2xl font-bold ${healthScore >= 90 ? "text-emerald-500" :
                            healthScore >= 70 ? "text-amber-500" :
                                "text-red-500"
                            }`}>
                            {healthScore}%
                        </span>
                    </div>
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center border-4 ${healthScore >= 90 ? "border-emerald-100 bg-emerald-50 text-emerald-500" :
                        healthScore >= 70 ? "border-amber-100 bg-amber-50 text-amber-500" :
                            "border-red-100 bg-red-50 text-red-500"
                        }`}>
                        <Activity className="w-5 h-5" />
                    </div>
                </div>
            </div>
        </header>
    );
}
