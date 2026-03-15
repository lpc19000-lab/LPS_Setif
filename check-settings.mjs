
import { supabaseAdmin } from "./lib/supabase-admin.js";

async function checkSettings() {
    const { data, error } = await supabaseAdmin.from('site_settings').select('*');
    console.log('Site Settings:', JSON.stringify(data, null, 2));
    if (error) console.error('Error:', error);
}

checkSettings();
