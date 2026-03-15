
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function findMissingImages() {
    const { data, error } = await supabase
        .from('products')
        .select('id, name, image_url')
        .or('image_url.is.null, image_url.eq.""');

    if (error) {
        console.error('Error fetching products:', error);
        return;
    }

    console.log('PRODUCTS_WITHOUT_IMAGES_START');
    console.log(JSON.stringify(data, null, 2));
    console.log('PRODUCTS_WITHOUT_IMAGES_END');
}

findMissingImages();
