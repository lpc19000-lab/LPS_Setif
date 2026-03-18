
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
    console.log("--- MISSING IMAGE INVESTIGATION ---");
    
    // 1. Find products where image_url is null or empty
    const { data: missingImageProducts, error } = await supabase
        .from('products')
        .select('id, name, slug, image_url, image')
        .or('image_url.is.null,image_url.eq.""');
        
    if (error) {
        console.error("Error fetching products:", error);
        return;
    }

    console.log(`Found ${missingImageProducts.length} products with no image_url.`);
    
    if (missingImageProducts.length > 0) {
        console.log("\nSample of products missing images:");
        console.table(missingImageProducts.slice(0, 10));
    } else {
        // If none are literally empty, maybe they have a malformed URL?
        console.log("\nNo products have a strictly null/empty image_url.");
        
        // Let's check for URLs that might be placeholders or malformed
        const { data: weirdUrls } = await supabase
            .from('products')
            .select('id, name, image_url')
            .not('image_url', 'ilike', 'https://%') // doesn't start with https://
            .not('image_url', 'ilike', '/%'); // doesn't start with /
            
        console.log(`\nFound ${weirdUrls?.length || 0} products with potentially malformed URLs (not starting with https:// or /).`);
        if (weirdUrls && weirdUrls.length > 0) {
           console.table(weirdUrls.slice(0, 5));
        }
    }
}

findMissingImages().catch(console.error);
