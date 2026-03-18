
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

async function checkUrlExistence(url) {
    if (!url || !url.startsWith('https')) {
        return { url, status: 'INVALID FORMAT' };
    }
    try {
        const response = await fetch(url, { method: 'HEAD' });
        return { url, status: response.status };
    } catch (e) {
        return { url, status: 'ERROR', message: e.message };
    }
}

async function findBrokenImages() {
    console.log("--- FINDING BROKEN IMAGE LINKS ---");
    
    const { data: products, error } = await supabase
        .from('products')
        .select('id, name, slug, image_url')
        .order('created_at', { ascending: false })
        .limit(100); 
        
    if (error) {
        console.error("Error fetching products:", error);
        return;
    }

    console.log(`Checking URLs for ${products.length} recent products...`);
    
    const broken = [];
    
    const batchSize = 10;
    for (let i = 0; i < products.length; i += batchSize) {
        const batch = products.slice(i, i + batchSize);
        process.stdout.write(`Processing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(products.length/batchSize)}... `);
        
        const checks = await Promise.all(batch.map(p => checkUrlExistence(p.image_url)));
        
        checks.forEach((result, idx) => {
            const product = batch[idx];
            if (result.status !== 200) {
                broken.push({
                    name: product.name,
                    id: product.id,
                    status: result.status,
                    url: result.url
                });
            }
        });
        console.log(`Found ${broken.length} broken so far.`);
    }
    
    console.log(`\nFound ${broken.length} products with broken image URLs (404/Not Found).`);
    
    if (broken.length > 0) {
        console.table(broken.slice(0, 15));
    }
}

findBrokenImages().catch(console.error);
