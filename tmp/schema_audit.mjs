
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

async function inspectSchema() {
    console.log("--- SCHEMA & DATA AUDIT ---");
    
    // 1. Check all column names for 'products'
    console.log("\nInspecting products table columns...");
    const { data: cols, error: cError } = await supabase.rpc('get_table_columns', { table_name: 'products' });
    
    // If RPC is missing, try a direct query and inspect keys
    const { data: sample } = await supabase.from('products').select('*').limit(1);
    if (sample && sample[0]) {
        console.log("Found columns:", Object.keys(sample[0]).join(', '));
    }

    // 2. Sample 10 products and check their image fields specifically
    console.log("\nSample Data (10 random products):");
    const { data: products } = await supabase.from('products').select('name, image_url, image, images').limit(10);
    console.table(products);

    // 3. Check for specific products that the user might be referring to
    // (e.g. those created a while ago)
    console.log("\nOld Products (should have images):");
    const { data: oldProducts } = await supabase.from('products').select('name, image_url, image, images').order('created_at', { ascending: true }).limit(5);
    console.table(oldProducts);
}

inspectSchema().catch(console.error);
