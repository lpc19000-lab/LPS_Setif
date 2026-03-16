import { supabaseAdmin } from "@/lib/supabase-admin";
import { unstable_cache, revalidateTag } from "next/cache";

// Core Product interface for the application
export interface Product {
    id: string;
    name: string;
    slug: string;
    brand: string;
    image: string;
    imageUrl: string;
    price: number;
    basePrice: number;
    stockWeight: number;
    description: string;
    status: string;
    createdAt: Date;
    updatedAt: Date;
    category: { id: string; name: string } | null;
    categoryId: string | null;
    images: any[];
    volumes: any[];
    tagIds: string[];
    collectionIds: string[];
}

// ── Utility ───────────────────────────────────────────────────────────────
function generateSlug(name: string): string {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

// Product Mapping from Supabase structure
function mapProduct(data: any): Product {
    const imageUrl = data.image_url || data.image || "";
    const basePrice = Number(data.base_price || data.price || 0);

    return {
        id: data.id,
        name: data.name || "Unknown Product",
        slug: data.slug || "",
        brand: data.brand || "LPS",
        image: imageUrl,
        imageUrl: imageUrl, 
        price: basePrice,
        basePrice: basePrice,
        stockWeight: data.stock_weight || 0,
        description: data.description || "",
        status: data.status || "ACTIVE",
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
        category: data.category_id ? { id: data.category_id, name: data.category_name || "" } : null,
        categoryId: data.category_id,
        images: (data.images || []).sort((a: any, b: any) => (a.position || 0) - (b.position || 0)),
        volumes: (data.volumes && data.volumes.length > 0) ? data.volumes : [
            { id: 'v100', weight: 100, price: basePrice * 1 },
            { id: 'v500', weight: 500, price: basePrice * 5 },
            { id: 'v1000', weight: 1000, price: basePrice * 10 }
        ],
        tagIds: data.tag_ids || [],
        collectionIds: data.collection_ids || [],
    };
}

// ── READ ──────────────────────────────────────────────────────────────────
export const getActiveProducts = (filters?: {
    categoryId?: string;
    brand?: string;
    search?: string;
    collectionSlug?: string;
    tagSlug?: string;
    inStock?: boolean;
    limit?: number;
    skip?: number;
}) => {
    const fetchFunc = async () => {
        try {
            let query = supabaseAdmin
                .from('products')
                .select('*')
                .eq('status', 'ACTIVE');

            if (filters?.categoryId) query = query.eq('category_id', filters.categoryId);
            if (filters?.brand) query = query.eq('brand', filters.brand);
            if (filters?.inStock) query = query.gt('stock_weight', 0);

            // Handle slugs for collections and tags (these might need joins or separate queries)
            // For now, keeping the logic similar - if slugs are provided, we filter after or use a more complex query.
            
            const { data, error } = await query;
            if (error) throw error;

            let products = (data || []).map(mapProduct);

            // Client-side filtering for search (or move to Postgres text search)
            if (filters?.search) {
                const s = filters.search.toLowerCase();
                products = products.filter((p: Product) => {
                    const searchable = `${p.name} ${p.brand} ${p.description} ${p.category?.name || ""}`.toLowerCase();
                    return filters.search!.toLowerCase().trim().split(/\s+/).every(term => searchable.includes(term));
                });
            }

            // Collection/Tag filtering logic would go here
            // (Similar to Firestore version, could be optimized with Joins in SQL)

            const total = products.length;
            const skip = filters?.skip || 0;
            const limit = filters?.limit || 50;
            const paged = products.slice(skip, skip + limit);

            return { products: paged, total };
        } catch (err) {
            console.error("Products fetch error (getActiveProducts):", err);
            return { products: [], total: 0 };
        }
    };

    const cacheKey = JSON.stringify(filters || {});
    return unstable_cache(
        fetchFunc,
        ['products', cacheKey],
        { revalidate: 60, tags: ['products'] }
    )();
};

export const getProducts = (filters?: {
    categoryId?: string;
    brand?: string;
    search?: string;
    status?: string;
    limit?: number;
}) => {
    const fetchFunc = async () => {
        try {
            let query = supabaseAdmin.from('products').select('*');

            if (filters?.categoryId) query = query.eq('category_id', filters.categoryId);
            if (filters?.brand) query = query.eq('brand', filters.brand);
            if (filters?.status) query = query.eq('status', filters.status);

            const { data, error } = await query;
            if (error) throw error;

            let products = (data || []).map(mapProduct);

            if (filters?.search) {
                const s = filters.search.toLowerCase();
                products = products.filter((p: Product) => {
                    const searchable = `${p.name} ${p.brand} ${p.description} ${p.category?.name || ""}`.toLowerCase();
                    return filters.search!.toLowerCase().trim().split(/\s+/).every(term => searchable.includes(term));
                });
            }

            return products;
        } catch (err) {
            console.error("Products fetch error (getProducts):", err);
            return [];
        }
    };

    const cacheKey = JSON.stringify(filters || {});
    return unstable_cache(
        fetchFunc,
        ['admin-products', cacheKey],
        { tags: ['products'] }
    )();
};

export const getProductById = async (id: string) => {
    try {
        const { data, error } = await supabaseAdmin
            .from('products')
            .select('*')
            .eq('id', id)
            .single();
        
        if (error || !data) return null;
        return mapProduct(data);
    } catch (err) {
        console.error("Product fetch error (getProductById):", err);
        return null;
    }
};

export const getProductBySlug = async (slug: string) => {
    try {
        const { data, error } = await supabaseAdmin
            .from('products')
            .select('*')
            .eq('slug', slug)
            .single();
        
        if (error || !data) return null;
        return mapProduct(data);
    } catch (err) {
        console.error("Product fetch error (getProductBySlug):", err);
        return null;
    }
};

// ── Featured / New Arrivals / Best Sellers ────────────────────────────────
export const getFeaturedProducts = (limit = 8) => {
    return unstable_cache(
        async () => {
            try {
                // Assuming tag_ids contains the UUID of the 'featured' tag
                // This logic might need to fetch the tag ID first
                const { data: tagData } = await supabaseAdmin
                    .from('tags')
                    .select('id')
                    .eq('slug', 'featured')
                    .single();
                
                if (!tagData) return [];

                const { data, error } = await supabaseAdmin
                    .from('products')
                    .select('*')
                    .eq('status', 'ACTIVE')
                    .contains('tag_ids', [tagData.id])
                    .limit(limit);

                if (error) throw error;
                return (data || []).map(mapProduct);
            } catch (err) {
                console.error("Products fetch error (getFeaturedProducts):", err);
                return [];
            }
        },
        ['featured-products', String(limit)],
        { tags: ['products', 'featured'] }
    )();
};

export const getNewArrivals = (limit = 8) => {
    return unstable_cache(
        async () => {
            try {
                const { data, error } = await supabaseAdmin
                    .from('products')
                    .select('*')
                    .eq('status', 'ACTIVE')
                    .order('created_at', { ascending: false })
                    .limit(limit);
                
                if (error) throw error;
                return (data || []).map(mapProduct);
            } catch (err) {
                console.error("Products fetch error (getNewArrivals):", err);
                return [];
            }
        },
        ['new-arrivals', String(limit)],
        { tags: ['products', 'new-arrivals'] }
    )();
};

export const getBestSellers = (limit = 8) => {
    return unstable_cache(
        async () => {
            try {
                const { data, error } = await supabaseAdmin
                    .from('products')
                    .select('*')
                    .eq('status', 'ACTIVE')
                    .order('sales_units_sold', { ascending: false })
                    .limit(limit);
                
                if (error) throw error;
                return (data || []).map(mapProduct);
            } catch (err) {
                console.error("Products fetch error (getBestSellers):", err);
                return [];
            }
        },
        ['best-sellers', String(limit)],
        { tags: ['products', 'best-sellers'] }
    )();
};

// ── CREATE ────────────────────────────────────────────────────────────────
export const createProduct = async (data: {
    name: string;
    brand: string;
    description: string;
    categoryId: string;
    imageUrl: string;
    basePrice: number;
    stockWeight: number;
    lowStockThreshold?: number;
    status?: string;
    collectionIds?: string[];
    tagIds?: string[];
    additionalImages?: string[];
    volumes?: { weight: number; price: number }[];
}) => {
    const slug = generateSlug(data.name) + "-" + Date.now().toString(36);
    
    // Prepare images array
    const images = (data.additionalImages || []).map((url, i) => ({
        imageUrl: url,
        isPrimary: i === 0 && !data.imageUrl,
        position: i
    }));

    // Prepare volumes array
    const volumes = (data.volumes || []).map((v, i) => ({
        id: `vol-${Date.now()}-${i}`,
        weight: v.weight,
        price: v.price
    }));

    const { data: newProduct, error } = await supabaseAdmin
        .from('products')
        .insert([{
            name: data.name,
            brand: data.brand,
            slug,
            description: data.description,
            category_id: data.categoryId,
            image_url: data.imageUrl,
            base_price: data.basePrice,
            stock_weight: data.stockWeight,
            low_stock_threshold: data.lowStockThreshold || 500,
            status: data.status || "ACTIVE",
            collection_ids: data.collectionIds || [],
            tag_ids: data.tagIds || [],
            volumes: volumes,
            images: images,
            sales_units_sold: 0,
            sales_revenue: 0
        }])
        .select()
        .single();

    if (error) throw error;

    // Log initial stock
    if (data.stockWeight > 0) {
        await supabaseAdmin.from('inventory_logs').insert([{
            product_id: newProduct.id,
            change_type: "INITIAL_STOCK",
            quantity: data.stockWeight,
            source: "ADMIN",
            reason: "Initial stock on product creation"
        }]);
    }

    (revalidateTag as any)('products');
    return mapProduct(newProduct);
};

// ── UPDATE ────────────────────────────────────────────────────────────────
export const updateProduct = async (
    id: string,
    data: Partial<{
        name: string;
        brand: string;
        description: string;
        categoryId: string;
        imageUrl: string;
        basePrice: number;
        stockWeight: number;
        lowStockThreshold: number;
        status: string;
        collectionIds: string[];
        tagIds: string[];
        volumes: { weight: number; price: number }[];
    }>
) => {
    const updateObj: any = { ...data, updated_at: new Date() };

    // Map names to snake_case for PostgreSQL
    if (data.imageUrl) { updateObj.image_url = data.imageUrl; delete updateObj.imageUrl; }
    if (data.basePrice) { updateObj.base_price = data.basePrice; delete updateObj.basePrice; }
    if (data.categoryId) { updateObj.category_id = data.categoryId; delete updateObj.categoryId; }
    if (data.stockWeight !== undefined) { updateObj.stock_weight = data.stockWeight; delete updateObj.stockWeight; }
    if (data.lowStockThreshold !== undefined) { updateObj.low_stock_threshold = data.lowStockThreshold; delete updateObj.lowStockThreshold; }
    if (data.collectionIds) { updateObj.collection_ids = data.collectionIds; delete updateObj.collectionIds; }
    if (data.tagIds) { updateObj.tag_ids = data.tagIds; delete updateObj.tagIds; }

    const { data: updatedProduct, error } = await supabaseAdmin
        .from('products')
        .update(updateObj)
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;
    (revalidateTag as any)('products');
    return mapProduct(updatedProduct);
};

// ── DELETE ────────────────────────────────────────────────────────────────
export const deleteProduct = async (id: string) => {
    const { error } = await supabaseAdmin
        .from('products')
        .delete()
        .eq('id', id);

    if (error) throw error;
    (revalidateTag as any)('products');
    return { id };
};

// ── LOW STOCK ─────────────────────────────────────────────────────────────
export const getLowStockProducts = async () => {
    const { data, error } = await supabaseAdmin
        .from('products')
        .select('*')
        .lte('stock_weight', 500)
        .order('stock_weight', { ascending: true });
    
    if (error) throw error;
    return (data || []).map(mapProduct);
};
