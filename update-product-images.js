
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Read .env.local
const env = fs.readFileSync('.env.local', 'utf8');
const envVars = Object.fromEntries(env.split('\n').filter(l => l.includes('=')).map(l => l.trim().split('=')));

const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = envVars.SUPABASE_SERVICE_ROLE_KEY || envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

const imageMappings = [
    { name: 'ABSOLU AVENTUS 2025', url: '/images/perfumes/absolu aventus 2025.webp' },
    { name: 'ADIDAS', url: '/images/perfumes/adidas.jpg' },
    { name: 'AL THAIR TQ', url: '/images/perfumes/al thair.jpg' },
    { name: 'AMIR BANAFA3 TQ ++', url: '/images/perfumes/amir banafa.jpg' },
    { name: 'ALMAZ KAJAL', url: '/images/perfumes/almas kajal.jpg' },
    { name: 'ANGEL ELIXIR', url: '/images/perfumes/angel elixir.webp' }
];

async function updateImages() {
    console.log('Starting image updates...');
    for (const mapping of imageMappings) {
        const { data, error } = await supabase
            .from('products')
            .update({ image_url: mapping.url })
            .ilike('name', `%${mapping.name}%`);
        
        if (error) {
            console.error(`Error updating ${mapping.name}:`, error);
        } else {
            console.log(`Updated ${mapping.name} to ${mapping.url}`);
        }
    }
    console.log('Finished image updates.');
}

updateImages();
