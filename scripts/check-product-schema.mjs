
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
    const { data, error } = await supabase.rpc('get_table_info', { table_name: 'products' });
    if (error) {
        // Fallback: try to select one row
        const { data: row, error: rowError } = await supabase.from('products').select('*').limit(1);
        if (rowError) {
            console.error('Error fetching schema:', rowError);
        } else {
            console.log('Columns in products:', Object.keys(row[0] || {}));
        }
    } else {
        console.log('Schema info:', data);
    }
}

checkSchema();
