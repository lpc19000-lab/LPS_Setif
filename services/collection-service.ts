import { supabaseAdmin } from "@/lib/supabase-admin";
import { unstable_cache, revalidateTag } from "next/cache";

function generateSlug(name: string): string {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

// ── READ (cached) ─────────────────────────────────────────────────────────
export const getCollections = () => {
    return unstable_cache(
        async () => {
            try {
                const { data, error } = await supabaseAdmin
                    .from('collections')
                    .select('*, products(id)')
                    .order('name', { ascending: true });

                if (error) throw error;

                return (data || []).map(c => ({
                    id: c.id,
                    name: c.name,
                    slug: c.slug,
                    createdAt: new Date(c.created_at),
                    products: c.products || []
                }));
            } catch (err) {
                console.error("Collections fetch error (getCollections):", err);
                return [];
            }
        },
        ['collections-list'],
        { revalidate: 60, tags: ['collections'] }
    )();
};

export const getCollectionBySlug = async (slug: string) => {
    try {
        const { data: collection, error: cError } = await supabaseAdmin
            .from('collections')
            .select('*')
            .eq('slug', slug)
            .single();

        if (cError || !collection) return null;

        const { data: products, error: pError } = await supabaseAdmin
            .from('products')
            .select('*, categories(id, name)')
            .contains('collection_ids', [collection.id])
            .eq('status', 'ACTIVE');

        if (pError) throw pError;

        const mappedProducts = (products || []).map(p => ({
            product: {
                id: p.id,
                ...p,
                createdAt: new Date(p.created_at),
                category: p.categories ? { id: p.categories.id, name: p.categories.name } : null
            }
        }));

        return { ...collection, products: mappedProducts };
    } catch (err) {
        console.error("Collection fetch error (getCollectionBySlug):", err);
        return null;
    }
};

// ── CREATE ────────────────────────────────────────────────────────────────
export const createCollection = async (data: { name: string }) => {
    const slug = generateSlug(data.name);
    const { data: newColl, error } = await supabaseAdmin
        .from('collections')
        .insert([{ name: data.name, slug }])
        .select()
        .single();

    if (error) throw error;
    (revalidateTag as any)('collections');
    return { ...newColl, id: newColl.id };
};

// ── UPDATE ────────────────────────────────────────────────────────────────
export const updateCollection = async (id: string, data: { name: string }) => {
    const slug = generateSlug(data.name);
    const { data: updated, error } = await supabaseAdmin
        .from('collections')
        .update({ name: data.name, slug })
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;
    (revalidateTag as any)('collections');
    return { ...updated, id: updated.id };
};

// ── DELETE ────────────────────────────────────────────────────────────────
export const deleteCollection = async (id: string) => {
    const { error } = await supabaseAdmin
        .from('collections')
        .delete()
        .eq('id', id);

    if (error) throw error;
    (revalidateTag as any)('collections');
    return { id };
};

