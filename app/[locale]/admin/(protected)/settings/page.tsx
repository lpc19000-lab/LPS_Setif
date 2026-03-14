import { getTranslations } from "next-intl/server";
import { Shield } from "lucide-react";
import AdminPasswordForm from "@/components/admin/AdminPasswordForm";
import AdminSiteSettingsForm from "@/components/admin/AdminSiteSettingsForm";
import { getSiteSettings } from "@/services/settings-service";
import { Globe } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    const t = await getTranslations({ locale });
    const settings = await getSiteSettings();

    return (
        <div className="space-y-12 animate-in fade-in duration-500 max-w-4xl mx-auto pb-20">
            <div>
                <h1 className="text-3xl font-serif font-bold text-primary-dark tracking-tight">{t("admin.settings.title")}</h1>
                <p className="text-gray-500 mt-1 tracking-wide">{t("admin.settings.subtitle")}</p>
            </div>

            {/* Site Configuration */}
            <div className="bg-white rounded-3xl border border-primary/10 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex items-center gap-3 bg-gray-50/30">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                        <Globe className="w-5 h-5" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-gray-900">{t("admin.settings.site.title")}</h2>
                        <p className="text-sm text-gray-500">{t("admin.settings.site.description")}</p>
                    </div>
                </div>
                <div className="p-8">
                    <AdminSiteSettingsForm settings={settings} />
                </div>
            </div>

            {/* Security Settings */}
            <div className="bg-white rounded-3xl border border-primary/10 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex items-center gap-3 bg-gray-50/30">
                    <div className="w-10 h-10 rounded-xl bg-[#D4AF37]/10 flex items-center justify-center text-[#D4AF37]">
                        <Shield className="w-5 h-5" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-gray-900">{t("admin.settings.security.title")}</h2>
                        <p className="text-sm text-gray-500">{t("admin.settings.security.description")}</p>
                    </div>
                </div>
                <div className="p-8">
                    <AdminPasswordForm />
                </div>
            </div>
        </div>
    );
}
