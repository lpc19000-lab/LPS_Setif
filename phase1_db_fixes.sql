-- 1. Recreate the public.adjust_stock function
CREATE OR REPLACE FUNCTION public.adjust_stock(
    p_amount numeric,
    p_product_id uuid,
    p_reason text,
    p_source text DEFAULT 'MANUAL_ADJUSTMENT'
)
RETURNS void AS $$
DECLARE
    v_current_stock numeric;
    v_new_stock numeric;
BEGIN
    -- Get current stock
    SELECT stock INTO v_current_stock
    FROM public.products
    WHERE id = p_product_id
    FOR UPDATE;

    IF v_current_stock IS NULL THEN
        RAISE EXCEPTION 'Product not found';
    END IF;

    -- Calculate new stock
    v_new_stock := v_current_stock + p_amount;

    -- Negative stock check (optional, but good practice depending on business rules)
    IF v_new_stock < 0 THEN
        RAISE EXCEPTION 'Stock cannot be negative';
    END IF;

    -- Update product stock
    UPDATE public.products
    SET stock = v_new_stock
    WHERE id = p_product_id;

    -- Log the inventory history
    INSERT INTO public.inventory_history (
        product_id,
        "type",
        change_amount,
        resulting_stock,
        source,
        reason
    ) VALUES (
        p_product_id,
        CASE WHEN p_amount >= 0 THEN 'RESTOCK' ELSE 'MANUAL_ADJUSTMENT' END,
        p_amount,
        v_new_stock,
        p_source,
        p_reason
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Update Admin Email in auth.users
-- This updates the main admin account's email and metadata to the new one requested.
UPDATE auth.users 
SET email = 'eddinissam@gmail.com', raw_user_meta_data = jsonb_set(raw_user_meta_data, '{email}', '"eddinissam@gmail.com"')
WHERE email = 'admin@gmail.com';
