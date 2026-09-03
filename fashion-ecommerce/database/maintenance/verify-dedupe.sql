-- Verify dedupe results
SELECT 'dup_product_names' AS check_name, COUNT(*) AS dup_count FROM (
  SELECT name FROM products GROUP BY name HAVING COUNT(*) > 1
) d;

SELECT 'total_products' AS check_name, COUNT(*) AS value FROM products;

SELECT 'by_gender' AS check_name, gender, COUNT(*) FROM products GROUP BY gender ORDER BY gender;

SELECT 'dup_sizes' AS check_name, COUNT(*) AS dup_count FROM (
  SELECT product_id, size FROM product_sizes GROUP BY product_id, size HAVING COUNT(*) > 1
) d;

SELECT 'dup_images' AS check_name, COUNT(*) AS dup_count FROM (
  SELECT product_id, image_url FROM product_images GROUP BY product_id, image_url HAVING COUNT(*) > 1
) d;

SELECT 'constraints' AS check_name, conname, conrelid::regclass::text
FROM pg_constraint
WHERE conrelid IN ('categories'::regclass, 'products'::regclass, 'product_sizes'::regclass, 'product_images'::regclass)
  AND contype = 'u'
ORDER BY conrelid::regclass::text, conname;