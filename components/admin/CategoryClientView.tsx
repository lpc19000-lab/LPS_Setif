"use client";

import { useState } from "react";
import { Plus, Search, Edit2, Trash2, X, FolderTree } from "lucide-react";
import { createCategory, updateCategory, deleteCategory } from "@/app/admin/actions/category";

type CategoryWithCount = {
    id: string;
    name: string;
    description: string | null;
    createdAt: Date;
    _count: { products: number };
};

export default function CategoryClientView({ categories }: { categories: CategoryWithCount[] }) {
    const [search, setSearch] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<CategoryWithCount | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const filteredCategories = categories.filter(c =>
        c.name.toLowerCase().includes(search.toLowerCase())
    );

    const handleOpenModal = (category: CategoryWithCount | null = null) => {
        setEditingCategory(category);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setEditingCategory(null);
        setIsModalOpen(false);
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);

        const formData = new FormData(e.currentTarget);
        let res;

        if (editingCategory) {
            res = await updateCategory(editingCategory.id, formData);
        } else {
            res = await createCategory(formData);
        }

        setIsLoading(false);
        if (res.success) {
            handleCloseModal();
        } else {
            alert(res.error);
        }
    };

    const handleDelete = async (id: string, count: number) => {
        if (count > 0) {
            alert(`Cannot delete this category. It contains ${count} active products.`);
            return;
        }

        if (!confirm("Are you sure you want to delete this category?")) return;

        setIsLoading(true);
        const res = await deleteCategory(id);
        setIsLoading(false);

        if (!res.success) alert(res.error);
    };

    return (
        <div className="space-y-6">
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="relative w-full sm:w-96">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search categories..."
                        className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/30"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 bg-primary text-white px-5 py-2.5 rounded-xl font-medium text-sm hover:bg-primary-dark shadow-sm transition-all"
                >
                    <Plus className="w-4 h-4" />
                    Create Category
                </button>
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-gray-500 uppercase tracking-wider bg-gray-50/50">
                            <tr>
                                <th className="px-6 py-4 font-medium">Category Name</th>
                                <th className="px-6 py-4 font-medium">Description</th>
                                <th className="px-6 py-4 font-medium">Associated Products</th>
                                <th className="px-6 py-4 font-medium text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredCategories.map((category) => (
                                <tr key={category.id} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-[#D4AF37]/10 flex items-center justify-center text-[#D4AF37]">
                                                <FolderTree className="w-4 h-4" />
                                            </div>
                                            <div className="font-medium text-gray-900">{category.name}</div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-gray-500 max-w-sm truncate">
                                        {category.description || "—"}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="px-2.5 py-1 bg-gray-100 rounded-lg text-xs font-medium text-gray-600">
                                            {category._count.products} products
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => handleOpenModal(category)}
                                                className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                            >
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(category.id, category._count.products)}
                                                disabled={isLoading || category._count.products > 0}
                                                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-gray-400"
                                                title={category._count.products > 0 ? "Cannot delete category with active products" : "Delete category"}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {filteredCategories.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="px-6 py-10 text-center text-gray-500">
                                        No categories found.
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
                    <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl relative">
                        <div className="px-6 py-4 flex items-center justify-between border-b border-gray-100 bg-gray-50/50">
                            <h2 className="text-lg font-bold text-primary-dark font-serif">
                                {editingCategory ? "Edit Category" : "New Category"}
                            </h2>
                            <button onClick={handleCloseModal} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-white rounded-full transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6">
                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-semibold uppercase tracking-wider text-gray-500 ml-1">Category Name</label>
                                    <input name="name" defaultValue={editingCategory?.name} required className="w-full bg-[#f8f9fa] border border-gray-200 text-sm rounded-xl focus:ring-2 focus:ring-[#D4AF37]/30 block px-4 py-3 outline-none" placeholder="e.g. Signature Series" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-semibold uppercase tracking-wider text-gray-500 ml-1">Description (Optional)</label>
                                    <textarea name="description" defaultValue={editingCategory?.description || ""} rows={4} className="w-full bg-[#f8f9fa] border border-gray-200 text-sm rounded-xl focus:ring-2 focus:ring-[#D4AF37]/30 block px-4 py-3 outline-none" placeholder="Add a description for this category line..." />
                                </div>
                            </div>

                            <div className="mt-8 flex items-center justify-end gap-3 pt-6 border-t border-gray-100">
                                <button type="button" onClick={handleCloseModal} className="px-5 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors">
                                    Cancel
                                </button>
                                <button type="submit" disabled={isLoading} className="px-6 py-2.5 rounded-xl text-sm font-medium text-white bg-primary hover:bg-primary-dark shadow-md shadow-primary/20 transition-all disabled:opacity-50">
                                    {isLoading ? "Saving..." : "Save Category"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
