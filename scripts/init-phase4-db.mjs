import { supabaseAdmin } from "./lib/supabase-admin.js";

async function setupDatabase() {
  console.log("Setting up Phase 4 database tables...");

  // Create site_settings table
  const { error: settingsError } = await supabaseAdmin.rpc('exec_sql', {
    sql_query: `
      CREATE TABLE IF NOT EXISTS site_settings (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        whatsapp_number text DEFAULT '+213542303496',
        facebook_page text DEFAULT 'lattafa_setif1',
        contact_email text,
        store_address text,
        logo_url text,
        updated_at timestamptz DEFAULT now()
      );

      -- Ensure one row exists
      INSERT INTO site_settings (id) 
      SELECT gen_random_uuid() 
      WHERE NOT EXISTS (SELECT 1 FROM site_settings);
    `
  });

  if (settingsError) {
    console.error("Error creating site_settings (might be missing exec_sql RPC):", settingsError);
    // Fallback: If RPC fails, we might need a different approach or just assume user handles DDL
  }

  // Create brands table
  const { error: brandsError } = await supabaseAdmin.rpc('exec_sql', {
    sql_query: `
      CREATE TABLE IF NOT EXISTS brands (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        name text UNIQUE NOT NULL,
        slug text UNIQUE NOT NULL,
        logo_url text,
        description text,
        created_at timestamptz DEFAULT now()
      );

      -- Populate with existing brands from products
      INSERT INTO brands (name, slug)
      SELECT DISTINCT brand, lower(regexp_replace(brand, '[^a-zA-Z0-9]+', '-', 'g'))
      FROM products
      WHERE brand IS NOT NULL
      ON CONFLICT (name) DO NOTHING;
    `
  });

  if (brandsError) {
    console.error("Error creating brands:", brandsError);
  }

  console.log("Database setup complete (if RPCs are supported).");
}

setupDatabase();
