-- ============================================================
-- VERIFICATION
-- ============================================================

\c products_db

SELECT '📊 Products DB' as database;
SELECT 'Categories: ' || COUNT(*) || ' records' as status FROM categories
UNION ALL
SELECT 'Products: ' || COUNT(*) || ' records' as status FROM products
UNION ALL
SELECT 'Product Images: ' || COUNT(*) || ' records' as status FROM product_images;

\c auth_db

SELECT '📊 Auth DB' as database;
SELECT 'Users: ' || COUNT(*) || ' records' as status FROM users;

\c users_db

SELECT '📊 Users DB' as database;
SELECT 'Users: ' || COUNT(*) || ' records' as status FROM users;

\c orders_db

SELECT '📊 Orders DB' as database;
SELECT 'Tables created' as status;