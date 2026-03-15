import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkSettings() {
  const { data, error } = await supabase.from('site_settings').select('*').single();
  if (error) {
    console.error('Error:', error);
  } else {
    console.log('Site Settings:', JSON.stringify(data, null, 2));
  }
}

checkSettings();
