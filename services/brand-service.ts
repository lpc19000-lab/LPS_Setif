import { supabaseAdmin } from "@/lib/supabase-admin";

export interface Brand {
    id: string;
    name: string;
    slug: string;
    description?: string;
    logo_url?: string;
    website_url?: string;
    created_at: string;
}

export const getBrands = async () => {
    const { data, error } = await supabaseAdmin
        .from('brands')
        .select('*')
        .order('name', { ascending: true });

    if (error) throw error;
    return data as Brand[];
};

export const createBrand = async (data: Partial<Brand>) => {
    const { data: brand, error } = await supabaseAdmin
        .from('brands')
        .insert([data])
        .select()
        .single();

    if (error) throw error;
    return brand as Brand;
};

export const updateBrand = async (id: string, data: Partial<Brand>) => {
    const { data: brand, error } = await supabaseAdmin
        .from('brands')
        .update(data)
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;
    return brand as Brand;
};

export const deleteBrand = async (id: string) => {
    const { error } = await supabaseAdmin
        .from('brands')
        .delete()
        .eq('id', id);

    if (error) throw error;
    return true;
};
