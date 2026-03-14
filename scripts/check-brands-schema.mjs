
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkBrandsSchema() {
    const { data, error } = await supabase.from('brands').select('*').limit(1);
    if (error) {
        console.error('Error fetching brands schema:', error);
    } else {
        console.log('Columns in brands:', Object.keys(data[0] || {}));
    }
}

checkBrandsSchema();
