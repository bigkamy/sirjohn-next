-- SAMPLE DATA for development and testing only — not the live catalog.
--
-- These products are flagged is_sample: the store labels them "Sample", the admin dashboard
-- lists them on its launch checklist, and /admin/products can remove them all in one step.
-- They use a neutral placeholder image, no ratings, and placeholder descriptions.
-- Safe to re-run: existing rows are left untouched.

insert into public.categories (name, slug, sort_order) values
  ('Clubs', 'clubs', 1),
  ('Bags', 'bags', 2),
  ('Apparel', 'apparel', 3),
  ('Accessories', 'accessories', 4),
  ('Footwear', 'footwear', 5),
  ('Balls', 'balls', 6)
on conflict (name) do nothing;

insert into public.products
  (name, slug, brand, category, price, original_price, badge, description, short_description, image, gallery, stock, options, is_sample)
values
  ('Apex Pro Driver', 'apex-pro-driver', 'Sample Brand', 'Clubs', 32999, 39999, 'New',
    'Sample product used for testing. Replace this description with the real product details, or remove the sample catalog from the admin panel.',
    'Sample product — replace before launch.', '/images/product-placeholder.svg', '{}', 12,
    '[{"name": "Hand Orientation", "values": ["Right Hand", "Left Hand"]}, {"name": "Shaft Flex", "values": ["Regular", "Stiff", "Extra Stiff", "Senior"]}]',
    true),
  ('Precision Fairway Wood', 'precision-fairway-wood', 'Sample Brand', 'Clubs', 24999, 28999, 'Featured',
    'Sample product used for testing. Replace this description with the real product details, or remove the sample catalog from the admin panel.',
    'Sample product — replace before launch.', '/images/product-placeholder.svg', '{}', 8,
    '[{"name": "Hand Orientation", "values": ["Right Hand", "Left Hand"]}, {"name": "Shaft Flex", "values": ["Regular", "Stiff", "Extra Stiff", "Senior"]}]',
    true),
  ('Elite Wedge Set', 'elite-wedge-set', 'Sample Brand', 'Accessories', 18999, 22999, 'Sale',
    'Sample product used for testing. Replace this description with the real product details, or remove the sample catalog from the admin panel.',
    'Sample product — replace before launch.', '/images/product-placeholder.svg', '{}', 14,
    '[{"name": "Hand Orientation", "values": ["Right Hand", "Left Hand"]}, {"name": "Shaft Flex", "values": ["Regular", "Stiff", "Extra Stiff", "Senior"]}]',
    true),
  ('Summit Golf Bag', 'summit-golf-bag', 'Sample Brand', 'Bags', 16999, 19999, null,
    'Sample product used for testing. Replace this description with the real product details, or remove the sample catalog from the admin panel.',
    'Sample product — replace before launch.', '/images/product-placeholder.svg', '{}', 22,
    '[]', true),
  ('Tour Grip Gloves', 'tour-grip-gloves', 'Sample Brand', 'Accessories', 1299, 1999, null,
    'Sample product used for testing. Replace this description with the real product details, or remove the sample catalog from the admin panel.',
    'Sample product — replace before launch.', '/images/product-placeholder.svg', '{}', 43,
    '[{"name": "Hand Orientation", "values": ["Right Hand", "Left Hand"]}]', true),
  ('Ridge Pro Shoes', 'ridge-pro-shoes', 'Sample Brand', 'Footwear', 7499, 9999, null,
    'Sample product used for testing. Replace this description with the real product details, or remove the sample catalog from the admin panel.',
    'Sample product — replace before launch.', '/images/product-placeholder.svg', '{}', 16,
    '[]', true)
on conflict (slug) do nothing;

-- Sample coupon for testing checkout: 10% off orders of ₹5,000 or more, capped at ₹5,000.
-- Edit or deactivate it (is_active = false) before launch.
insert into public.coupons (code, description, discount_type, value, min_subtotal, max_discount)
values ('WELCOME10', 'Sample coupon for testing — review before launch', 'percent', 10, 5000, 5000)
on conflict (code) do nothing;
