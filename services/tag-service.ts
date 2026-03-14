import { supabaseAdmin } from "@/lib/supabase-admin";
import { revalidateTag } from "next/cache";

function generateSlug(name: string): string {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

// ── READ ──────────────────────────────────────────────────────────────────
export const getTags = async () => {
    const { data, error } = await supabaseAdmin
        .from('tags')
        .select('*, products(id)')
        .order('name', { ascending: true });

    if (error) throw error;

    return (data || []).map(tag => ({
        id: tag.id,
        name: tag.name,
        slug: tag.slug,
        createdAt: new Date(tag.created_at),
        products: tag.products || []
    }));
};

// ── CREATE ────────────────────────────────────────────────────────────────
export const createTag = async (data: { name: string }) => {
    const slug = generateSlug(data.name);
    const { data: newTag, error } = await supabaseAdmin
        .from('tags')
        .insert([{ name: data.name, slug }])
        .select()
        .single();

    if (error) throw error;
    (revalidateTag as any)('tags');
    return { id: newTag.id, name: newTag.name, slug: newTag.slug };
};

// ── UPDATE ────────────────────────────────────────────────────────────────
export const updateTag = async (id: string, data: { name: string }) => {
    const slug = generateSlug(data.name);
    const { data: updatedTag, error } = await supabaseAdmin
        .from('tags')
        .update({ name: data.name, slug })
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;
    (revalidateTag as any)('tags');
    return { id: updatedTag.id, name: updatedTag.name, slug: updatedTag.slug };
};

// ── DELETE ────────────────────────────────────────────────────────────────
export const deleteTag = async (id: string) => {
    const { error } = await supabaseAdmin
        .from('tags')
        .delete()
        .eq('id', id);

    if (error) throw error;
    (revalidateTag as any)('tags');
    return { id };
};
