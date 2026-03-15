
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkProduct() {
    // Get first product
    const { data: products, error } = await supabase.from('products').select('*').limit(5);
    if (error) {
        console.error("Supabase Error:", error);
        return;
    }

    if (!products || products.length === 0) {
        console.log("No products found in database.");
        return;
    }

    console.log("Sample Products:");
    products.forEach(p => {
        console.log(`- ID: ${p.id}, Name: ${p.name}, Slug: ${p.slug}`);
    });

    const testSlug = products[0].slug;
    console.log(`\nTesting fetch by slug: ${testSlug}`);
    const { data: single, error: singleError } = await supabase
        .from('products')
        .select('*')
        .eq('slug', testSlug)
        .single();
    
    if (singleError) {
        console.error("Fetch by Slug Error:", singleError);
    } else {
        console.log("Successfully fetched:", single.name);
    }
}

checkProduct();
