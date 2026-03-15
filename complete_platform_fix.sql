-- 1. ADD MISSING COLUMNS
ALTER TABLE products ADD COLUMN IF NOT EXISTS purchase_price NUMERIC DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS brand_id UUID;

-- 2. CREATE LOOKUP TABLES
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

-- 3. INITIAL DATA (If missing)
INSERT INTO tags (name, slug) 
SELECT 'Featured', 'featured' WHERE NOT EXISTS (SELECT 1 FROM tags WHERE slug = 'featured');

INSERT INTO tags (name, slug) 
SELECT 'New', 'new' WHERE NOT EXISTS (SELECT 1 FROM tags WHERE slug = 'new');

-- 4. RLS FOR LOOKUP TABLES
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public categories access" ON categories;
CREATE POLICY "Public categories access" ON categories FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public brands access" ON brands;
CREATE POLICY "Public brands access" ON brands FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public collections access" ON collections;
CREATE POLICY "Public collections access" ON collections FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public tags access" ON tags;
CREATE POLICY "Public tags access" ON tags FOR SELECT USING (true);

-- 5. RE-CREATE ORDER RPC (Corrected Version)
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
