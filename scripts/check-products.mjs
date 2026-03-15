
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://xmaapzkhtuowexdlpttd.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkProducts() {
    try {
        const { data, error } = await supabase
            .from('products')
            .select('id, name, slug, status')
            .limit(5);

        if (error) {
            console.error("Supabase Error:", error);
            return;
        }

        console.log("Found products:", JSON.stringify(data, null, 2));
    } catch (err) {
        console.error("Fetch failed:", err);
    }
}

checkProducts();
