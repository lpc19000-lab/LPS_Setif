
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envFile = fs.readFileSync('.env.local', 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
    const [key, ...value] = line.split('=');
    if (key && value.length > 0) {
        env[key.trim()] = value.join('=').trim().replace(/^"(.*)"$/, '$1');
    }
});

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

function mapProduct(data) {
    const imageUrl = data.image_url || data.image || "";
    const basePrice = Number(data.base_price || data.price || 0);

    return {
        id: data.id,
        name: data.name || "Unknown Product",
        slug: data.slug || "",
        brand: data.brand || "LPS",
        image: imageUrl,
        imageUrl: imageUrl, 
    };
}

async function testSlug() {
    const { data: recent, error: err1 } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1);

    if (!recent || recent.length === 0) return console.log("No products");
    const p = recent[0];
    console.log("RAW DB DATA:");
    console.log({ id: p.id, name: p.name, slug: p.slug, image_url: p.image_url });

    const slug = p.slug;
    console.log(`\nFetching by slug: ${slug}`);
    
    const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('slug', slug)
        .single();
        
    if (error) {
        console.error("Error:", error);
        return;
    }
    
    const mapped = mapProduct(data);
    console.log("\nMAPPED PRODUCT:");
    console.log(mapped);
}

testSlug().catch(console.error);
