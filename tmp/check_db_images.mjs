
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkProducts() {
    console.log("Fetching last 10 products...");
    const { data, error } = await supabase
        .from('products')
        .select('id, name, image_url, created_at')
        .order('created_at', { ascending: false })
        .limit(10);

    if (error) {
        console.error("Error fetching products:", error);
        return;
    }

    console.table(data);
}

checkProducts();
