import { supabaseAdmin } from "@/lib/supabase-admin";
import { unstable_cache, revalidateTag } from "next/cache";

export interface Category {
    id: string;
    name: string;
    slug: string;
    description?: string;
    createdAt: Date;
    products?: any[];
}

function generateSlug(name: string): string {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

// ── READ (cached) ─────────────────────────────────────────────────────────
export const getCategories = () => {
    return unstable_cache(
        async () => {
            try {
                const { data, error } = await supabaseAdmin
                    .from('categories')
                    .select('*, products(id)')
                    .order('name', { ascending: true });

                if (error) throw error;

                return (data || []).map(cat => ({
                    id: cat.id,
                    name: cat.name,
                    slug: cat.slug,
                    description: cat.description,
                    createdAt: new Date(cat.created_at),
                    products: cat.products || []
                }));
            } catch (err) {
                console.error("Categories fetch error (getCategories):", err);
                return [];
            }
        },
        ['categories-list'],
        { revalidate: 60, tags: ['categories'] }
    )();
};

export const getCategoryById = async (id: string) => {
    try {
        const { data: category, error: catError } = await supabaseAdmin
            .from('categories')
            .select('*')
            .eq('id', id)
            .single();

        if (catError || !category) return null;
        
        const { data: products, error: prodError } = await supabaseAdmin
            .from('products')
            .select('*')
            .eq('category_id', id)
            .eq('status', 'ACTIVE')
            .order('created_at', { ascending: false });

        if (prodError) throw prodError;

        return { 
            id: category.id, 
            ...category, 
            createdAt: new Date(category.created_at),
            products: (products || []).map(p => ({
                ...p,
                createdAt: new Date(p.created_at),
                category: { id: category.id, name: category.name }
            }))
        };
    } catch (err) {
        console.error("Category fetch error (getCategoryById):", err);
        return null;
    }
};

export const getCategoryBySlug = async (slug: string) => {
    try {
        const { data: category, error: catError } = await supabaseAdmin
            .from('categories')
            .select('*')
            .eq('slug', slug)
            .single();

        if (catError || !category) return null;
        
        const { data: products, error: prodError } = await supabaseAdmin
            .from('products')
            .select('*')
            .eq('category_id', category.id)
            .eq('status', 'ACTIVE')
            .order('created_at', { ascending: false });

        if (prodError) throw prodError;

        return { 
            ...category, 
            createdAt: new Date(category.created_at),
            products: (products || []).map(p => ({
                ...p,
                createdAt: new Date(p.created_at),
                category: { id: category.id, name: category.name }
            }))
        };
    } catch (err) {
        console.error("Category fetch error (getCategoryBySlug):", err);
        return null;
    }
};

// ── CREATE ────────────────────────────────────────────────────────────────
export const createCategory = async (data: {
    name: string;
    description?: string;
}) => {
    const slug = generateSlug(data.name);
    const { data: newCategory, error } = await supabaseAdmin
        .from('categories')
        .insert([{
            name: data.name,
            description: data.description,
            slug
        }])
        .select()
        .single();

    if (error) throw error;
    (revalidateTag as any)('categories');
    return { ...newCategory, id: newCategory.id };
};

// ── UPDATE ────────────────────────────────────────────────────────────────
export const updateCategory = async (
    id: string,
    data: Partial<{ name: string; description: string }>
) => {
    const updateData: Record<string, any> = { ...data };
    if (data.name) {
        updateData.slug = generateSlug(data.name);
    }
    
    const { data: updatedCategory, error } = await supabaseAdmin
        .from('categories')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;
    (revalidateTag as any)('categories');
    return { ...updatedCategory, id: updatedCategory.id };
};

// ── DELETE ────────────────────────────────────────────────────────────────
export const deleteCategory = async (id: string) => {
    const { error } = await supabaseAdmin
        .from('categories')
        .delete()
        .eq('id', id);

    if (error) throw error;
    (revalidateTag as any)('categories');
    return { id };
};
