import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function listTables() {
  const { data, error } = await supabase.rpc('get_tables');
  if (error) {
    // If RPC doesn't exist, try querying pg_catalog
    const { data: tables, error: pgError } = await supabase.from('pg_tables').select('tablename').eq('schemaname', 'public');
    if (pgError) {
      console.error('Error listing tables:', pgError);
    } else {
      console.log('Tables:', tables.map(t => t.tablename));
    }
  } else {
    console.log('Tables:', data);
  }
}

listTables();
