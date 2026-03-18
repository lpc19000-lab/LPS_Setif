
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

async function findMissingImages() {
    console.log("--- STARTING MISSING IMAGE INVESTIGATION ---");
    
    // Let's get all products and filter manually to be safe against PostgREST syntax errors
    const { data: allProducts, error } = await supabase
        .from('products')
        .select('id, name, slug, image_url');
        
    if (error) {
        console.error("Error fetching products:", error);
        return;
    }

    const missingOrEmpty = allProducts.filter(p => !p.image_url || p.image_url.trim() === '');
    
    console.log(`Found ${missingOrEmpty.length} products with strictly NO image_url or empty string.`);
    
    if (missingOrEmpty.length > 0) {
        console.log("\nSample of products missing images:");
        console.table(missingOrEmpty.slice(0, 10));
    }
    
    // Check for weird URLs (e.g. just the word "undefined" or not starting with http/slash)
    const malformed = allProducts.filter(p => 
        p.image_url && 
        p.image_url.trim() !== '' && 
        !p.image_url.startsWith('http') && 
        !p.image_url.startsWith('/')
    );
    
    console.log(`\nFound ${malformed.length} products with potentially malformed URLs.`);
    if (malformed.length > 0) {
        console.table(malformed.slice(0, 5));
    }
}

findMissingImages().catch(console.error);
