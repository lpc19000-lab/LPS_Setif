
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

// Manually parse .env.local to avoid dependency issues
const envFile = fs.readFileSync('.env.local', 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
    const [key, ...value] = line.split('=');
    if (key && value.length > 0) {
        env[key.trim()] = value.join('=').trim().replace(/^"(.*)"$/, '$1');
    }
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase configuration in .env.local");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runDiagnostics() {
    console.log("--- PRODUCT DATA DIAGNOSTICS ---");
    
    // 1. Check a sample of products
    console.log("\nSample Products (Last 5):");
    const { data: products, error: pError } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);
    
    if (pError) {
        console.error("Error fetching products:", pError);
    } else {
        products.forEach(p => {
            console.log(`ID: ${p.id}`);
            console.log(`Name: ${p.name}`);
            console.log(`image_url (DB): ${p.image_url}`);
            console.log(`image (DB - legacy check): ${p.image}`);
            console.log(`---`);
        });
    }

    // 2. Count total products and those with images
    const { count: totalCount } = await supabase.from('products').select('*', { count: 'exact', head: true });
    const { count: hasImageUrlCount } = await supabase.from('products').select('*', { count: 'exact', head: true }).not('image_url', 'is', null).neq('image_url', '');
    const { count: hasImageCount } = await supabase.from('products').select('*', { count: 'exact', head: true }).not('image', 'is', null).neq('image', '');

    console.log(`\nStatistics:`);
    console.log(`Total Products: ${totalCount}`);
    console.log(`Products with 'image_url': ${hasImageUrlCount}`);
    console.log(`Products with legacy 'image': ${hasImageCount}`);
}

runDiagnostics();
