import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function check() {
  const { data, error } = await supabase.from("products").select("*, category:categories(name), brand_rel:brands(name)").order("created_at", { ascending: false }).limit(5);
  console.log("Products:", !!data, data?.length, "Error:", error);
}

check();
