
import { supabaseAdmin } from './lib/supabase-admin';

async function checkCategories() {
    const { data, error } = await supabaseAdmin.from('categories').select('*');
    if (error) {
        console.error('Error fetching categories:', error);
        return;
    }
    console.log('Categories:', JSON.stringify(data, null, 2));
}

checkCategories();
