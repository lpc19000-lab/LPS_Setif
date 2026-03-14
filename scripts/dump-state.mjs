
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function dumpState() {
    try {
        console.log('Fetching categories...');
        const { data: categories, error: catError } = await supabase.from('categories').select('*');
        if (catError) throw catError;

        console.log('Fetching brands...');
        const { data: brands, error: brandError } = await supabase.from('brands').select('*');
        if (brandError) throw brandError;

        const state = {
            categories: categories || [],
            brands: brands || []
        };

        fs.writeFileSync('db-state.json', JSON.stringify(state, null, 2));
        console.log('Saved db-state.json');
    } catch (err) {
        console.error('Error in dumpState:', err);
    }
}

dumpState();
