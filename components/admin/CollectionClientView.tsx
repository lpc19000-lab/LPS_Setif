"use client";

import { useState } from "react";
import { Plus, Edit2, Trash2, X, Layers } from "lucide-react";
import { useTranslations } from "next-intl";
import { createCollectionAction, updateCollectionAction, deleteCollectionAction } from "@/app/admin/actions/collection";

export default function CollectionClientView({ collections }: { collections: any[] }) {
    const t = useTranslations("admin.collections");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editing, setEditing] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        const formData = new FormData(e.currentTarget);
        const res = editing
            ? await updateCollectionAction(editing.id, formData)
            : await createCollectionAction(formData);
        setLoading(false);
        if (res.success) {
            setIsModalOpen(false);
            setEditing(null);
        } else alert(res.error);
    };

    const handleDelete = async (id: string) => {
        if (!confirm(t("delete_confirm", { defaultValue: "Delete this collection?" }))) return;
        setLoading(true);
        await deleteCollectionAction(id);
        setLoading(false);
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-end">
                <button
                    onClick={() => { setEditing(null); setIsModalOpen(true); }}
                    className="flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-xl font-medium text-sm hover:bg-primary-dark shadow-sm transition-all"
                >
                    <Plus className="w-4 h-4" /> {t("add_collection")}
                </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {collections.map((c) => (
                    <div key={c.id} className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between mb-3">
                            <div className="w-10 h-10 rounded-xl bg-[#D4AF37]/10 flex items-center justify-center">
                                <Layers className="w-5 h-5 text-[#D4AF37]" />
                            </div>
                            <div className="flex gap-1">
                                <button onClick={() => { setEditing(c); setIsModalOpen(true); }} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                                    <Edit2 className="w-4 h-4" />
                                </button>
                                <button onClick={() => handleDelete(c.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                        <h3 className="font-bold text-gray-900 text-lg">{c.name}</h3>
                        <p className="text-xs text-gray-400 mt-1">/{c.slug} &middot; {c.products?.length || 0} {t("table.products")}</p>
                    </div>
                ))}
                {collections.length === 0 && (
                    <p className="text-gray-400 col-span-full text-center py-10">{t("no_collections")}</p>
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
                                <input name="name" defaultValue={editing?.name} required className="w-full bg-[#f8f9fa] border border-gray-200 text-sm rounded-xl focus:ring-2 focus:ring-[#D4AF37]/30 block px-4 py-3 outline-none" placeholder="e.g. Best Sellers" />
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
