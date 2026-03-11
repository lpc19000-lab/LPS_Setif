"use server";

import { createProduct as _createProduct, updateProduct as _updateProduct, deleteProduct as _deleteProduct } from "@/app/[locale]/admin/actions/product";

export async function createProduct(...args: Parameters<typeof _createProduct>) {
    return _createProduct(...args);
}

export async function updateProduct(...args: Parameters<typeof _updateProduct>) {
    return _updateProduct(...args);
}

export async function deleteProduct(...args: Parameters<typeof _deleteProduct>) {
    return _deleteProduct(...args);
}
