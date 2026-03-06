-- Add slug columns with temporary defaults, then generate slugs from existing names
-- Categories
ALTER TABLE categories
ADD COLUMN IF NOT EXISTS slug TEXT;
UPDATE categories
SET slug = LOWER(
        REGEXP_REPLACE(REPLACE(name, ' ', '-'), '[^a-z0-9-]', '', 'g')
    )
WHERE slug IS NULL;
ALTER TABLE categories
ALTER COLUMN slug
SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS categories_slug_key ON categories(slug);
-- Products: add slug, status, updated_at
ALTER TABLE products
ADD COLUMN IF NOT EXISTS slug TEXT;
UPDATE products
SET slug = LOWER(
        REGEXP_REPLACE(REPLACE(name, ' ', '-'), '[^a-z0-9-]', '', 'g')
    ) || '-' || SUBSTRING(id, 1, 6)
WHERE slug IS NULL;
ALTER TABLE products
ALTER COLUMN slug
SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS products_slug_key ON products(slug);
-- Product status enum and column
DO $$ BEGIN CREATE TYPE "ProductStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'DRAFT');
EXCEPTION
WHEN duplicate_object THEN null;
END $$;
ALTER TABLE products
ADD COLUMN IF NOT EXISTS status "ProductStatus" DEFAULT 'ACTIVE' NOT NULL;
ALTER TABLE products
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL;
-- Add INITIAL_STOCK to InventoryChangeType
ALTER TYPE "InventoryChangeType"
ADD VALUE IF NOT EXISTS 'INITIAL_STOCK';
-- Create indexes
CREATE INDEX IF NOT EXISTS products_slug_idx ON products(slug);
CREATE INDEX IF NOT EXISTS products_status_idx ON products(status);
-- Collections table
CREATE TABLE IF NOT EXISTS collections (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL
);
-- Tags table
CREATE TABLE IF NOT EXISTS tags (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE
);
-- Product images table
CREATE TABLE IF NOT EXISTS product_images (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    is_primary BOOLEAN DEFAULT false NOT NULL,
    position INT DEFAULT 0 NOT NULL,
    created_at TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL
);
CREATE INDEX IF NOT EXISTS product_images_product_id_idx ON product_images(product_id);
-- Product collections join table
CREATE TABLE IF NOT EXISTS product_collections (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    collection_id TEXT NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
    UNIQUE(product_id, collection_id)
);
-- Product tags join table
CREATE TABLE IF NOT EXISTS product_tags (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    tag_id TEXT NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    UNIQUE(product_id, tag_id)
);