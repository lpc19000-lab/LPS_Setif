-- FIX SITE SETTINGS AND SYSTEM LOGS
-- This script ensures the site_settings and system_logs tables exist and have an initial row.

-- 1. Create site_settings table if it doesn't already exist
CREATE TABLE IF NOT EXISTS site_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    whatsapp_number TEXT NOT NULL DEFAULT '+213542303496',
    facebook_page TEXT NOT NULL DEFAULT 'lattafa_setif1',
    contact_email TEXT DEFAULT 'contact@lps-setif.com',
    store_address TEXT DEFAULT 'Algeria, Setif',
    logo_url TEXT DEFAULT '/logo.png',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Insert default row if table is empty
INSERT INTO site_settings (id, whatsapp_number, facebook_page, contact_email, store_address, logo_url)
SELECT '00000000-0000-0000-0000-000000000000', '+213542303496', 'lattafa_setif1', 'contact@lps-setif.com', 'Algeria, Setif', '/logo.png'
WHERE NOT EXISTS (SELECT 1 FROM site_settings);

-- 3. Ensure system_logs table exists (referenced by @/lib/logger)
CREATE TABLE IF NOT EXISTS system_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_type TEXT NOT NULL,
    entity_id TEXT,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Enable RLS and add basic policies
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role site_settings" ON site_settings;
CREATE POLICY "Service role site_settings" ON site_settings FOR ALL USING (true);

DROP POLICY IF EXISTS "Service role system_logs" ON system_logs;
CREATE POLICY "Service role system_logs" ON system_logs FOR ALL USING (true);
