"use client";

import { useState } from "react";
import { Save, Globe, Phone, Facebook, Mail, MapPin, Image as ImageIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { updateSiteSettingsAction } from "@/app/[locale]/admin/actions/settings";

interface SiteSettingsFormProps {
    settings: {
        id: string;
        whatsapp_number: string;
        facebook_page: string;
        contact_email: string | null;
        store_address: string | null;
        logo_url: string | null;
    };
}

export default function AdminSiteSettingsForm({ settings }: SiteSettingsFormProps) {
    const t = useTranslations("admin.settings.site");
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);
        setMessage(null);

        const formData = new FormData(e.currentTarget);
        const res = await updateSiteSettingsAction(formData);

        setIsLoading(false);
        if (res.success) {
            setMessage({ type: "success", text: t("save_success") });
        } else {
            setMessage({ type: "error", text: res.error || t("save_error") });
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <input type="hidden" name="id" value={settings.id} />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* WhatsApp */}
                <div className="space-y-2">
                    <label className="text-xs font-semibold uppercase tracking-wider text-gray-500 flex items-center gap-2">
                        <Phone className="w-3 h-3" /> WhatsApp Number
                    </label>
                    <input 
                        name="whatsapp_number" 
                        defaultValue={settings.whatsapp_number} 
                        required 
                        className="w-full bg-[#f8f9fa] border border-gray-200 text-sm rounded-xl focus:ring-2 focus:ring-[#D4AF37]/30 block px-4 py-3 outline-none" 
                        placeholder="+213..." 
                    />
                </div>

                {/* Facebook */}
                <div className="space-y-2">
                    <label className="text-xs font-semibold uppercase tracking-wider text-gray-500 flex items-center gap-2">
                        <Facebook className="w-3 h-3" /> Facebook Page ID/Name
                    </label>
                    <input 
                        name="facebook_page" 
                        defaultValue={settings.facebook_page} 
                        required 
                        className="w-full bg-[#f8f9fa] border border-gray-200 text-sm rounded-xl focus:ring-2 focus:ring-[#D4AF37]/30 block px-4 py-3 outline-none" 
                        placeholder="my_page_name" 
                    />
                </div>

                {/* Email */}
                <div className="space-y-2">
                    <label className="text-xs font-semibold uppercase tracking-wider text-gray-500 flex items-center gap-2">
                        <Mail className="w-3 h-3" /> Contact Email
                    </label>
                    <input 
                        type="email"
                        name="contact_email" 
                        defaultValue={settings.contact_email || ""} 
                        className="w-full bg-[#f8f9fa] border border-gray-200 text-sm rounded-xl focus:ring-2 focus:ring-[#D4AF37]/30 block px-4 py-3 outline-none" 
                        placeholder="contact@example.com" 
                    />
                </div>

                {/* Address */}
                <div className="space-y-2">
                    <label className="text-xs font-semibold uppercase tracking-wider text-gray-500 flex items-center gap-2">
                        <MapPin className="w-3 h-3" /> Store Address
                    </label>
                    <input 
                        name="store_address" 
                        defaultValue={settings.store_address || ""} 
                        className="w-full bg-[#f8f9fa] border border-gray-200 text-sm rounded-xl focus:ring-2 focus:ring-[#D4AF37]/30 block px-4 py-3 outline-none" 
                        placeholder="City, State, Country" 
                    />
                </div>

                {/* Logo URL */}
                <div className="space-y-2 md:col-span-2">
                    <label className="text-xs font-semibold uppercase tracking-wider text-gray-500 flex items-center gap-2">
                        <ImageIcon className="w-3 h-3" /> Logo Image URL
                    </label>
                    <div className="flex gap-3">
                        <input 
                            name="logo_url" 
                            defaultValue={settings.logo_url || "/logo.png"} 
                            className="flex-1 bg-[#f8f9fa] border border-gray-200 text-sm rounded-xl focus:ring-2 focus:ring-[#D4AF37]/30 block px-4 py-3 outline-none" 
                            placeholder="/logo.png" 
                        />
                        {settings.logo_url && (
                            <div className="w-12 h-12 rounded-xl border border-gray-100 p-1 flex items-center justify-center overflow-hidden bg-gray-50">
                                <img src={settings.logo_url} alt="Logo Preview" className="max-w-full max-h-full object-contain" />
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {message && (
                <div className={`p-4 rounded-xl text-sm font-medium ${message.type === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
                    {message.text}
                </div>
            )}

            <div className="pt-4 flex justify-end">
                <button 
                    type="submit" 
                    disabled={isLoading}
                    className="flex items-center gap-2 bg-primary text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-primary/20 hover:bg-primary-dark transition-all disabled:opacity-50"
                >
                    <Save className="w-4 h-4" />
                    {isLoading ? t("saving") : t("save")}
                </button>
            </div>
        </form>
    );
}
