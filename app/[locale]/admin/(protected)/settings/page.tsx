import { getTranslations } from "next-intl/server";
import { Shield } from "lucide-react";
import AdminPasswordForm from "@/components/admin/AdminPasswordForm";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    const t = await getTranslations({ locale });

    return (
        <div className="space-y-8 animate-in fade-in duration-500 max-w-4xl mx-auto">
            <div>
                <h1 className="text-3xl font-serif font-bold text-primary-dark tracking-tight">{t("admin.settings.title")}</h1>
                <p className="text-gray-500 mt-1 tracking-wide">{t("admin.settings.subtitle")}</p>
            </div>

            <div className="bg-white rounded-2xl border border-primary/10 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#D4AF37]/10 flex items-center justify-center text-[#D4AF37]">
                        <Shield className="w-5 h-5" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-gray-900">{t("admin.settings.security.title")}</h2>
                        <p className="text-sm text-gray-500">{t("admin.settings.security.description")}</p>
                    </div>
                </div>
                <div className="p-6">
                    <AdminPasswordForm />
                </div>
            </div>
        </div>
    );
}
