-- ============================================================
-- SEED DATA WITH GENDER SUPPORT - CORRECTED IMAGE URLS
-- ============================================================

-- PRODUCTS DB
\c products_db

-- Categories
INSERT INTO categories (id, name, description, gender, image_url) VALUES
('10000000-0000-0000-0000-000000000001', 'Women''s Dresses', 'Elegant dresses for women', 'women', '/product-images/women/womens-dresses.jpg'),
('10000000-0000-0000-0000-000000000002', 'Women''s Accessories', 'Luxury accessories for women', 'women', '/product-images/women/womens-accessories.jpg'),
('10000000-0000-0000-0000-000000000003', 'Women''s Bags', 'Designer handbags for women', 'women', '/product-images/women/womens-bags.jpg'),
('10000000-0000-0000-0000-000000000004', 'Women''s Outerwear', 'Coats and jackets for women', 'women', '/product-images/women/womens-outerwear.jpg'),
('10000000-0000-0000-0000-000000000005', 'Women''s Shoes', 'Designer footwear for women', 'women', '/product-images/women/womens-shoes.jpg'),
('20000000-0000-0000-0000-000000000001', 'Men''s Suits', 'Premium suits for men', 'men', '/product-images/men/mens-suits.jpg'),
('20000000-0000-0000-0000-000000000002', 'Men''s Accessories', 'Luxury accessories for men', 'men', '/product-images/men/mens-accessories.jpg'),
('20000000-0000-0000-0000-000000000003', 'Men''s Bags', 'Designer bags for men', 'men', '/product-images/men/mens-bags.jpg'),
('20000000-0000-0000-0000-000000000004', 'Men''s Outerwear', 'Coats and jackets for men', 'men', '/product-images/men/mens-outerwear.jpg'),
('20000000-0000-0000-0000-000000000005', 'Men''s Shoes', 'Designer footwear for men', 'men', '/product-images/men/mens-shoes.jpg'),
('30000000-0000-0000-0000-000000000001', 'Accessories', 'Luxury accessories', 'unisex', '/product-images/unisex/unisex-accessories.jpg'),
('30000000-0000-0000-0000-000000000003', 'Watches', 'Luxury timepieces', 'unisex', '/product-images/unisex/watches.jpg')
ON CONFLICT (id) DO NOTHING;

-- Products
INSERT INTO products (
    id, name, slug, description, short_description, 
    sku, brand, category_id, gender,
    price, compare_price, 
    materials, care_instructions, 
    inventory_quantity, low_stock_threshold,
    is_featured, status
) VALUES
-- Women's Products
(
    gen_random_uuid(), 
    'Silk Evening Gown', 
    'silk-evening-gown',
    'Beautiful floor-length gown crafted from premium silk with delicate embroidery and a flowing silhouette. Perfect for galas, weddings, and black-tie events.', 
    'Luxurious silk evening gown', 
    'LEG-001', 
    'FASHION STORE',
    '10000000-0000-0000-0000-000000000001',
    'women',
    1899.00, 
    2299.00,
    '100% Mulberry Silk',
    'Dry clean only. Store in garment bag.',
    15,
    3,
    true,
    'published'
),
(
    gen_random_uuid(), 
    'Cashmere Coat', 
    'cashmere-coat',
    'Elegant wool and cashmere blend coat featuring a tailored fit, notch lapel, and double-breasted closure. Perfect for winter sophistication.', 
    'Warm luxury coat', 
    'COAT-001', 
    'FASHION STORE',
    '10000000-0000-0000-0000-000000000004',
    'women',
    899.00, 
    1200.00,
    '90% Wool, 10% Cashmere',
    'Professional dry clean only.',
    20,
    5,
    true,
    'published'
),
(
    gen_random_uuid(), 
    'Leather Handbag', 
    'leather-handbag',
    'Premium Italian leather tote bag with gold-tone hardware, multiple compartments, and a detachable shoulder strap. Crafted from full-grain calfskin.', 
    'Luxury leather tote', 
    'BAG-001', 
    'FASHION STORE',
    '10000000-0000-0000-0000-000000000003',
    'women',
    599.00, 
    799.00,
    'Full-grain Italian Calfskin',
    'Clean with soft, dry cloth. Avoid water.',
    25,
    5,
    true,
    'published'
),
(
    gen_random_uuid(), 
    'Diamond Necklace', 
    'diamond-necklace',
    'Stunning diamond pendant necklace featuring a 1.5 carat brilliant-cut diamond set in 18k white gold with a delicate chain.', 
    'Elegant diamond jewelry', 
    'JWL-001', 
    'FASHION STORE',
    '10000000-0000-0000-0000-000000000002',
    'women',
    2999.00, 
    3999.00,
    '18k White Gold, 1.5ct Diamond',
    'Wipe with jewelry cloth. Avoid chemicals.',
    10,
    2,
    true,
    'published'
),
(
    gen_random_uuid(), 
    'Designer Heels', 
    'designer-heels',
    'Elegant stiletto heels in premium Italian patent leather with a pointed toe, 4-inch heel, and cushioned insole for all-day comfort.', 
    'Luxury high heels', 
    'SHOES-001', 
    'FASHION STORE',
    '10000000-0000-0000-0000-000000000005',
    'women',
    499.00, 
    699.00,
    'Italian Patent Leather',
    'Wipe with soft cloth. Store in dust bag.',
    18,
    4,
    true,
    'published'
),
-- Men's Products
(
    gen_random_uuid(), 
    'Italian Wool Suit', 
    'italian-wool-suit',
    'Expertly tailored suit crafted from premium Italian wool with a modern slim fit. Perfect for business meetings, weddings, and formal occasions.', 
    'Premium Italian wool suit', 
    'SUIT-001', 
    'FASHION STORE',
    '20000000-0000-0000-0000-000000000001',
    'men',
    1299.00, 
    1599.00,
    '100% Italian Wool',
    'Dry clean only.',
    12,
    3,
    true,
    'published'
),
(
    gen_random_uuid(), 
    'Leather Jacket', 
    'leather-jacket',
    'Classic biker jacket crafted from premium lambskin leather with a tailored fit. Features a zip front, snap-down lapels, and multiple pockets.', 
    'Premium leather jacket', 
    'JKT-001', 
    'FASHION STORE',
    '20000000-0000-0000-0000-000000000004',
    'men',
    899.00, 
    1199.00,
    '100% Lambskin Leather',
    'Wipe with damp cloth. Condition periodically.',
    15,
    4,
    true,
    'published'
),
(
    gen_random_uuid(), 
    'Leather Briefcase', 
    'leather-briefcase',
    'Sophisticated leather briefcase crafted from full-grain Italian leather with brass hardware, multiple compartments, and a padded laptop sleeve.', 
    'Luxury leather briefcase', 
    'BRIEF-001', 
    'FASHION STORE',
    '20000000-0000-0000-0000-000000000003',
    'men',
    749.00, 
    999.00,
    'Full-grain Italian Leather',
    'Wipe with soft, dry cloth.',
    10,
    2,
    true,
    'published'
),
(
    gen_random_uuid(), 
    'Oxford Dress Shoes', 
    'oxford-dress-shoes',
    'Classic Oxford dress shoes crafted from premium calfskin leather with a Goodyear welt construction. Perfect for formal occasions and business wear.', 
    'Premium Oxford shoes', 
    'SHOE-001', 
    'FASHION STORE',
    '20000000-0000-0000-0000-000000000005',
    'men',
    499.00, 
    699.00,
    'Italian Calfskin Leather',
    'Polish regularly. Store with shoe trees.',
    20,
    5,
    true,
    'published'
),
(
    gen_random_uuid(), 
    'Silk Tie', 
    'silk-tie',
    'Elegant silk tie crafted from premium Italian silk with a subtle pattern. Perfect for business and formal occasions.', 
    'Luxury silk tie', 
    'TIE-001', 
    'FASHION STORE',
    '20000000-0000-0000-0000-000000000002',
    'men',
    199.00, 
    299.00,
    '100% Italian Silk',
    'Dry clean only.',
    30,
    6,
    true,
    'published'
),
(
    gen_random_uuid(), 
    'Men''s Designer Backpack', 
    'mens-designer-backpack',
    'A sleek, structured leather backpack for the modern professional. Fits laptops up to 15 inches.', 
    'Luxury leather backpack', 
    'BAG-002', 
    'FASHION STORE',
    '20000000-0000-0000-0000-000000000003',
    'men',
    699.00, 
    899.00,
    'Full-grain Italian Leather',
    'Wipe with soft cloth.',
    15,
    3,
    true,
    'published'
),
(
    gen_random_uuid(), 
    'Men''s Leather Belt', 
    'mens-leather-belt',
    'A classic leather belt with a silver buckle. Perfect for tailoring or casual wear.', 
    'Classic leather belt', 
    'BELT-001', 
    'FASHION STORE',
    '20000000-0000-0000-0000-000000000002',
    'men',
    149.00, 
    199.00,
    'Genuine Leather',
    'Wipe with soft cloth.',
    40,
    8,
    true,
    'published'
),
-- Unisex Products
(
    gen_random_uuid(), 
    'Silver Cufflinks', 
    'silver-cufflinks',
    'Elegant sterling silver cufflinks with a classic design. Perfect for formal occasions and business wear.', 
    'Sterling silver cufflinks', 
    'CUFF-001', 
    'FASHION STORE',
    '30000000-0000-0000-0000-000000000001',
    'unisex',
    299.00, 
    399.00,
    'Sterling Silver',
    'Wipe with jewelry cloth.',
    25,
    5,
    true,
    'published'
),
(
    gen_random_uuid(), 
    'Leather Wallet', 
    'leather-wallet',
    'Premium leather wallet crafted from Italian full-grain leather with multiple card slots and a coin pocket. Available in various colors.', 
    'Luxury leather wallet', 
    'WALLET-001', 
    'FASHION STORE',
    '30000000-0000-0000-0000-000000000001',
    'unisex',
    249.00, 
    349.00,
    'Italian Full-grain Leather',
    'Wipe with soft, dry cloth.',
    40,
    8,
    true,
    'published'
),
(
    gen_random_uuid(), 
    'Classic Leather Watch', 
    'classic-leather-watch',
    'A timeless timepiece with a genuine leather strap and sapphire crystal glass.', 
    'Elegant leather watch', 
    'WATCH-001', 
    'FASHION STORE',
    '30000000-0000-0000-0000-000000000003',
    'unisex',
    499.00, 
    699.00,
    'Genuine Leather, Stainless Steel',
    'Keep away from water.',
    20,
    5,
    true,
    'published'
)
ON CONFLICT (id) DO NOTHING;

-- Product Sizes
INSERT INTO product_sizes (product_id, size, gender, inventory_quantity, sku_suffix)
SELECT 
    p.id,
    size,
    p.gender,
    FLOOR(RANDOM() * 10 + 5)::int,
    suffix
FROM products p
CROSS JOIN (
    VALUES 
        ('XS', '-XS'), ('S', '-S'), ('M', '-M'), 
        ('L', '-L'), ('XL', '-XL'), ('XXL', '-XXL')
) AS sizes(size, suffix)
WHERE p.gender = 'women' OR p.gender = 'unisex'
UNION ALL
SELECT 
    p.id,
    size,
    p.gender,
    FLOOR(RANDOM() * 10 + 5)::int,
    suffix
FROM products p
CROSS JOIN (
    VALUES 
        ('S', '-S'), ('M', '-M'), ('L', '-L'), 
        ('XL', '-XL'), ('XXL', '-XXL'), ('XXXL', '-XXXL')
) AS sizes(size, suffix)
WHERE p.gender = 'men'
ON CONFLICT DO NOTHING;

-- Product Images (UPDATED TO MATCH YOUR NEW IMAGES)
-- Product Images (UPDATED TO MATCH YOUR FOLDER STRUCTURE: 'men' instead of 'mens')
INSERT INTO product_images (product_id, image_url, alt_text, is_primary, sort_order)
SELECT 
    p.id,
    CASE 
        WHEN p.gender = 'women' THEN
            CASE 
                WHEN p.name LIKE '%Gown%' THEN '/product-images/women/silk-evening-gown.jpg'
                WHEN p.name LIKE '%Coat%' THEN '/product-images/women/cashmere-coat.jpg'
                WHEN p.name LIKE '%Handbag%' THEN '/product-images/women/leather-handbag.jpg'
                WHEN p.name LIKE '%Necklace%' THEN '/product-images/women/diamond-necklace.jpg'
                WHEN p.name LIKE '%Heels%' THEN '/product-images/women/designer-heels.jpg'
                WHEN p.name LIKE '%Shoes%' THEN '/product-images/women/womens-shoes.jpg'
                WHEN p.name LIKE '%Dress%' THEN '/product-images/women/womens-dresses.jpg'
                WHEN p.name LIKE '%Bag%' THEN '/product-images/women/womens-bags.jpg'
                WHEN p.name LIKE '%Jacket%' OR p.name LIKE '%Outerwear%' THEN '/product-images/women/womens-outerwear.jpg'
                WHEN p.name LIKE '%Accessories%' OR p.name LIKE '%Scarf%' THEN '/product-images/women/womens-accessories.jpg'
                ELSE '/product-images/women/placeholder.jpg'
            END
        WHEN p.gender = 'men' THEN
            CASE 
                WHEN p.name LIKE '%Suit%' THEN '/product-images/men/italian-wool-suit.jpg'
                WHEN p.name LIKE '%Jacket%' THEN '/product-images/men/leather-jacket.jpg'
                WHEN p.name LIKE '%Briefcase%' THEN '/product-images/men/leather-briefcase.jpg'
                WHEN p.name LIKE '%Shoes%' AND p.name NOT LIKE '%Dress%' THEN '/product-images/men/oxford-dress-shoes.jpg'
                WHEN p.name LIKE '%Tie%' THEN '/product-images/men/silk-tie.jpg'
                WHEN p.name LIKE '%Bag%' OR p.name LIKE '%Backpack%' THEN '/product-images/men/mens-bags.jpg'
                WHEN p.name LIKE '%Jacket%' OR p.name LIKE '%Outerwear%' THEN '/product-images/men/mens-outerwear.jpg'
                WHEN p.name LIKE '%Accessories%' OR p.name LIKE '%Belt%' OR p.name LIKE '%Wallet%' THEN '/product-images/men/mens-accessories.jpg'
                ELSE '/product-images/men/placeholder.jpg'
            END
        ELSE
            CASE 
                WHEN p.name LIKE '%Cufflinks%' THEN '/product-images/unisex/silver-cufflinks.jpg'
                WHEN p.name LIKE '%Wallet%' THEN '/product-images/unisex/leather-wallet.jpg'
                WHEN p.name LIKE '%Watch%' THEN '/product-images/unisex/watches.jpg'
                WHEN p.name LIKE '%Accessories%' THEN '/product-images/unisex/unisex-accessories.jpg'
                ELSE '/product-images/unisex/placeholder.jpg'
            END
    END,
    p.name || ' - Main image',
    true,
    1
FROM products p
ON CONFLICT DO NOTHING;

-- AUTH DB
\c auth_db

INSERT INTO users (id, email, password_hash, first_name, last_name, role) VALUES
(
    'f3d73cfa-b59e-4a9a-a5fa-848c433e631c', 
    'admin@fashion.com', 
    '$2a$10$placeholder_hash_for_admin', 
    'Admin', 
    'User', 
    'admin'
),
(
    'e39ddf24-30a5-4ee3-86f4-8ba89a103040', 
    'customer@fashion.com', 
    '$2a$10$placeholder_hash_for_customer', 
    'John', 
    'Doe', 
    'customer'
)
ON CONFLICT (id) DO NOTHING;

-- USERS DB
\c users_db

INSERT INTO users (id, email, password_hash, first_name, last_name, role) VALUES
(
    'f3d73cfa-b59e-4a9a-a5fa-848c433e631c', 
    'admin@fashion.com', 
    '$2a$10$placeholder_hash_for_admin', 
    'Admin', 
    'User', 
    'admin'
),
(
    'e39ddf24-30a5-4ee3-86f4-8ba89a103040', 
    'customer@fashion.com', 
    '$2a$10$placeholder_hash_for_customer', 
    'John', 
    'Doe', 
    'customer'
)
ON CONFLICT (id) DO NOTHING;

\c products_db
SELECT '✅ Seed data completed successfully!' as message;
SELECT 'Categories: ' || COUNT(*) || ' records' as status FROM categories
UNION ALL
SELECT 'Products: ' || COUNT(*) || ' records' as status FROM products
UNION ALL
SELECT 'Product Images: ' || COUNT(*) || ' records' as status FROM product_images
UNION ALL
SELECT 'Product Sizes: ' || COUNT(*) || ' records' as status FROM product_sizes;