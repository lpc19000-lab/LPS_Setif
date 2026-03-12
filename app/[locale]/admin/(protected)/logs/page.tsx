import { getAdminLogs, getSystemErrors } from "@/services/audit-service";
import { History, AlertTriangle, User, Clock, ShieldAlert } from "lucide-react";
import { format } from "date-fns";
import { getTranslations } from "next-intl/server";

export const dynamic = "force-dynamic";

export default async function AdminLogsPage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: "admin.logs" });

    const [adminLogs, systemErrors] = await Promise.all([
        getAdminLogs(50),
        getSystemErrors(50),
    ]);

    return (
        <div className="space-y-8 pb-12">
            <div>
                <h1 className="text-2xl font-serif font-bold text-primary-dark">{t("title")}</h1>
                <p className="text-gray-500 text-sm mt-1">{t("subtitle")}</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Admin Activity */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                                <History className="w-5 h-5" />
                            </div>
                            <h2 className="font-semibold text-gray-900">{t("admin_activity")}</h2>
                        </div>
                        <span className="text-xs font-medium px-2.5 py-1 bg-white rounded-full border border-gray-100 text-gray-500 uppercase tracking-wider">
                            {t("real_time")}
                        </span>
                    </div>

                    <div className="divide-y divide-gray-50 max-h-[600px] overflow-y-auto">
                        {adminLogs.length === 0 ? (
                            <div className="p-12 text-center text-gray-400">
                                <Clock className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                <p>{t("no_activity")}</p>
                            </div>
                        ) : (
                            adminLogs.map((log: any) => (
                                <div key={log.id} className="p-4 hover:bg-gray-50 transition-colors">
                                    <div className="flex items-start gap-4">
                                        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                                            <User className="w-4 h-4 text-gray-400" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between gap-4 mb-1">
                                                <p className="font-medium text-sm text-gray-900 truncate">
                                                    {log.admin.name || log.admin.email}
                                                </p>
                                                <span className="text-[10px] text-gray-400 whitespace-nowrap">
                                                    {format(new Date(log.createdAt), "MMM d, HH:mm")}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2 mb-1.5">
                                                <span className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-600 text-[10px] font-bold uppercase tracking-wider">
                                                    {log.action}
                                                </span>
                                                <span className="text-gray-400 text-xs">{t("on")}</span>
                                                <span className="text-gray-900 font-medium text-xs">
                                                    {log.targetType}
                                                    {log.targetId && <span className="text-gray-400 font-normal ml-1">#{log.targetId.slice(-6)}</span>}
                                                </span>
                                            </div>
                                            {log.metadata && (
                                                <p className="text-xs text-gray-500 bg-gray-50 p-2 rounded border border-gray-100 font-mono break-all">
                                                    {log.metadata}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* System Errors */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-gray-100 bg-red-50/30 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center text-red-600">
                                <AlertTriangle className="w-5 h-5" />
                            </div>
                            <h2 className="font-semibold text-gray-900">{t("system_errors")}</h2>
                        </div>
                        <span className="text-xs font-medium px-2.5 py-1 bg-white rounded-full border border-red-100 text-red-600 uppercase tracking-wider">
                            {t("critical")}
                        </span>
                    </div>

                    <div className="divide-y divide-gray-50 max-h-[600px] overflow-y-auto">
                        {systemErrors.length === 0 ? (
                            <div className="p-12 text-center text-gray-400">
                                <ShieldAlert className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                <p>{t("no_errors")}</p>
                            </div>
                        ) : (
                            systemErrors.map((error: any) => (
                                <div key={error.id} className="p-4 hover:bg-gray-50 transition-colors">
                                    <div className="flex items-start gap-4">
                                        <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center shrink-0">
                                            <AlertTriangle className="w-4 h-4 text-red-600" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between gap-4 mb-1">
                                                <p className="font-bold text-xs text-red-600 uppercase tracking-tight">
                                                    {error.method} {error.path}
                                                </p>
                                                <span className="text-[10px] text-gray-400 whitespace-nowrap">
                                                    {format(new Date(error.createdAt), "MMM d, HH:mm")}
                                                </span>
                                            </div>
                                            <p className="text-sm font-medium text-gray-900 mb-2">
                                                {error.message}
                                            </p>
                                            {error.stackTrace && (
                                                <details className="mt-2 outline-none">
                                                    <summary className="text-[10px] text-gray-400 cursor-pointer hover:text-gray-600 transition-colors uppercase font-bold tracking-widest">
                                                        {t("show_stack_trace")}
                                                    </summary>
                                                    <pre className="mt-2 text-[10px] text-red-700 bg-red-50/50 p-3 rounded-lg border border-red-100 whitespace-pre-wrap font-mono">
                                                        {error.stackTrace}
                                                    </pre>
                                                </details>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
