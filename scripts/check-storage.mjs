
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkStorage() {
    try {
        const { data: buckets, error } = await supabase.storage.listBuckets();
        if (error) throw error;
        console.log('Available buckets:', buckets.map(b => b.name));

        const productsBucket = buckets.find(b => b.name === 'products');
        if (!productsBucket) {
            console.log('Creating "products" bucket...');
            const { data, error: createError } = await supabase.storage.createBucket('products', {
                public: true
            });
            if (createError) console.error('Error creating bucket:', createError.message);
            else console.log('"products" bucket created successfully');
        } else {
            console.log('"products" bucket already exists');
        }
    } catch (err) {
        console.error('Storage check failed:', err.message);
    }
}

checkStorage();
