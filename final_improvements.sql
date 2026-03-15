-- LPS Final System Improvements SQL

-- 1. Create admin_logs table
CREATE TABLE IF NOT EXISTS admin_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    admin_id UUID REFERENCES customers(id), -- Assuming admins are also in customers table but with admin role
    action TEXT NOT NULL,
    target_type TEXT NOT NULL,
    target_id TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create system_errors table
CREATE TABLE IF NOT EXISTS system_errors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    message TEXT NOT NULL,
    path TEXT,
    method TEXT,
    stack_trace TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Enable RLS and add basic policies
ALTER TABLE admin_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_errors ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role admin_logs" ON admin_logs;
CREATE POLICY "Service role admin_logs" ON admin_logs FOR ALL USING (true);

DROP POLICY IF EXISTS "Service role system_errors" ON system_errors;
CREATE POLICY "Service role system_errors" ON system_errors FOR ALL USING (true);

-- 4. Create index for performance
CREATE INDEX IF NOT EXISTS idx_admin_logs_created_at ON admin_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_system_errors_created_at ON system_errors(created_at DESC);
