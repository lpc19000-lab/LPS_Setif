
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xmaapzkhtuowexdlpttd.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDirect() {
    try {
        console.log("Querying first active product...");
        const { data: products, error } = await supabase
            .from('products')
            .select('*')
            .eq('status', 'ACTIVE')
            .limit(1);

        if (error) {
            console.error("Query Error:", error);
            return;
        }

        if (!products.length) {
            console.log("No active products found.");
            return;
        }

        const p = products[0];
        console.log(`Product: ${p.name}, ID: ${p.id}, Slug: ${p.slug}`);
        console.log("Volumes:", p.volumes);

        console.log("Testing fetch by ID...");
        const { data: single, error: singleError } = await supabase
            .from('products')
            .select('*')
            .eq('id', p.id)
            .single();
        
        if (singleError) {
            console.error("Single Fetch (ID) Error:", singleError);
        } else {
            console.log("ID Fetch Success:", single.name);
        }

        console.log("Testing fetch by Slug...");
        const { data: singleSlug, error: slugError } = await supabase
            .from('products')
            .select('*')
            .eq('slug', p.slug)
            .single();
        
        if (slugError) {
            console.error("Single Fetch (Slug) Error:", slugError);
        } else {
            console.log("Slug Fetch Success:", singleSlug.name);
        }

    } catch (err) {
        console.error("Direct check failed:", err);
    }
}

checkDirect();
