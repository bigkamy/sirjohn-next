-- Removes the demo catalog from seed.sql, now that the real products are in.
-- This is exactly what "Remove samples" on /admin/products does
-- (removeSampleProducts in lib/admin-product-actions.ts), kept as a migration so the
-- database ends up in the same state wherever these migrations are applied.
--
-- The samples were the only products still using /images/product-placeholder.svg, so this
-- also clears the placeholder tiles from the shop grid.
--
-- What follows the rows: wishlist entries, cart lines and reviews for these products are
-- removed with them (on delete cascade), while order_items keep their own copy of the item
-- name, price and options, so past orders and their totals are untouched
-- (products.id there is on delete set null).
--
-- If you re-run seed.sql later, the demo products come back and this has to be run again.

delete from public.products where is_sample;
