-- MIGRATE ORDERS SCHEMA
ALTER TABLE orders ADD COLUMN IF NOT EXISTS wilaya_number TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS wilaya_name TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS notes TEXT;

-- UPDATE CREATE_ORDER RPC
CREATE OR REPLACE FUNCTION create_order(
    p_customer_id UUID,
    p_items JSONB,
    p_wilaya_name TEXT DEFAULT NULL,
    p_wilaya_number TEXT DEFAULT NULL,
    p_notes TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    v_order_id UUID;
    v_total NUMERIC := 0;
    v_item JSONB;
BEGIN
    -- Calculate total from items
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
        v_total := v_total + (v_item->>'price')::NUMERIC * (v_item->>'quantity')::NUMERIC;
    END LOOP;

    INSERT INTO orders (customer_id, total_price, items, wilaya_name, wilaya_number, notes)
    VALUES (p_customer_id, v_total, p_items, p_wilaya_name, p_wilaya_number, p_notes)
    RETURNING id INTO v_order_id;
    
    RETURN v_order_id;
END;
$$ LANGUAGE plpgsql;

-- FIX RLS FOR NOTIFICATIONS
DROP POLICY IF EXISTS "Public notifications access" ON notifications;
CREATE POLICY "Public notifications access" ON notifications FOR SELECT USING (true);
