
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function dumpState() {
    console.log('Fetching categories...');
    const { data: categories, error: catError } = await supabase.from('categories').select('*');
    if (catError) console.error('Error categories:', catError);

    console.log('Fetching brands...');
    const { data: brands, error: brandError } = await supabase.from('brands').select('*');
    if (brandError) console.error('Error brands:', brandError);

    const state = {
        categories: categories || [],
        brands: brands || []
    };

    fs.writeFileSync('db-state.json', JSON.stringify(state, null, 2));
    console.log('Saved db-state.json');
}

dumpState();
