
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Read .env.local
const env = fs.readFileSync('.env.local', 'utf8');
const envVars = Object.fromEntries(env.split('\n').filter(l => l.includes('=')).map(l => l.trim().split('=')));

const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = envVars.SUPABASE_SERVICE_ROLE_KEY || envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

const targets = ['angel elixir', 'amir banafa', 'almas kajal', 'al thair', 'adidas', 'absolu aventus 2025'];

async function matchAndFix() {
    console.log('Searching for products...');
    const { data: products, error } = await supabase.from('products').select('id, name, image_url');
    if (error) {
        console.error(error);
        return;
    }

    const matches = products.filter(p => targets.some(t => p.name.toLowerCase().includes(t.toLowerCase())));
    console.log('Matches found:', JSON.stringify(matches, null, 2));
}

matchAndFix();
