
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function audit() {
    const { data: products, error } = await supabase.from('products').select('id, image_url');
    if (error) {
        console.error(error);
        return;
    }

    const updated = products.filter(p => !p.image_url.includes('placeholder')).length;
    console.log(`--- Image Audit ---`);
    console.log(`Total Products: ${products.length}`);
    console.log(`Updated with Real Images: ${updated}`);
    console.log(`Still using Placeholder: ${products.length - updated}`);
}

audit();
