
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xmaapzkhtuowexdlpttd.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkBrandsTable() {
    try {
        console.log("Checking if 'brands' table exists and has data...");
        const { data, error } = await supabase
            .from('brands')
            .select('*')
            .limit(5);

        if (error) {
            console.error("'brands' Table Error:", error);
        } else {
            console.log("'brands' Table Found. Data:", data);
        }

        console.log("Checking 'products' table for brand columns...");
        const { data: cols, error: colError } = await supabase
            .rpc('get_table_columns', { table_name: 'products' });
        
        if (colError) {
             // Fallback: select * and check keys
             const { data: row } = await supabase.from('products').select('*').limit(1).single();
             console.log("Product Row Keys:", row ? Object.keys(row) : "No data");
        } else {
            console.log("Products Columns:", cols);
        }

    } catch (err) {
        console.error("Check failed:", err);
    }
}

checkBrandsTable();
