"use server";

import { createCategory as _createCategory, updateCategory as _updateCategory, deleteCategory as _deleteCategory } from "@/app/[locale]/admin/actions/category";

export async function createCategory(...args: Parameters<typeof _createCategory>) {
    return _createCategory(...args);
}

export async function updateCategory(...args: Parameters<typeof _updateCategory>) {
    return _updateCategory(...args);
}

export async function deleteCategory(...args: Parameters<typeof _deleteCategory>) {
    return _deleteCategory(...args);
}
