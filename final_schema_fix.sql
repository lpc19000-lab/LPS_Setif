-- FINAL DATABASE SCHEMA AND PERMISSION FIX
-- This script ensures all required columns exist and permissions are correctly set for order placement.

-- 1. Ensure columns exist on 'orders' table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS wilaya_number TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS wilaya_name TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS notes TEXT;

-- 2. Ensure columns exist on 'customers' table (for better pre-fill consistency)
ALTER TABLE customers ADD COLUMN IF NOT EXISTS wilaya_number TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS wilaya_name TEXT;

-- 3. Redefine 'create_order' function with SECURITY DEFINER
-- This bypasses RLS for internal inserts, solving permission issues.
CREATE OR REPLACE FUNCTION create_order(
    p_customer_id UUID,
    p_items JSONB,
    p_wilaya_name TEXT DEFAULT NULL,
    p_wilaya_number TEXT DEFAULT NULL,
    p_notes TEXT DEFAULT NULL
) RETURNS UUID 
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_order_id UUID;
    v_total NUMERIC := 0;
    v_item JSONB;
BEGIN
    -- Calculate total from items
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
        -- Safe numeric casting
        v_total := v_total + (COALESCE(v_item->>'price', '0'))::NUMERIC * (COALESCE(v_item->>'quantity', '0'))::NUMERIC;
    END LOOP;

    -- Insert into orders table
    INSERT INTO orders (customer_id, total_price, items, wilaya_name, wilaya_number, notes, status, created_at)
    VALUES (p_customer_id, v_total, p_items, p_wilaya_name, p_wilaya_number, p_notes, 'PENDING', NOW())
    RETURNING id INTO v_order_id;
    
    RETURN v_order_id;
END;
$$ LANGUAGE plpgsql;

-- 4. Ensure order_items table is accessible to the trigger/service role
-- This is critical for the 'on_order_sync_items' trigger to work.
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admin order_items access" ON order_items;
CREATE POLICY "Admin order_items access" ON order_items FOR ALL USING (true) WITH CHECK (true);

-- 5. Fix Public Notifications (Announcements) RLS
DROP POLICY IF EXISTS "Public notifications access" ON notifications;
CREATE POLICY "Public notifications access" ON notifications FOR SELECT USING (true);
