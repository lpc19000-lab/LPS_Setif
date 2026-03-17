
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

async function runCheck() {
    console.log("--- STORAGE BUCKET CHECK ---");
    const { data: buckets, error } = await supabase.storage.listBuckets();
    if (error) {
        console.error("Error listing buckets:", error);
    } else {
        console.log("Available Buckets:", buckets.map(b => b.name).join(', '));
    }

    // Check a sample file from each bucket if possible
    for (const bucket of buckets || []) {
        console.log(`\nFiles in bucket '${bucket.name}':`);
        const { data: files } = await supabase.storage.from(bucket.name).list('products', { limit: 5 });
        console.table(files?.map(f => ({ name: f.name, id: f.id })));
    }
}

runCheck();
