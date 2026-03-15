-- FIX ORDER CREATION PERMISSIONS AND STRUCTURE
-- 1. Redefine create_order with SECURITY DEFINER and correct search path
-- This allows the function to bypass RLS for its internal inserts (like order_items via trigger)
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
        v_total := v_total + (v_item->>'price')::NUMERIC * (v_item->>'quantity')::NUMERIC;
    END LOOP;

    -- Insert into orders (The trigger on_order_sync_items will handle order_items)
    INSERT INTO orders (customer_id, total_price, items, wilaya_name, wilaya_number, notes)
    VALUES (p_customer_id, v_total, p_items, p_wilaya_name, p_wilaya_number, p_notes)
    RETURNING id INTO v_order_id;
    
    RETURN v_order_id;
END;
$$ LANGUAGE plpgsql;

-- 2. Ensure order_items table has appropriate RLS for authenticated service role (used by trigger)
-- Since the function is SECURITY DEFINER, it runs as the owner (usually postgres/service_role),
-- so it should bypass standard RLS, but we ensure it's correct.
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admin order_items access" ON order_items;
CREATE POLICY "Admin order_items access" ON order_items FOR ALL USING (true) WITH CHECK (true);
