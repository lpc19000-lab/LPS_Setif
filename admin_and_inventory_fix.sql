-- ADMIN DASHBOARD AND INVENTORY FIX
-- This script adds missing columns and fixes the stock adjustment logic.

-- 1. Add missing columns to 'orders' table for admin dashboard compatibility
ALTER TABLE orders ADD COLUMN IF NOT EXISTS amount_paid NUMERIC DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'UNPAID';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE orders ADD COLUMN IF NOT EXISTS logs JSONB DEFAULT '[]';

-- 2. Ensure system_logs table exists (required by lib/logger.ts)
CREATE TABLE IF NOT EXISTS system_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_type TEXT NOT NULL,
    entity_id TEXT,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Update adjust_stock RPC to match the application's parameters
-- It now handles both the stock update and the inventory logging atomically.
CREATE OR REPLACE FUNCTION adjust_stock(
    p_product_id UUID,
    p_amount NUMERIC,
    p_reason TEXT DEFAULT 'Adjustment',
    p_source TEXT DEFAULT 'ADMIN'
) RETURNS NUMERIC
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_new_stock NUMERIC;
BEGIN
    -- Update the product stock
    UPDATE products 
    SET stock_weight = stock_weight + p_amount,
        updated_at = NOW()
    WHERE id = p_product_id
    RETURNING stock_weight INTO v_new_stock;

    -- Insert into inventory_logs for audit trail
    INSERT INTO inventory_logs (product_id, change_type, quantity, source, reason, created_at)
    VALUES (
        p_product_id,
        CASE WHEN p_amount >= 0 THEN 'RESTOCK' ELSE 'ADJUSTMENT' END,
        ABS(p_amount),
        p_source,
        p_reason,
        NOW()
    );

    RETURN v_new_stock;
END;
$$ LANGUAGE plpgsql;

-- 4. Ensure RLS allows service_role to manage system_logs
ALTER TABLE system_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admin logs access" ON system_logs;
CREATE POLICY "Admin logs access" ON system_logs FOR ALL USING (true) WITH CHECK (true);
