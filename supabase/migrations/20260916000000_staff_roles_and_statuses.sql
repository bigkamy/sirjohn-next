-- Staff roles and extra order statuses. Postgres can't use a new enum value in the transaction
-- that adds it, so these live in their own migration, before 20260916000100_admin_platform.sql.

alter type public.user_role add value if not exists 'super_admin';
alter type public.user_role add value if not exists 'manager';
alter type public.user_role add value if not exists 'staff';

alter type public.order_status add value if not exists 'confirmed' after 'pending';
alter type public.order_status add value if not exists 'refunded';
