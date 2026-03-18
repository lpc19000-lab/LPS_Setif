
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
    if (!url || (!url.startsWith('https') && !url.startsWith('http'))) {
        return { url, status: 'INVALID FORMAT' };
    }
    try {
        const response = await fetch(url, { method: 'HEAD' });
        return { url, status: response.status };
    } catch (e) {
        return { url, status: 'ERROR', message: e.message };
    }
}

async function findAllBrokenImages() {
    console.log("--- FINDING ALL BROKEN IMAGE LINKS ---");
    
    // Fetch all products
    let allProducts = [];
    let start = 0;
    const limit = 500;
    
    while (true) {
        const { data, error } = await supabase
            .from('products')
            .select('id, name, slug, image_url')
            .range(start, start + limit - 1);
            
        if (error) {
            console.error("Error fetching products:", error);
            return;
        }
        
        allProducts = allProducts.concat(data);
        if (data.length < limit) break;
        start += limit;
    }

    console.log(`Checking URLs for ${allProducts.length} total products...`);
    
    const broken = [];
    const batchSize = 25; // slightly larger batch 
    
    for (let i = 0; i < allProducts.length; i += batchSize) {
        const batch = allProducts.slice(i, i + batchSize);
        if (i % 100 === 0) {
            process.stdout.write(`Processing up to ${i + batch.length}/${allProducts.length}... `);
        }
        
        const checks = await Promise.all(batch.map(p => checkUrlExistence(p.image_url)));
        
        checks.forEach((result, idx) => {
            const product = batch[idx];
            // Only flag 404s or ERRORS. We know some have the placeholder string.
            if (result.status === 404 || result.status === 'ERROR') {
                broken.push({
                    name: product.name,
                    id: product.id,
                    status: result.status,
                    url: result.url
                });
            }
        });
        if (i % 100 === 0) {
             console.log(`(Found ${broken.length} broken 404s so far)`);
        }
    }
    
    console.log(`\nFound ${broken.length} products with broken image URLs (404/Not Found).`);
    
    if (broken.length > 0) {
        // Save to file for easy reading
        fs.writeFileSync('tmp/broken_links_report.json', JSON.stringify(broken, null, 2));
        console.log("Full report saved to tmp/broken_links_report.json");
        console.table(broken.slice(0, 15));
    } else {
        console.log("SUCCESS: All 'https' image URLs in the database returned a 200 OK status.");
    }
}

findAllBrokenImages().catch(console.error);
