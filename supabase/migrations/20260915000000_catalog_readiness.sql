-- Launch readiness: flag the sample catalog so it can't pass for the real one, and give
-- categories an image for the home page. Apply after 20260914000000_admin_and_storefront.sql.

alter table public.products
  add column is_sample boolean not null default false;

comment on column public.products.is_sample is
  'Demo data from seed.sql. Labelled "Sample" in the store and admin, and removable in one step from /admin/products.';

-- Databases that already loaded the original seed: flag those products, clear their demo
-- ratings, and replace their unrelated stock photos and marketing copy with neutral placeholders.
update public.products
set is_sample = true,
    rating = 0,
    reviews = 0,
    brand = 'Sample Brand',
    image = '/images/product-placeholder.svg',
    gallery = '{}',
    short_description = 'Sample product — replace before launch.',
    description = 'Sample product used for testing. Replace this description with the real product details, or remove the sample catalog from the admin panel.'
where slug in (
  'apex-pro-driver', 'precision-fairway-wood', 'elite-wedge-set',
  'summit-golf-bag', 'tour-grip-gloves', 'ridge-pro-shoes'
);

-- Shown on the home page category tiles. Null shows a plain branded tile instead.
alter table public.categories
  add column image text;
