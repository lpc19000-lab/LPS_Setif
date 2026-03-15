-- Supabase Database Schema for LPS Perfume Platform

-- 1. PRODUCTS TABLE
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    brand TEXT,
    brand_id UUID,
    description TEXT,
    category_id UUID,
    image_url TEXT,
    images JSONB DEFAULT '[]',
    volumes JSONB DEFAULT '[]',
    base_price NUMERIC DEFAULT 0,
    purchase_price NUMERIC DEFAULT 0,
    stock_weight NUMERIC DEFAULT 0,
    low_stock_threshold NUMERIC DEFAULT 500,
    status TEXT DEFAULT 'ACTIVE',
    tag_ids UUID[] DEFAULT '{}',
    collection_ids UUID[] DEFAULT '{}',
    sales_units_sold NUMERIC DEFAULT 0,
    sales_revenue NUMERIC DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- LOOKUP TABLES
CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS brands (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS collections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. CUSTOMERS TABLE
CREATE TABLE IF NOT EXISTS customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT,
    phone TEXT UNIQUE NOT NULL,
    shop_name TEXT,
    wilaya TEXT,
    address TEXT,
    role TEXT DEFAULT 'TRADER',
    password_hash TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. ORDERS TABLE
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID REFERENCES customers(id),
    status TEXT DEFAULT 'PENDING',
    total_price NUMERIC DEFAULT 0,
    items JSONB DEFAULT '[]', -- Snapshot of items
    invoice JSONB,
    wilaya_number TEXT,
    wilaya_name TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. ORDER ITEMS (Normalization for analytics)
CREATE TABLE IF NOT EXISTS order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id),
    quantity NUMERIC NOT NULL,
    price NUMERIC,
    volume_data JSONB
);

-- 5. INVENTORY LOGS
CREATE TABLE IF NOT EXISTS inventory_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    change_type TEXT NOT NULL,
    quantity NUMERIC NOT NULL,
    source TEXT,
    reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. NOTIFICATIONS
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT DEFAULT 'INFO', -- 'INFO', 'WARNING', 'CRITICAL'
    is_read BOOLEAN DEFAULT FALSE,
    link TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. RPC: Atomic Stock Adjustment
CREATE OR REPLACE FUNCTION adjust_stock(p_id UUID, p_delta NUMERIC)
RETURNS VOID AS $$
BEGIN
    UPDATE products 
    SET stock_weight = stock_weight + p_delta,
        updated_at = NOW()
    WHERE id = p_id;
END;
$$ LANGUAGE plpgsql;

-- 7. RPC: Create Order Logic
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
-- 9. ENABLE ROW LEVEL SECURITY
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- 10. RLS POLICIES

-- Products: Everyone can view, only Admins can edit
CREATE POLICY "Public products access" ON products FOR SELECT USING (true);
CREATE POLICY "Admin products modification" ON products FOR ALL 
    USING (current_setting('role') = 'service_role');

-- Customers: Traders see only themselves, Admins see all
CREATE POLICY "Customer self access" ON customers FOR SELECT 
    USING (id::text = auth.uid()::text OR current_setting('role') = 'service_role');
CREATE POLICY "Customer self update" ON customers FOR UPDATE 
    USING (id::text = auth.uid()::text OR current_setting('role') = 'service_role');

-- Orders: Traders see only their own, Admins see all
CREATE POLICY "Order owner access" ON orders FOR SELECT 
    USING (customer_id::text = auth.uid()::text OR current_setting('role') = 'service_role');
CREATE POLICY "Order owner insert" ON orders FOR INSERT 
    WITH CHECK (customer_id::text = auth.uid()::text OR current_setting('role') = 'service_role');

-- Public access for notifications (Announcements)
CREATE POLICY "Public notifications access" ON notifications FOR SELECT USING (true);

-- 11. AUTOMATION TRIGGERS

-- Trigger: Sync order_items from orders JSONB
CREATE OR REPLACE FUNCTION sync_order_items() RETURNS TRIGGER AS $$
BEGIN
    -- Clear existing items on update to avoid duplicates
    IF (TG_OP = 'UPDATE') THEN
        DELETE FROM order_items WHERE order_id = NEW.id;
    END IF;

    -- Insert from JSONB items array
    INSERT INTO order_items (order_id, product_id, quantity, price, volume_data)
    SELECT 
        NEW.id,
        (item->>'productId')::UUID,
        (item->>'quantity')::NUMERIC,
        (item->>'price')::NUMERIC,
        (item->'volume')
    FROM jsonb_array_elements(NEW.items) AS item;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_order_sync_items
AFTER INSERT OR UPDATE ON orders
FOR EACH ROW EXECUTE FUNCTION sync_order_items();

-- Trigger: Auto-log inventory on product stock change
CREATE OR REPLACE FUNCTION log_stock_change() RETURNS TRIGGER AS $$
BEGIN
    IF (OLD.stock_weight IS DISTINCT FROM NEW.stock_weight) THEN
        INSERT INTO inventory_logs (product_id, change_type, quantity, source, reason)
        VALUES (
            NEW.id,
            CASE WHEN NEW.stock_weight > OLD.stock_weight THEN 'RESTOCK' ELSE 'ADJUSTMENT' END,
            NEW.stock_weight - OLD.stock_weight,
            'SYSTEM',
            'Automated stock update'
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_product_stock_change
AFTER UPDATE ON products
FOR EACH ROW EXECUTE FUNCTION log_stock_change();
