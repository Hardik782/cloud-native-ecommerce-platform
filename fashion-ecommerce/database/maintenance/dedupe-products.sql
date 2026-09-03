-- ============================================================
-- DEDUPE PRODUCTS + SIZES + IMAGES (safe to re-run)
--
-- Fixes databases whose seed data was applied more than once:
--   * keeps the earliest product row for each product name
--   * removes duplicated size/image rows within kept products
--   * adds UNIQUE constraints so duplicates cannot recur
--   * FK product_sizes / product_images cascade on product delete
--
-- Usage (against the products service database):
--   psql -U postgres -d products_db -v ON_ERROR_STOP=1 -f dedupe-products.sql
-- ============================================================
BEGIN;

-- 1. Remove duplicate products: keep the earliest row per name.
--    Cascade removes that row's own sizes and images first.
DELETE FROM products p
USING (
    SELECT id,
           ROW_NUMBER() OVER (PARTITION BY name ORDER BY created_at, id) AS rn
    FROM products
) d
WHERE p.id = d.id AND d.rn > 1;

-- 2. Remove duplicate size rows within each remaining product.
DELETE FROM product_sizes s
USING (
    SELECT id,
           ROW_NUMBER() OVER (PARTITION BY product_id, size ORDER BY id) AS rn
    FROM product_sizes
) d
WHERE s.id = d.id AND d.rn > 1;

-- 3. Remove duplicate image rows within each remaining product.
DELETE FROM product_images i
USING (
    SELECT id,
           ROW_NUMBER() OVER (PARTITION BY product_id, image_url ORDER BY id) AS rn
    FROM product_images
) d
WHERE i.id = d.id AND d.rn > 1;

-- 4. Enforce uniqueness going forward (idempotent constraint creation).

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'uq_categories_name') THEN
        ALTER TABLE categories ADD CONSTRAINT uq_categories_name UNIQUE (name);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'uq_products_name') THEN
        ALTER TABLE products ADD CONSTRAINT uq_products_name UNIQUE (name);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'uq_products_slug') THEN
        ALTER TABLE products ADD CONSTRAINT uq_products_slug UNIQUE (slug);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'uq_products_sku') THEN
        ALTER TABLE products ADD CONSTRAINT uq_products_sku UNIQUE (sku);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'uq_product_sizes_product_size') THEN
        ALTER TABLE product_sizes ADD CONSTRAINT uq_product_sizes_product_size UNIQUE (product_id, size);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'uq_product_images_product_url') THEN
        ALTER TABLE product_images ADD CONSTRAINT uq_product_images_product_url UNIQUE (product_id, image_url);
    END IF;
END $$;

COMMIT;