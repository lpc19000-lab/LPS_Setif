"use client";

import { useState } from "react";
import { Plus, Search, Edit2, Trash2, X, Eye, EyeOff } from "lucide-react";
import SafeImage from "@/components/SafeImage";
import { createProduct, updateProduct, deleteProduct } from "@/app/admin/actions/product";
import { useTranslations, useLocale } from "next-intl";
import { useRouter } from "next/navigation";

type ProductWithCategory = any;

const STATUS_COLORS: Record<string, string> = {
    ACTIVE: "bg-emerald-50 text-emerald-600",
    INACTIVE: "bg-gray-100 text-gray-500",
    DRAFT: "bg-amber-50 text-amber-600",
};

export default function ProductClientView({
    products,
    categories,
    brands = [],
    collections = [],
    tags = [],
}: {
    products: ProductWithCategory[];
    categories: any[];
    brands?: any[];
    collections?: any[];
    tags?: any[];
}) {
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<ProductWithCategory | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
    const t = useTranslations("admin.products");
    const locale = useLocale();
    const router = useRouter();

    const filteredProducts = products.filter((p) => {
        const pName = p.name || "";
        const pBrand = p.brandName || p.brand || "";
        const pCategory = p.category?.name || "";
        const pDescription = p.description || "";
        const searchLower = search.toLowerCase().trim();
        if (!searchLower) return !statusFilter || p.status === statusFilter;

        const searchTerms = searchLower.split(/\s+/);
        const searchableText = `${pName} ${pBrand} ${pCategory} ${pDescription}`.toLowerCase();
        
        const matchesSearch = searchTerms.every(term => searchableText.includes(term));
            
        const matchesStatus = !statusFilter || p.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const formatCurrency = (amount: number) =>
        new Intl.NumberFormat(locale === "ar" ? "ar-DZ" : "fr-FR", { style: "currency", currency: "DZD" }).format(amount).replace("DZD", "DA");

    const handleOpenModal = (product: ProductWithCategory | null = null) => {
        setEditingProduct(product);
        setUploadedImageUrl(product?.imageUrl || null);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setEditingProduct(null);
        setUploadedImageUrl(null);
        setIsModalOpen(false);
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);
        const form = e.currentTarget;
        const tempFormData = new FormData(form);

        const imageFile = tempFormData.get("imageFile") as File;
        let finalImageUrl = uploadedImageUrl;

        if (imageFile && imageFile.size > 0) {
            const uploadFormData = new FormData();
            uploadFormData.append("file", imageFile);
            try {
                const uploadRes = await fetch("/api/upload", {
                    method: "POST",
                    body: uploadFormData,
                });
                if (!uploadRes.ok) {
                    alert("Image upload failed");
                    setIsLoading(false);
                    return;
                }
                const uploadData = await uploadRes.json();
                finalImageUrl = uploadData.url;
                setUploadedImageUrl(finalImageUrl);
            } catch {
                alert("Image upload failed");
                setIsLoading(false);
                return;
            }
        }

        // Re-construct the final FormData right before submission to ensure accuracy
        const finalFormData = new FormData(form);
        if (finalImageUrl) {
            finalFormData.set("imageUrl", finalImageUrl);
        }

        let res;
        try {
            if (editingProduct) {
                res = await updateProduct(editingProduct.id, finalFormData);
            } else {
                res = await createProduct(finalFormData);
            }
            
            if (res.success) {
                router.refresh(); // Crucial for showing the updated image/data
                handleCloseModal();
            } else {
                alert(res.error || "Operation failed");
            }
        } catch (err: any) {
            alert(err.message || "An error occurred");
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm(t("delete_confirm"))) return;
        setIsLoading(true);
        const res = await deleteProduct(id);
        setIsLoading(false);
        if (!res.success) alert(res.error);
    };

    // Get existing collection/tag ids for an editing product
    const editCollectionIds = editingProduct?.collections?.map((c: any) => c.collectionId || c.collection?.id) || [];
    const editTagIds = editingProduct?.tags?.map((t: any) => t.tagId || t.tag?.id) || [];

    return (
        <div className="space-y-6">
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex gap-3 w-full sm:w-auto">
                    <div className="relative flex-1 sm:w-80">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 rtl:left-auto rtl:right-3" />
                        <input
                            type="text"
                            placeholder={t("search_placeholder")}
                            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/30 rtl:pl-4 rtl:pr-10"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="bg-white border border-gray-200 rounded-xl text-sm px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/30"
                    >
                        <option value="">{t("all_status")}</option>
                        <option value="ACTIVE">{t("status.ACTIVE")}</option>
                        <option value="INACTIVE">{t("status.INACTIVE")}</option>
                        <option value="DRAFT">{t("status.DRAFT")}</option>
                    </select>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 bg-primary text-white px-5 py-2.5 rounded-xl font-medium text-sm hover:bg-primary-dark shadow-sm transition-all"
                >
                    <Plus className="w-4 h-4" />
                    {t("add_product")}
                </button>
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className={`text-xs text-gray-500 uppercase ${locale === 'ar' ? 'tracking-normal' : 'tracking-wider'} bg-gray-50/50`}>
                            <tr>
                                <th className="px-6 py-4 font-medium">{t("table.product")}</th>
                                <th className="px-6 py-4 font-medium">{t("table.category")}</th>
                                <th className="px-6 py-4 font-medium">{t("table.price")}</th>
                                <th className="px-6 py-4 font-medium">{t("table.stock")}</th>
                                <th className="px-6 py-4 font-medium">{t("table.status")}</th>
                                <th className="px-6 py-4 font-medium text-right rtl:text-left">{t("table.actions")}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredProducts.map((product) => (
                                <tr key={product.id} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100 relative shrink-0">
                                                <img
                                                    src={product.imageUrl || "/images/placeholder-perfume.svg"}
                                                    alt={product.name}
                                                    className="w-full h-full object-cover"
                                                    onError={(e) => {
                                                        (e.target as HTMLImageElement).src = "/images/placeholder-perfume.svg";
                                                    }}
                                                />
                                            </div>
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-bold text-gray-900 leading-tight">{product.name}</span>
                                                    <span className={`text-[10px] font-black uppercase ${locale === 'ar' ? 'tracking-normal' : 'tracking-widest'} text-[#D4AF37] mt-0.5`}>{product.brandName}</span>
                                                </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-gray-500">
                                        <span className="px-2.5 py-1 bg-gray-100 rounded-lg text-xs font-medium">
                                            {product.category?.name || t("uncategorized")}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 font-medium text-gray-900">
                                        {formatCurrency(product.basePrice)}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span
                                            className={`px-2.5 py-1 rounded-lg text-xs font-medium ${product.stockWeight < 500 ? "bg-red-50 text-red-600" : "bg-emerald-50 text-emerald-600"
                                                }`}
                                        >
                                            {product.stockWeight >= 1000 ? `${(product.stockWeight / 1000).toFixed(2)}kg` : `${product.stockWeight}g`} {t("available")}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                         <span className={`px-2.5 py-1 rounded-lg text-xs font-bold uppercase ${locale === 'ar' ? 'tracking-normal' : 'tracking-wider'} ${STATUS_COLORS[product.status] || "bg-gray-100 text-gray-500"}`}>
                                            {t(`status.${product.status}`)}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right rtl:text-left">
                                        <div className="flex items-center justify-end rtl:justify-start gap-2">
                                            <button
                                                onClick={() => handleOpenModal(product)}
                                                className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                            >
                                                <Edit2 className="w-4 h-4 rtl:scale-x-[-1]" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(product.id)}
                                                disabled={isLoading}
                                                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {filteredProducts.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="px-6 py-10 text-center text-gray-500">
                                        {t("no_products")}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl relative">
                        <div className="px-6 py-4 flex items-center justify-between border-b border-gray-100 bg-gray-50/50">
                            <h2 className="text-lg font-bold text-primary-dark font-serif">
                                {editingProduct ? t("modal.edit") : t("modal.create")}
                            </h2>
                            <button onClick={handleCloseModal} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-white rounded-full transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[75vh]">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                {/* Name */}
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold uppercase tracking-wider text-gray-500 ml-1 rtl:ml-0 rtl:mr-1">{t("modal.name_label")}</label>
                                    <input name="name" defaultValue={editingProduct?.name} required className="w-full bg-[#f8f9fa] border border-gray-200 text-sm rounded-xl focus:ring-2 focus:ring-[#D4AF37]/30 block px-4 py-3 outline-none" placeholder={t("modal.name_placeholder")} />
                                </div>
                                {/* Brand */}
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold uppercase tracking-wider text-gray-500 ml-1 rtl:ml-0 rtl:mr-1">{t("modal.brand_label")}</label>
                                    <select name="brandId" defaultValue={editingProduct?.brandId} required className="w-full bg-[#f8f9fa] border border-gray-200 text-sm rounded-xl focus:ring-2 focus:ring-[#D4AF37]/30 block px-4 py-3 outline-none">
                                        <option value="">{t("modal.brand_label")}</option>
                                        {brands.map((b) => (
                                            <option key={b.id} value={b.id}>{b.name}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Category */}
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold uppercase tracking-wider text-gray-500 ml-1 rtl:ml-0 rtl:mr-1">{t("modal.category_label")}</label>
                                    <select name="categoryId" defaultValue={editingProduct?.categoryId} required className="w-full bg-[#f8f9fa] border border-gray-200 text-sm rounded-xl focus:ring-2 focus:ring-[#D4AF37]/30 block px-4 py-3 outline-none">
                                        <option value="">{t("modal.category_label")}</option>
                                        {categories.map((c) => (
                                            <option key={c.id} value={c.id}>{c.name}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Status */}
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold uppercase tracking-wider text-gray-500 ml-1 rtl:ml-0 rtl:mr-1">{t("modal.status_label")}</label>
                                    <select name="status" defaultValue={editingProduct?.status || "ACTIVE"} className="w-full bg-[#f8f9fa] border border-gray-200 text-sm rounded-xl focus:ring-2 focus:ring-[#D4AF37]/30 block px-4 py-3 outline-none">
                                        <option value="ACTIVE">{t("status.ACTIVE")}</option>
                                        <option value="INACTIVE">{t("status.INACTIVE")}</option>
                                        <option value="DRAFT">{t("status.DRAFT")}</option>
                                    </select>
                                </div>

                                {/* Image Upload & URL */}
                                <div className="space-y-1.5 md:col-span-2">
                                    <label className="text-xs font-semibold uppercase tracking-wider text-gray-500 ml-1 rtl:ml-0 rtl:mr-1">Upload Image (Optional)</label>
                                    <input type="file" name="imageFile" accept="image/*" className="w-full bg-[#f8f9fa] border border-gray-200 text-sm rounded-xl focus:ring-2 focus:ring-[#D4AF37]/30 block px-4 py-2 outline-none file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20" />
                                </div>
                                {/* Hidden input to ensure imageUrl is submitted */}
                                <input type="hidden" name="imageUrl" value={uploadedImageUrl || ""} />

                                <div className="space-y-1.5 md:col-span-2">
                                    <label className="text-xs font-semibold uppercase tracking-wider text-gray-500 ml-1 rtl:ml-0 rtl:mr-1">{t("modal.image_label")} (Or provide URL)</label>
                                    <input 
                                        type="url"
                                        value={uploadedImageUrl || ""} 
                                        onChange={(e) => setUploadedImageUrl(e.target.value)}
                                        className="w-full bg-[#f8f9fa] border border-gray-200 text-sm rounded-xl focus:ring-2 focus:ring-[#D4AF37]/30 block px-4 py-3 outline-none" 
                                        placeholder="https://..." 
                                    />
                                </div>

                                {/* Pricing & Stock */}
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold uppercase tracking-wider text-gray-500 ml-1 rtl:ml-0 rtl:mr-1">{t("modal.price_label")}</label>
                                    <input type="number" step="0.01" name="basePrice" defaultValue={editingProduct?.basePrice} required className="w-full bg-[#f8f9fa] border border-gray-200 text-sm rounded-xl focus:ring-2 focus:ring-[#D4AF37]/30 block px-4 py-3 outline-none" />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold uppercase tracking-wider text-gray-500 ml-1 rtl:ml-0 rtl:mr-1">{t("modal.purchase_price_label")}</label>
                                    <input type="number" step="0.01" name="purchasePrice" defaultValue={editingProduct?.purchase_price || 0} required className="w-full bg-[#f8f9fa] border border-gray-200 text-sm rounded-xl focus:ring-2 focus:ring-[#D4AF37]/30 block px-4 py-3 outline-none" />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold uppercase tracking-wider text-gray-500 ml-1 rtl:ml-0 rtl:mr-1">{t("modal.stock_label")}</label>
                                    <input type="number" name="stockWeight" defaultValue={editingProduct?.stockWeight || 5000} required className="w-full bg-[#f8f9fa] border border-gray-200 text-sm rounded-xl focus:ring-2 focus:ring-[#D4AF37]/30 block px-4 py-3 outline-none" />
                                </div>

                                {/* Info */}
                                <div className="space-y-1.5 md:col-span-2 p-4 bg-amber-50 rounded-2xl border border-amber-100 italic text-[11px] text-amber-700">
                                    {t("modal.pricing_note")}
                                </div>

                                {/* Collections */}
                                {collections.length > 0 && (
                                    <div className="space-y-1.5 md:col-span-2">
                                        <label className="text-xs font-semibold uppercase tracking-wider text-gray-500 ml-1 rtl:ml-0 rtl:mr-1">{t("modal.collections_label")}</label>
                                        <div className="flex flex-wrap gap-2">
                                            {collections.map((c) => (
                                                <label key={c.id} className="flex items-center gap-1.5 px-3 py-1.5 bg-[#f8f9fa] border border-gray-200 rounded-lg text-sm cursor-pointer hover:border-[#D4AF37]/40 transition-colors has-[:checked]:bg-[#D4AF37]/10 has-[:checked]:border-[#D4AF37]/40">
                                                    <input
                                                        type="checkbox"
                                                        name="collectionIds"
                                                        value={c.id}
                                                        defaultChecked={editCollectionIds.includes(c.id)}
                                                        className="accent-[#D4AF37]"
                                                    />
                                                    {c.name}
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Tags */}
                                {tags.length > 0 && (
                                    <div className="space-y-1.5 md:col-span-2">
                                        <label className="text-xs font-semibold uppercase tracking-wider text-gray-500 ml-1 rtl:ml-0 rtl:mr-1">{t("modal.tags_label")}</label>
                                        <div className="flex flex-wrap gap-2">
                                            {tags.map((t) => (
                                                <label key={t.id} className="flex items-center gap-1.5 px-3 py-1.5 bg-[#f8f9fa] border border-gray-200 rounded-lg text-sm cursor-pointer hover:border-[#D4AF37]/40 transition-colors has-[:checked]:bg-[#D4AF37]/10 has-[:checked]:border-[#D4AF37]/40">
                                                    <input
                                                        type="checkbox"
                                                        name="tagIds"
                                                        value={t.id}
                                                        defaultChecked={editTagIds.includes(t.id)}
                                                        className="accent-[#D4AF37]"
                                                    />
                                                    {t.name}
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Description */}
                                <div className="space-y-1.5 md:col-span-2">
                                    <label className="text-xs font-semibold uppercase tracking-wider text-gray-500 ml-1 rtl:ml-0 rtl:mr-1">{t("modal.description_label")}</label>
                                    <textarea name="description" defaultValue={editingProduct?.description} required rows={3} className="w-full bg-[#f8f9fa] border border-gray-200 text-sm rounded-xl focus:ring-2 focus:ring-[#D4AF37]/30 block px-4 py-3 outline-none" />
                                </div>
                            </div>

                            <div className="mt-8 flex items-center justify-end gap-3 pt-6 border-t border-gray-100">
                                <button type="button" onClick={handleCloseModal} className="px-5 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors">
                                    {t("modal.cancel")}
                                </button>
                                <button type="submit" disabled={isLoading} className="px-6 py-2.5 rounded-xl text-sm font-medium text-white bg-primary hover:bg-primary-dark shadow-md shadow-primary/20 transition-all disabled:opacity-50">
                                    {isLoading ? t("modal.saving") : t("modal.save")}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
