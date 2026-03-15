import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function check() {
  try {
    const { data: orders, error } = await supabase
        .from("orders")
        .select("*, customers(shop_name)")
        .neq("status", "CANCELLED")
        .order("created_at", { ascending: false });
    
    console.log("Orders error:", error);
    
    const { data: customers, error: cError } = await supabase
        .from("customers")
        .select("*")
        .order("name", { ascending: true });
        
    console.log("Customers error:", cError);
  } catch(e) {
    console.log("Exception:", e);
  }
}

check();
