
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

async function runAudit() {
    console.log("--- SYSTEM WIDE IMAGE AUDIT ---");
    
    // 1. Get first row to see all columns
    const { data: firstRow } = await supabase.from('products').select('*').limit(1);
    if (firstRow && firstRow[0]) {
        console.log("\nTable Columns:", Object.keys(firstRow[0]).join(', '));
        console.log("\nSample Row Data:", JSON.stringify(firstRow[0], null, 2));
    }

    // 2. Check for null values in image_url
    const { count: nullCount } = await supabase.from('products').select('*', { count: 'exact', head: true }).is('image_url', null);
    const { count: emptyCount } = await supabase.from('products').select('*', { count: 'exact', head: true }).eq('image_url', '');
    
    console.log(`\nCount of products where 'image_url' is NULL: ${nullCount}`);
    console.log(`Count of products where 'image_url' is EMPTY: ${emptyCount}`);

    // 3. If there's an 'image' column, check that too
    if (firstRow && firstRow[0] && 'image' in firstRow[0]) {
        const { count: imageCount } = await supabase.from('products').select('*', { count: 'exact', head: true }).not('image', 'is', null).neq('image', '');
        console.log(`Count of products where legacy 'image' has data: ${imageCount}`);
    }

    // 4. Sample some "old" products
    console.log("\nSampling 5 oldest products:");
    const { data: oldOnes } = await supabase.from('products').select('*').order('created_at', { ascending: true }).limit(5);
    console.table(oldOnes?.map(p => ({
        id: p.id,
        name: p.name,
        image_url: p.image_url,
        image: p.image
    })));
}

runAudit();
