const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

async function main() {
  // Read .env file for Supabase URL and Key
  const envFile = fs.readFileSync('.env', 'utf-8');
  let url = '';
  let key = '';

  for (const line of envFile.split('\n')) {
    if (line.startsWith('NEXT_PUBLIC_SUPABASE_URL=')) {
      url = line.split('=')[1].trim();
    }
    if (line.startsWith('SUPABASE_SERVICE_ROLE_KEY=')) {
      key = line.split('=')[1].trim();
    }
  }

  if (!url || !key) {
    console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env");
    return;
  }

  const supabase = createClient(url, key);

  const { data, error } = await supabase
    .from('products')
    .update({ volumes: null })
    .neq('id', '00000000-0000-0000-0000-000000000000'); // Dummy condition to update all

  if (error) {
    console.error("Error wiping product volumes:", error);
  } else {
    console.log("Successfully wiped all product volumes!");
  }
}

main();
