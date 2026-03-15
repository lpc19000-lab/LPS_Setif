import { sql } from 'postgres';
import postgres from 'postgres';
import * as dotenv from 'dotenv';
import path from 'path';

// Load .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const dbUrl = process.env.DIRECT_URL || process.env.DATABASE_URL;

if (!dbUrl) {
  console.error('No DATABASE_URL or DIRECT_URL found in .env.local');
  process.exit(1);
}

const sqlClient = postgres(dbUrl, { ssl: 'require' });

async function main() {
  try {
    console.log('Creating missing tables...');

    await sqlClient`
      CREATE TABLE IF NOT EXISTS site_settings (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          whatsapp_number TEXT DEFAULT '+213542303496',
          facebook_page TEXT DEFAULT 'lattafa_setif1',
          contact_email TEXT DEFAULT 'contact@lps-setif.com',
          store_address TEXT DEFAULT 'Algeria, Setif',
          logo_url TEXT,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;

    await sqlClient`
      CREATE TABLE IF NOT EXISTS categories (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          name TEXT NOT NULL,
          slug TEXT UNIQUE NOT NULL,
          description TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;

    await sqlClient`
      CREATE TABLE IF NOT EXISTS brands (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          name TEXT NOT NULL,
          slug TEXT UNIQUE NOT NULL,
          description TEXT,
          image_url TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;

    await sqlClient`
      CREATE TABLE IF NOT EXISTS collections (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          name TEXT NOT NULL,
          slug TEXT UNIQUE NOT NULL,
          description TEXT,
          image_url TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;

    await sqlClient`
      CREATE TABLE IF NOT EXISTS tags (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          name TEXT NOT NULL,
          slug TEXT UNIQUE NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;

    console.log('Adding RLS policies...');
    
    // Enable RLS
    await sqlClient`ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;`;
    await sqlClient`ALTER TABLE categories ENABLE ROW LEVEL SECURITY;`;
    await sqlClient`ALTER TABLE brands ENABLE ROW LEVEL SECURITY;`;
    await sqlClient`ALTER TABLE collections ENABLE ROW LEVEL SECURITY;`;
    await sqlClient`ALTER TABLE tags ENABLE ROW LEVEL SECURITY;`;

    // Policies
    await sqlClient`CREATE POLICY "Public site_settings access" ON site_settings FOR SELECT USING (true);`;
    await sqlClient`CREATE POLICY "Admin site_settings modification" ON site_settings FOR ALL USING (current_setting('role') = 'service_role');`;

    await sqlClient`CREATE POLICY "Public categories access" ON categories FOR SELECT USING (true);`;
    await sqlClient`CREATE POLICY "Admin categories modification" ON categories FOR ALL USING (current_setting('role') = 'service_role');`;

    await sqlClient`CREATE POLICY "Public brands access" ON brands FOR SELECT USING (true);`;
    await sqlClient`CREATE POLICY "Admin brands modification" ON brands FOR ALL USING (current_setting('role') = 'service_role');`;

    await sqlClient`CREATE POLICY "Public collections access" ON collections FOR SELECT USING (true);`;
    await sqlClient`CREATE POLICY "Admin collections modification" ON collections FOR ALL USING (current_setting('role') = 'service_role');`;

    await sqlClient`CREATE POLICY "Public tags access" ON tags FOR SELECT USING (true);`;
    await sqlClient`CREATE POLICY "Admin tags modification" ON tags FOR ALL USING (current_setting('role') = 'service_role');`;

    // Optionally insert default site settings row
    console.log('Inserting default site_settings...');
    await sqlClient`
      INSERT INTO site_settings (whatsapp_number, facebook_page, contact_email, store_address)
      VALUES ('+213542303496', 'lattafa_setif1', 'contact@lps-setif.com', 'Algeria, Setif')
      ON CONFLICT DO NOTHING;
    `;

    console.log('Database schema updated successfully!');
  } catch (err) {
    console.error('Error applying schema:', err);
  } finally {
    await sqlClient.end();
  }
}

main();
