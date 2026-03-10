"use client";

import { useState } from "react";
import { Plus, Edit2, Trash2, X, Tag as TagIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { createTagAction, updateTagAction, deleteTagAction } from "@/app/admin/actions/tag";

export default function TagClientView({ tags }: { tags: any[] }) {
    const t = useTranslations("admin.tags");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editing, setEditing] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        const formData = new FormData(e.currentTarget);
        const res = editing
            ? await updateTagAction(editing.id, formData)
            : await createTagAction(formData);
        setLoading(false);
        if (res.success) {
            setIsModalOpen(false);
            setEditing(null);
        } else alert(res.error);
    };

    const handleDelete = async (id: string) => {
        if (!confirm(t("delete_confirm", { defaultValue: "Delete this tag?" }))) return;
        setLoading(true);
        await deleteTagAction(id);
        setLoading(false);
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-end">
                <button
                    onClick={() => { setEditing(null); setIsModalOpen(true); }}
                    className="flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-xl font-medium text-sm hover:bg-primary-dark shadow-sm transition-all"
                >
                    <Plus className="w-4 h-4" /> {t("add_tag")}
                </button>
            </div>

            <div className="flex flex-wrap gap-3">
                {tags.map((t) => (
                    <div key={t.id} className="bg-white rounded-xl border border-gray-100 px-5 py-3 shadow-sm flex items-center gap-3 hover:shadow-md transition-shadow">
                        <TagIcon className="w-4 h-4 text-[#D4AF37]" />
                        <span className="font-medium text-gray-900">{t.name}</span>
                        <span className="text-xs text-gray-400">({t.products?.length || 0})</span>
                        <div className="flex gap-1 ml-2 border-l pl-2 border-gray-100">
                            <button onClick={() => { setEditing(t); setIsModalOpen(true); }} className="p-1 text-gray-400 hover:text-blue-600 rounded transition-colors"><Edit2 className="w-3 h-3" /></button>
                            <button onClick={() => handleDelete(t.id)} className="p-1 text-gray-400 hover:text-red-600 rounded transition-colors"><Trash2 className="w-3 h-3" /></button>
                        </div>
                    </div>
                ))}
                {tags.length === 0 && (
                    <p className="text-gray-400 w-full text-center py-10">{t("no_tags")}</p>
                )}
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl">
                        <div className="px-6 py-4 flex items-center justify-between border-b border-gray-100 bg-gray-50/50">
                            <h2 className="text-lg font-bold text-primary-dark font-serif">{editing ? t("modal.edit") : t("modal.create")}</h2>
                            <button onClick={() => { setIsModalOpen(false); setEditing(null); }} className="p-2 text-gray-400 hover:text-gray-600 rounded-full"><X className="w-5 h-5" /></button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold uppercase tracking-wider text-gray-500 ml-1">{t("modal.name_label")}</label>
                                <input name="name" defaultValue={editing?.name} required className="w-full bg-[#f8f9fa] border border-gray-200 text-sm rounded-xl focus:ring-2 focus:ring-[#D4AF37]/30 block px-4 py-3 outline-none" placeholder="e.g. best-seller" />
                            </div>
                            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                                <button type="button" onClick={() => { setIsModalOpen(false); setEditing(null); }} className="px-5 py-2.5 rounded-xl text-sm text-gray-600 hover:bg-gray-100 transition-colors">{t("modal.cancel")}</button>
                                <button type="submit" disabled={loading} className="px-6 py-2.5 rounded-xl text-sm text-white bg-primary hover:bg-primary-dark shadow-md transition-all disabled:opacity-50">{loading ? t("admin.products.modal.saving", { defaultValue: "Saving..." }) : t("modal.save")}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
