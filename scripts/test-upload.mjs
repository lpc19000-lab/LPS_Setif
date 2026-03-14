
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

console.log('--- STARTING IMAGE UPLOADER ---');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    console.log('Connecting to storage...');
    const { data: buckets, error } = await supabase.storage.listBuckets();
    if (error) {
        console.error('Bucket list error:', error.message);
        return;
    }
    console.log('Buckets found:', buckets.map(b => b.name));
    
    // Check if products exists, else create it
    if (!buckets.find(b => b.name === 'products')) {
        console.log('Creating "products" bucket...');
        await supabase.storage.createBucket('products', { public: true });
    }

    console.log('Fetching products...');
    const { data: products } = await supabase.from('products').select('id, name').limit(10);
    console.log('Sample products fetched:', products.length);
    
    // Process only 5 for testing
    for (const p of products.slice(0, 5)) {
        console.log(`Checking: ${p.name}`);
    }
}

run().then(() => console.log('--- FINISHED ---')).catch(e => console.error(e));
