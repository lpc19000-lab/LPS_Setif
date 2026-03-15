
import { supabaseAdmin } from "./lib/supabase-admin.js";

async function checkSettings() {
    const { data, error } = await supabaseAdmin.from('site_settings').select('*');
    console.log('Site Settings:', data);
    if (error) console.error('Error:', error);
}

checkSettings();
