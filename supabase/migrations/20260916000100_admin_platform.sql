-- Admin platform: role-based permissions, staff activity log, product reviews, SKU and
-- low-stock fields, customer/staff/analytics/health functions, and the media bucket.
-- Apply after 20260916000000_staff_roles_and_statuses.sql.

-- ---------------------------------------------------------------------------
-- Roles and permissions
--
--   super_admin  everything, including creating admins
--   admin        everything except creating or changing admins and super admins
--   manager      catalog, inventory, orders, customers, coupons, reviews, analytics,
--                payments, and staff-level team members
--   staff        dashboard (no revenue), orders, inventory; view-only catalog and customers
--
-- The database is the authority: every policy and admin function checks has_permission().
-- The app reads the same list through my_permissions() to decide what to show.
-- ---------------------------------------------------------------------------

-- Before this migration "admin" was the top role, so existing admins keep full control.
update public.profiles set role = 'super_admin' where role = 'admin';

create or replace function public.role_permissions(p_role public.user_role)
returns text[]
language sql
immutable
set search_path = ''
as $$
  select case p_role
    when 'super_admin' then array[
      'dashboard.view', 'revenue.view', 'catalog.view', 'catalog.manage', 'inventory.manage',
      'orders.view', 'orders.manage', 'orders.cancel', 'customers.view', 'coupons.manage',
      'reviews.manage', 'analytics.view', 'payments.view', 'staff.manage', 'settings.manage',
      'security.view'
    ]
    when 'admin' then array[
      'dashboard.view', 'revenue.view', 'catalog.view', 'catalog.manage', 'inventory.manage',
      'orders.view', 'orders.manage', 'orders.cancel', 'customers.view', 'coupons.manage',
      'reviews.manage', 'analytics.view', 'payments.view', 'staff.manage', 'settings.manage',
      'security.view'
    ]
    when 'manager' then array[
      'dashboard.view', 'revenue.view', 'catalog.view', 'catalog.manage', 'inventory.manage',
      'orders.view', 'orders.manage', 'orders.cancel', 'customers.view', 'coupons.manage',
      'reviews.manage', 'analytics.view', 'payments.view', 'staff.manage'
    ]
    when 'staff' then array[
      'dashboard.view', 'catalog.view', 'inventory.manage', 'orders.view', 'orders.manage',
      'customers.view'
    ]
    else array[]::text[]
  end;
$$;

-- Which roles someone may hand out, and to whom: a target's current role and the new role must
-- both be in the actor's list. Nobody can change their own role (see admin_set_user_role).
create or replace function public.assignable_roles(p_role public.user_role)
returns public.user_role[]
language sql
immutable
set search_path = ''
as $$
  select case p_role
    when 'super_admin' then '{customer,staff,manager,admin,super_admin}'::public.user_role[]
    when 'admin' then '{customer,staff,manager}'::public.user_role[]
    when 'manager' then '{customer,staff}'::public.user_role[]
    else '{}'::public.user_role[]
  end;
$$;

-- Security definer so policies can call these without recursing through the profiles policies.
create or replace function public.my_role()
returns public.user_role
language sql
stable
security definer
set search_path = ''
as $$
  select role from public.profiles where id = (select auth.uid());
$$;

create or replace function public.has_permission(p_permission text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(p_permission = any (public.role_permissions(public.my_role())), false);
$$;

create or replace function public.is_staff()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(public.my_role() in ('super_admin', 'admin', 'manager', 'staff'), false);
$$;

-- Still used by the newsletter and contact-message policies: the two top roles.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(public.my_role() in ('super_admin', 'admin'), false);
$$;

create or replace function public.my_permissions()
returns text[]
language sql
stable
security definer
set search_path = ''
as $$
  select public.role_permissions(coalesce(public.my_role(), 'customer'));
$$;

revoke execute on function public.my_permissions() from public, anon;
grant execute on function public.my_permissions() to authenticated;

-- Staff can see every profile (customer list, order customers); customers still only their own.
drop policy "Users can view their own profile" on public.profiles;
create policy "Users view their own profile; staff view all"
  on public.profiles for select
  to authenticated
  using ((select auth.uid()) = id or (select public.has_permission('customers.view')));

-- ---------------------------------------------------------------------------
-- Staff activity log. Written by triggers and security-definer functions only.
-- ---------------------------------------------------------------------------

create table public.staff_activity (
  id bigint generated always as identity primary key,
  -- Null for changes made by the system (e.g. a payment webhook) or directly in SQL.
  actor_id uuid references auth.users (id) on delete set null,
  actor_role public.user_role,
  action text not null,
  entity_type text not null,
  entity_id text,
  summary text not null,
  level text not null default 'info' check (level in ('info', 'error')),
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index staff_activity_created_at_idx on public.staff_activity (created_at desc);
create index staff_activity_actor_idx on public.staff_activity (actor_id, created_at desc);
create index staff_activity_entity_idx on public.staff_activity (entity_type, entity_id, created_at desc);

alter table public.staff_activity enable row level security;

create policy "Activity is visible to security and team managers"
  on public.staff_activity for select
  to authenticated
  using (
    (select public.has_permission('security.view'))
    or (select public.has_permission('staff.manage'))
    or (entity_type = 'order' and (select public.has_permission('orders.view')))
  );

-- Lets the app record events the database can't see, such as media uploads or failed actions.
create or replace function public.log_staff_activity(
  p_action text,
  p_entity_type text,
  p_entity_id text,
  p_summary text,
  p_details jsonb default '{}'::jsonb,
  p_level text default 'info'
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not (select public.is_staff()) then
    raise exception 'not_authorized';
  end if;

  insert into public.staff_activity (actor_id, actor_role, action, entity_type, entity_id, summary, details, level)
  values (
    auth.uid(),
    public.my_role(),
    left(p_action, 60),
    left(p_entity_type, 40),
    left(p_entity_id, 120),
    left(p_summary, 300),
    coalesce(p_details, '{}'::jsonb),
    case when p_level = 'error' then 'error' else 'info' end
  );
end;
$$;

revoke execute on function public.log_staff_activity(text, text, text, text, jsonb, text) from public, anon;
grant execute on function public.log_staff_activity(text, text, text, text, jsonb, text) to authenticated;

-- Products: creations, edits, deletions, and stock changes made by staff. Checkout's stock
-- decrements (customers) and rating refreshes are not staff activity.
create or replace function public.log_product_activity()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_role public.user_role := public.my_role();
  v_changed text[];
begin
  if v_role is null or v_role = 'customer' then
    return null;
  end if;

  if tg_op = 'INSERT' then
    insert into public.staff_activity (actor_id, actor_role, action, entity_type, entity_id, summary)
    values (auth.uid(), v_role, 'product.created', 'product', new.id::text, format('Added product "%s"', new.name));
  elsif tg_op = 'DELETE' then
    insert into public.staff_activity (actor_id, actor_role, action, entity_type, entity_id, summary)
    values (auth.uid(), v_role, 'product.deleted', 'product', old.id::text, format('Deleted product "%s"', old.name));
  else
    if new.stock is distinct from old.stock then
      insert into public.staff_activity (actor_id, actor_role, action, entity_type, entity_id, summary, details)
      values (
        auth.uid(), v_role, 'inventory.adjusted', 'product', new.id::text,
        format('Stock for "%s": %s → %s', new.name, old.stock, new.stock),
        jsonb_build_object('from', old.stock, 'to', new.stock)
      );
    end if;

    select array_agg(n.key order by n.key) into v_changed
    from jsonb_each(to_jsonb(new)) n
    where n.key not in ('stock', 'stock_status', 'updated_at', 'rating', 'reviews')
      and n.value is distinct from (to_jsonb(old) -> n.key);

    if v_changed is not null then
      insert into public.staff_activity (actor_id, actor_role, action, entity_type, entity_id, summary, details)
      values (
        auth.uid(), v_role, 'product.updated', 'product', new.id::text,
        format('Updated product "%s"', new.name),
        jsonb_build_object('fields', to_jsonb(v_changed))
      );
    end if;
  end if;
  return null;
end;
$$;

create trigger products_log_activity
  after insert or update or delete on public.products
  for each row execute function public.log_product_activity();

-- Categories, coupons and shipping methods. tg_argv: entity name, label column.
-- Counters maintained by checkout (coupons.used_count) are not staff edits.
create or replace function public.log_record_activity()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_role public.user_role := public.my_role();
  v_entity text := tg_argv[0];
  v_row jsonb := to_jsonb(case when tg_op = 'DELETE' then old else new end);
  v_verb text;
begin
  if v_role is null or v_role = 'customer' then
    return null;
  end if;
  if tg_op = 'UPDATE' and (to_jsonb(new) - 'updated_at' - 'used_count') = (to_jsonb(old) - 'updated_at' - 'used_count') then
    return null;
  end if;

  v_verb := case tg_op when 'INSERT' then 'created' when 'UPDATE' then 'updated' else 'deleted' end;
  insert into public.staff_activity (actor_id, actor_role, action, entity_type, entity_id, summary)
  values (
    auth.uid(), v_role, v_entity || '.' || v_verb, v_entity,
    coalesce(v_row ->> 'id', v_row ->> 'code'),
    format('%s %s "%s"', initcap(case v_verb when 'created' then 'added' else v_verb end), replace(v_entity, '_', ' '), v_row ->> tg_argv[1])
  );
  return null;
end;
$$;

create trigger categories_log_activity
  after insert or update or delete on public.categories
  for each row execute function public.log_record_activity('category', 'name');

create trigger coupons_log_activity
  after insert or update or delete on public.coupons
  for each row execute function public.log_record_activity('coupon', 'code');

create trigger shipping_methods_log_activity
  after insert or update or delete on public.shipping_methods
  for each row execute function public.log_record_activity('shipping_method', 'name');

-- Orders: every status or payment change, whoever made it (staff, or the system for payments).
create or replace function public.log_order_activity()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.status is distinct from old.status or new.payment_status is distinct from old.payment_status then
    insert into public.staff_activity (actor_id, actor_role, action, entity_type, entity_id, summary, details)
    values (
      auth.uid(),
      public.my_role(),
      case when new.status is distinct from old.status then 'order.status_changed' else 'order.payment_changed' end,
      'order',
      new.order_number,
      case
        when new.status is distinct from old.status then format('Order #%s: %s → %s', new.order_number, old.status, new.status)
        else format('Order #%s payment: %s → %s', new.order_number, old.payment_status, new.payment_status)
      end,
      jsonb_build_object(
        'from_status', old.status, 'to_status', new.status,
        'from_payment', old.payment_status, 'to_payment', new.payment_status
      )
    );
  end if;
  return null;
end;
$$;

create trigger orders_log_activity
  after update on public.orders
  for each row execute function public.log_order_activity();

create or replace function public.log_role_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.role is distinct from old.role then
    insert into public.staff_activity (actor_id, actor_role, action, entity_type, entity_id, summary, details)
    values (
      auth.uid(),
      public.my_role(),
      'staff.role_changed',
      'user',
      new.id::text,
      format('%s: %s → %s', coalesce((select email from auth.users where id = new.id), new.id::text), old.role, new.role),
      jsonb_build_object('from', old.role, 'to', new.role)
    );
  end if;
  return null;
end;
$$;

create trigger profiles_log_role_change
  after update of role on public.profiles
  for each row execute function public.log_role_change();

-- ---------------------------------------------------------------------------
-- Catalog: SKU, low-stock threshold, and permission-based policies
-- ---------------------------------------------------------------------------

alter table public.products
  add column sku text,
  add column low_stock_threshold integer not null default 5;

alter table public.products
  add constraint products_sku_format check (sku is null or sku ~ '^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$'),
  add constraint products_low_stock_threshold_range check (low_stock_threshold between 0 and 100000);

-- SKUs are unique regardless of letter case.
create unique index products_sku_key on public.products (upper(sku)) where sku is not null;

-- Stock state as a column, so lists can filter on it (the API can't compare two columns).
alter table public.products
  add column stock_status text generated always as (
    case
      when stock <= 0 then 'out_of_stock'
      when stock <= low_stock_threshold then 'low_stock'
      else 'in_stock'
    end
  ) stored;

create index products_stock_status_idx on public.products (stock_status);

drop policy "Active products are public" on public.products;
create policy "Active products are public; staff see all"
  on public.products for select
  to anon, authenticated
  using (is_active or (select public.has_permission('catalog.view')));

drop policy "Admins can insert products" on public.products;
create policy "Catalog managers can insert products"
  on public.products for insert
  to authenticated
  with check ((select public.has_permission('catalog.manage')));

drop policy "Admins can update products" on public.products;
create policy "Catalog managers can update products"
  on public.products for update
  to authenticated
  using ((select public.has_permission('catalog.manage')))
  with check ((select public.has_permission('catalog.manage')));

drop policy "Admins can delete products" on public.products;
create policy "Catalog managers can delete products"
  on public.products for delete
  to authenticated
  using ((select public.has_permission('catalog.manage')));

drop policy "Admins can insert categories" on public.categories;
create policy "Catalog managers can insert categories"
  on public.categories for insert
  to authenticated
  with check ((select public.has_permission('catalog.manage')));

drop policy "Admins can update categories" on public.categories;
create policy "Catalog managers can update categories"
  on public.categories for update
  to authenticated
  using ((select public.has_permission('catalog.manage')))
  with check ((select public.has_permission('catalog.manage')));

drop policy "Admins can delete categories" on public.categories;
create policy "Catalog managers can delete categories"
  on public.categories for delete
  to authenticated
  using ((select public.has_permission('catalog.manage')));

-- Stock moves relative to the live value, so an edit never overwrites a sale made meanwhile.
-- Security definer: staff may change stock without being able to edit the rest of a product.
create or replace function public.adjust_product_stock(p_product_id bigint, p_delta integer)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_stock integer;
begin
  if not (select public.has_permission('inventory.manage')) then
    raise exception 'not_authorized';
  end if;

  update public.products set stock = stock + p_delta where id = p_product_id returning stock into v_stock;
  if not found then
    raise exception 'product_not_found';
  end if;
  return v_stock;
exception
  when check_violation then
    raise exception 'stock_below_zero';
end;
$$;

revoke execute on function public.adjust_product_stock(bigint, integer) from public, anon;
grant execute on function public.adjust_product_stock(bigint, integer) to authenticated;

create or replace function public.set_low_stock_threshold(p_product_id bigint, p_threshold integer)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not (select public.has_permission('inventory.manage')) then
    raise exception 'not_authorized';
  end if;

  update public.products set low_stock_threshold = p_threshold where id = p_product_id;
  if not found then
    raise exception 'product_not_found';
  end if;
exception
  when check_violation or not_null_violation then
    raise exception 'invalid_threshold';
end;
$$;

revoke execute on function public.set_low_stock_threshold(bigint, integer) from public, anon;
grant execute on function public.set_low_stock_threshold(bigint, integer) to authenticated;

-- ---------------------------------------------------------------------------
-- Shipping, coupons, payments
-- ---------------------------------------------------------------------------

drop policy "Active shipping methods are public" on public.shipping_methods;
create policy "Active shipping methods are public; settings managers see all"
  on public.shipping_methods for select
  to anon, authenticated
  using (is_active or (select public.has_permission('settings.manage')));

drop policy "Admins can insert shipping methods" on public.shipping_methods;
create policy "Settings managers can insert shipping methods"
  on public.shipping_methods for insert
  to authenticated
  with check ((select public.has_permission('settings.manage')));

drop policy "Admins can update shipping methods" on public.shipping_methods;
create policy "Settings managers can update shipping methods"
  on public.shipping_methods for update
  to authenticated
  using ((select public.has_permission('settings.manage')))
  with check ((select public.has_permission('settings.manage')));

drop policy "Admins manage coupons" on public.coupons;
create policy "Coupon managers manage coupons"
  on public.coupons for all
  to authenticated
  using ((select public.has_permission('coupons.manage')))
  with check ((select public.has_permission('coupons.manage')));

drop policy "Admins can view payments" on public.payments;
create policy "Payment viewers can view payments"
  on public.payments for select
  to authenticated
  using ((select public.has_permission('payments.view')));

-- ---------------------------------------------------------------------------
-- Orders
-- ---------------------------------------------------------------------------

drop policy "Users can view their own orders" on public.orders;
create policy "Customers view their own orders; staff view all"
  on public.orders for select
  to authenticated
  using ((select auth.uid()) = user_id or (select public.has_permission('orders.view')));

-- No direct updates at all: staff change orders only through admin_set_order_status.
drop policy "Admins can update orders" on public.orders;

drop policy "Users can view their own order items" on public.order_items;
create policy "Customers view their own order items; staff view all"
  on public.order_items for select
  to authenticated
  using (
    exists (
      select 1 from public.orders
      where orders.id = order_items.order_id
        and (orders.user_id = (select auth.uid()) or (select public.has_permission('orders.view')))
    )
  );

-- Lifecycle: pending → confirmed → processing → shipped → delivered.
--   cancelled  from pending/confirmed/processing, unpaid orders only; returns stock and the coupon use
--   refunded   from confirmed onwards, paid orders only; returns stock when p_restock
-- Cancelled and refunded orders are final. Cancelling and refunding need orders.cancel.
drop function public.admin_set_order_status(text, public.order_status);

create function public.admin_set_order_status(
  p_order_number text,
  p_status public.order_status,
  p_restock boolean default true
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order public.orders;
  v_allowed public.order_status[];
begin
  if not (select public.has_permission('orders.manage')) then
    raise exception 'not_authorized';
  end if;
  if p_status in ('cancelled', 'refunded') and not (select public.has_permission('orders.cancel')) then
    raise exception 'not_authorized';
  end if;

  select * into v_order from public.orders where order_number = p_order_number for update;
  if not found then
    raise exception 'order_not_found';
  end if;
  if v_order.status = p_status then
    return;
  end if;
  if v_order.status in ('cancelled', 'refunded') then
    raise exception 'order_closed';
  end if;

  v_allowed := case v_order.status
    when 'pending' then '{confirmed,processing,shipped,cancelled}'::public.order_status[]
    when 'confirmed' then '{processing,shipped,cancelled,refunded}'::public.order_status[]
    when 'processing' then '{shipped,cancelled,refunded}'::public.order_status[]
    when 'shipped' then '{delivered,refunded}'::public.order_status[]
    when 'delivered' then '{refunded}'::public.order_status[]
    else '{}'::public.order_status[]
  end;
  if not (p_status = any (v_allowed)) then
    raise exception 'invalid_transition';
  end if;
  if p_status = 'cancelled' and v_order.payment_status = 'paid' then
    raise exception 'order_paid';
  end if;
  if p_status = 'refunded' and v_order.payment_status <> 'paid' then
    raise exception 'order_not_paid';
  end if;

  if p_status = 'cancelled' or (p_status = 'refunded' and p_restock) then
    update public.products p
    set stock = p.stock + i.quantity
    from (
      select product_id, sum(quantity) as quantity
      from public.order_items
      where order_id = v_order.id and product_id is not null
      group by product_id
    ) i
    where p.id = i.product_id;
  end if;

  if p_status = 'cancelled' and v_order.coupon_code is not null then
    update public.coupons set used_count = greatest(used_count - 1, 0) where code = v_order.coupon_code;
  end if;

  update public.orders
  set status = p_status,
      payment_status = case when p_status = 'refunded' then 'refunded'::public.payment_status else payment_status end
  where id = v_order.id;
end;
$$;

revoke execute on function public.admin_set_order_status(text, public.order_status, boolean) from public, anon;
grant execute on function public.admin_set_order_status(text, public.order_status, boolean) to authenticated;

-- ---------------------------------------------------------------------------
-- Dashboard figures. Revenue is only returned to roles with revenue.view.
-- "Total orders" excludes cancelled orders; order value also excludes refunded ones;
-- paid revenue only counts orders a payment provider has confirmed.
-- ---------------------------------------------------------------------------

drop function public.admin_dashboard_stats(integer);

create function public.admin_dashboard_stats()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_revenue boolean := (select public.has_permission('revenue.view'));
begin
  if not (select public.has_permission('dashboard.view')) then
    raise exception 'not_authorized';
  end if;

  return jsonb_build_object(
    'order_count', (select count(*) from public.orders where status <> 'cancelled'),
    'orders_last_30_days', (
      select count(*) from public.orders
      where status <> 'cancelled' and created_at >= now() - interval '30 days'
    ),
    'order_value', case when v_revenue then (
      select coalesce(sum(total), 0) from public.orders where status not in ('cancelled', 'refunded')
    ) end,
    'paid_revenue', case when v_revenue then (
      select coalesce(sum(total), 0) from public.orders where status <> 'cancelled' and payment_status = 'paid'
    ) end,
    'customer_count', (select count(*) from public.profiles where role = 'customer'),
    'new_customers_last_30_days', (
      select count(*) from public.profiles
      where role = 'customer' and created_at >= now() - interval '30 days'
    ),
    'product_count', (select count(*) from public.products),
    'active_product_count', (select count(*) from public.products where is_active),
    'low_stock_count', (select count(*) from public.products where is_active and stock > 0 and stock <= low_stock_threshold),
    'out_of_stock_count', (select count(*) from public.products where is_active and stock = 0),
    'pending_orders', (select count(*) from public.orders where status = 'pending'),
    'confirmed_orders', (select count(*) from public.orders where status = 'confirmed'),
    'processing_orders', (select count(*) from public.orders where status = 'processing'),
    'pending_reviews', (select count(*) from public.product_reviews where status = 'pending')
  );
end;
$$;

revoke execute on function public.admin_dashboard_stats() from public, anon;
grant execute on function public.admin_dashboard_stats() to authenticated;

-- ---------------------------------------------------------------------------
-- Product reviews: verified buyers only, published after moderation.
-- ---------------------------------------------------------------------------

create type public.review_status as enum ('pending', 'approved', 'rejected');

create table public.product_reviews (
  id bigint generated always as identity primary key,
  product_id bigint not null references public.products (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  -- The delivered order that made this a verified purchase.
  order_id uuid references public.orders (id) on delete set null,
  rating smallint not null check (rating between 1 and 5),
  title text not null default '' check (char_length(title) <= 120),
  body text not null check (char_length(body) between 10 and 2000),
  -- First name and last initial, so reviews never show a customer's full name or email.
  author_name text not null check (char_length(author_name) between 1 and 80),
  status public.review_status not null default 'pending',
  moderated_by uuid references auth.users (id) on delete set null,
  moderated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (product_id, user_id)
);

create index product_reviews_product_idx on public.product_reviews (product_id, status, created_at desc);
create index product_reviews_status_idx on public.product_reviews (status, created_at desc);

create trigger product_reviews_set_updated_at
  before update on public.product_reviews
  for each row execute function public.set_updated_at();

alter table public.product_reviews enable row level security;

create policy "Approved reviews are public"
  on public.product_reviews for select
  to anon, authenticated
  using (status = 'approved' or (select public.has_permission('reviews.manage')));

-- Reads expose only public columns; who wrote a review stays with staff (admin_list_reviews).
-- Writes go through submit_product_review and the moderation functions.
revoke all on public.product_reviews from anon, authenticated;
grant select (id, product_id, rating, title, body, author_name, status, created_at)
  on public.product_reviews to anon, authenticated;

-- products.rating and products.reviews follow the approved reviews.
create or replace function public.refresh_product_rating()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_product bigint := coalesce(new.product_id, old.product_id);
begin
  update public.products p
  set rating = coalesce((
        select round(avg(r.rating)::numeric, 1) from public.product_reviews r
        where r.product_id = v_product and r.status = 'approved'
      ), 0),
      reviews = (
        select count(*) from public.product_reviews r
        where r.product_id = v_product and r.status = 'approved'
      )
  where p.id = v_product;
  return null;
end;
$$;

create trigger product_reviews_refresh_rating
  after insert or update or delete on public.product_reviews
  for each row execute function public.refresh_product_rating();

-- Creates or replaces the signed-in customer's review; an edited review waits for moderation again.
create or replace function public.submit_product_review(
  p_product_id bigint,
  p_rating integer,
  p_title text,
  p_body text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_order uuid;
  v_name text;
begin
  if v_user is null then
    raise exception 'not_authenticated';
  end if;

  select o.id into v_order
  from public.orders o
  join public.order_items i on i.order_id = o.id
  where o.user_id = v_user and o.status = 'delivered' and i.product_id = p_product_id
  order by o.created_at desc
  limit 1;
  if v_order is null then
    raise exception 'not_purchased';
  end if;

  select nullif(btrim(first_name || ' ' || case when last_name <> '' then left(last_name, 1) || '.' else '' end), '')
  into v_name
  from public.profiles where id = v_user;

  insert into public.product_reviews (product_id, user_id, order_id, rating, title, body, author_name)
  values (p_product_id, v_user, v_order, p_rating, btrim(coalesce(p_title, '')), btrim(coalesce(p_body, '')), coalesce(v_name, 'Verified buyer'))
  on conflict (product_id, user_id) do update
  set rating = excluded.rating,
      title = excluded.title,
      body = excluded.body,
      author_name = excluded.author_name,
      order_id = excluded.order_id,
      status = 'pending',
      moderated_by = null,
      moderated_at = null;
exception
  when check_violation then
    raise exception 'invalid_review';
end;
$$;

revoke execute on function public.submit_product_review(bigint, integer, text, text) from public, anon;
grant execute on function public.submit_product_review(bigint, integer, text, text) to authenticated;

-- The signed-in customer's own reviews, with their moderation status.
create or replace function public.my_reviews()
returns table (product_id bigint, rating smallint, title text, body text, status public.review_status, updated_at timestamptz)
language sql
stable
security definer
set search_path = ''
as $$
  select r.product_id, r.rating, r.title, r.body, r.status, r.updated_at
  from public.product_reviews r
  where r.user_id = (select auth.uid());
$$;

revoke execute on function public.my_reviews() from public, anon;
grant execute on function public.my_reviews() to authenticated;

create or replace function public.admin_list_reviews(
  p_status public.review_status default null,
  p_limit integer default 50,
  p_offset integer default 0
)
returns table (
  id bigint,
  product_id bigint,
  product_name text,
  product_slug text,
  customer_email text,
  author_name text,
  order_number text,
  rating smallint,
  title text,
  body text,
  status public.review_status,
  created_at timestamptz,
  moderated_at timestamptz,
  total_count bigint
)
language plpgsql
stable
security definer
set search_path = ''
as $$
#variable_conflict use_column
begin
  if not (select public.has_permission('reviews.manage')) then
    raise exception 'not_authorized';
  end if;

  return query
  select r.id, r.product_id, p.name, p.slug, u.email::text, r.author_name, o.order_number,
         r.rating, r.title, r.body, r.status, r.created_at, r.moderated_at,
         count(*) over ()
  from public.product_reviews r
  join public.products p on p.id = r.product_id
  left join auth.users u on u.id = r.user_id
  left join public.orders o on o.id = r.order_id
  where p_status is null or r.status = p_status
  order by r.created_at desc
  limit least(greatest(coalesce(p_limit, 50), 1), 100)
  offset greatest(coalesce(p_offset, 0), 0);
end;
$$;

revoke execute on function public.admin_list_reviews(public.review_status, integer, integer) from public, anon;
grant execute on function public.admin_list_reviews(public.review_status, integer, integer) to authenticated;

create or replace function public.admin_moderate_review(p_review_id bigint, p_status public.review_status)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_review public.product_reviews;
begin
  if not (select public.has_permission('reviews.manage')) then
    raise exception 'not_authorized';
  end if;

  update public.product_reviews
  set status = p_status, moderated_by = auth.uid(), moderated_at = now()
  where id = p_review_id
  returning * into v_review;
  if not found then
    raise exception 'review_not_found';
  end if;

  insert into public.staff_activity (actor_id, actor_role, action, entity_type, entity_id, summary)
  values (
    auth.uid(), public.my_role(), 'review.' || p_status::text, 'review', p_review_id::text,
    format('%s review by %s', initcap(p_status::text), v_review.author_name)
  );
end;
$$;

revoke execute on function public.admin_moderate_review(bigint, public.review_status) from public, anon;
grant execute on function public.admin_moderate_review(bigint, public.review_status) to authenticated;

create or replace function public.admin_delete_review(p_review_id bigint)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_author text;
begin
  if not (select public.has_permission('reviews.manage')) then
    raise exception 'not_authorized';
  end if;

  delete from public.product_reviews where id = p_review_id returning author_name into v_author;
  if not found then
    raise exception 'review_not_found';
  end if;

  insert into public.staff_activity (actor_id, actor_role, action, entity_type, entity_id, summary)
  values (auth.uid(), public.my_role(), 'review.deleted', 'review', p_review_id::text, format('Deleted review by %s', v_author));
end;
$$;

revoke execute on function public.admin_delete_review(bigint) from public, anon;
grant execute on function public.admin_delete_review(bigint) to authenticated;

-- ---------------------------------------------------------------------------
-- Customers and staff. Emails live in auth.users, so these are security definer.
-- ---------------------------------------------------------------------------

-- Customers (or one person by id). Total spent excludes cancelled and refunded orders.
create or replace function public.admin_list_customers(
  p_search text default null,
  p_sort text default 'newest',
  p_limit integer default 25,
  p_offset integer default 0,
  p_user_id uuid default null
)
returns table (
  id uuid,
  email text,
  first_name text,
  last_name text,
  phone text,
  role public.user_role,
  created_at timestamptz,
  last_sign_in_at timestamptz,
  order_count bigint,
  total_spent numeric,
  last_order_at timestamptz,
  total_count bigint
)
language plpgsql
stable
security definer
set search_path = ''
as $$
#variable_conflict use_column
declare
  v_search text := nullif(btrim(coalesce(p_search, '')), '');
  v_pattern text;
begin
  if not (select public.has_permission('customers.view')) then
    raise exception 'not_authorized';
  end if;
  v_pattern := '%' || replace(replace(replace(coalesce(v_search, ''), '\', '\\'), '%', '\%'), '_', '\_') || '%';

  return query
  with base as (
    select p.id, u.email::text as email, p.first_name, p.last_name, p.phone, p.role, p.created_at,
           u.last_sign_in_at,
           count(o.id) as order_count,
           coalesce(sum(o.total) filter (where o.status not in ('cancelled', 'refunded')), 0) as total_spent,
           max(o.created_at) as last_order_at
    from public.profiles p
    join auth.users u on u.id = p.id
    left join public.orders o on o.user_id = p.id
    where (case when p_user_id is null then p.role = 'customer' else p.id = p_user_id end)
      and (
        v_search is null
        or u.email ilike v_pattern
        or (p.first_name || ' ' || p.last_name) ilike v_pattern
        or coalesce(p.phone, '') ilike v_pattern
      )
    group by p.id, u.email, u.last_sign_in_at
  )
  select b.id, b.email, b.first_name, b.last_name, b.phone, b.role, b.created_at, b.last_sign_in_at,
         b.order_count, b.total_spent, b.last_order_at, count(*) over ()
  from base b
  order by
    case when p_sort = 'spent' then b.total_spent end desc nulls last,
    case when p_sort = 'orders' then b.order_count end desc nulls last,
    case when p_sort = 'name' then lower(b.first_name || ' ' || b.last_name) end asc nulls last,
    b.created_at desc
  limit least(greatest(coalesce(p_limit, 25), 1), 100)
  offset greatest(coalesce(p_offset, 0), 0);
end;
$$;

revoke execute on function public.admin_list_customers(text, text, integer, integer, uuid) from public, anon;
grant execute on function public.admin_list_customers(text, text, integer, integer, uuid) to authenticated;

create or replace function public.admin_list_staff()
returns table (
  id uuid,
  email text,
  first_name text,
  last_name text,
  role public.user_role,
  created_at timestamptz,
  last_sign_in_at timestamptz
)
language plpgsql
stable
security definer
set search_path = ''
as $$
#variable_conflict use_column
begin
  if not ((select public.has_permission('staff.manage')) or (select public.has_permission('security.view'))) then
    raise exception 'not_authorized';
  end if;

  return query
  select p.id, u.email::text, p.first_name, p.last_name, p.role, p.created_at, u.last_sign_in_at
  from public.profiles p
  join auth.users u on u.id = p.id
  where p.role in ('super_admin', 'admin', 'manager', 'staff')
  order by array_position('{super_admin,admin,manager,staff}'::public.user_role[], p.role),
           lower(p.first_name || ' ' || p.last_name), u.email;
end;
$$;

revoke execute on function public.admin_list_staff() from public, anon;
grant execute on function public.admin_list_staff() to authenticated;

-- Exact (case-insensitive) email match only, so it can't be used to browse accounts.
create or replace function public.admin_find_user(p_email text)
returns table (id uuid, email text, first_name text, last_name text, role public.user_role)
language plpgsql
stable
security definer
set search_path = ''
as $$
#variable_conflict use_column
begin
  if not (select public.has_permission('staff.manage')) then
    raise exception 'not_authorized';
  end if;

  return query
  select p.id, u.email::text, p.first_name, p.last_name, p.role
  from auth.users u
  join public.profiles p on p.id = u.id
  where lower(u.email) = lower(btrim(coalesce(p_email, '')))
  limit 1;
end;
$$;

revoke execute on function public.admin_find_user(text) from public, anon;
grant execute on function public.admin_find_user(text) to authenticated;

-- Nobody can change their own role, and a role can only be given to (or taken from) someone
-- within the actor's assignable_roles — so no one below super_admin can create admins.
create or replace function public.admin_set_user_role(p_user_id uuid, p_role public.user_role)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_allowed public.user_role[] := public.assignable_roles(coalesce(public.my_role(), 'customer'));
  v_current public.user_role;
begin
  if not (select public.has_permission('staff.manage')) then
    raise exception 'not_authorized';
  end if;
  if p_user_id = (select auth.uid()) then
    raise exception 'own_role';
  end if;

  select role into v_current from public.profiles where id = p_user_id for update;
  if not found then
    raise exception 'user_not_found';
  end if;
  if not (v_current = any (v_allowed) and p_role = any (v_allowed)) then
    raise exception 'role_not_allowed';
  end if;
  if v_current = p_role then
    return;
  end if;

  update public.profiles set role = p_role where id = p_user_id;
end;
$$;

revoke execute on function public.admin_set_user_role(uuid, public.user_role) from public, anon;
grant execute on function public.admin_set_user_role(uuid, public.user_role) to authenticated;

-- Roles, their permissions, and whom each can manage, for the security page.
create or replace function public.admin_role_matrix()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not (select public.is_staff()) then
    raise exception 'not_authorized';
  end if;

  return (
    select jsonb_object_agg(
      r::text,
      jsonb_build_object('permissions', to_jsonb(public.role_permissions(r)), 'assignable', to_jsonb(public.assignable_roles(r)))
    )
    from unnest(enum_range(null::public.user_role)) r
  );
end;
$$;

revoke execute on function public.admin_role_matrix() from public, anon;
grant execute on function public.admin_role_matrix() to authenticated;

-- ---------------------------------------------------------------------------
-- Analytics. Days are counted in India time.
-- ---------------------------------------------------------------------------

create or replace function public.admin_sales_series(p_days integer default 30)
returns table (day date, orders bigint, order_value numeric, paid_revenue numeric)
language plpgsql
stable
security definer
set search_path = ''
as $$
#variable_conflict use_column
declare
  v_days integer := least(greatest(coalesce(p_days, 30), 1), 365);
  v_today date := (now() at time zone 'Asia/Kolkata')::date;
begin
  if not (select public.has_permission('analytics.view')) then
    raise exception 'not_authorized';
  end if;

  return query
  select d.day,
         count(o.id) filter (where o.status <> 'cancelled'),
         coalesce(sum(o.total) filter (where o.status not in ('cancelled', 'refunded')), 0),
         coalesce(sum(o.total) filter (where o.status <> 'cancelled' and o.payment_status = 'paid'), 0)
  from (
    select g::date as day from generate_series(v_today - (v_days - 1), v_today, interval '1 day') g
  ) d
  left join public.orders o on (o.created_at at time zone 'Asia/Kolkata')::date = d.day
  group by d.day
  order by d.day;
end;
$$;

revoke execute on function public.admin_sales_series(integer) from public, anon;
grant execute on function public.admin_sales_series(integer) to authenticated;

create or replace function public.admin_customer_series(p_days integer default 30)
returns table (day date, new_customers bigint, total_customers bigint)
language plpgsql
stable
security definer
set search_path = ''
as $$
#variable_conflict use_column
declare
  v_days integer := least(greatest(coalesce(p_days, 30), 1), 365);
  v_today date := (now() at time zone 'Asia/Kolkata')::date;
begin
  if not (select public.has_permission('analytics.view')) then
    raise exception 'not_authorized';
  end if;

  return query
  select d.day,
         (select count(*) from public.profiles p
          where p.role = 'customer' and (p.created_at at time zone 'Asia/Kolkata')::date = d.day),
         (select count(*) from public.profiles p
          where p.role = 'customer' and (p.created_at at time zone 'Asia/Kolkata')::date <= d.day)
  from (
    select g::date as day from generate_series(v_today - (v_days - 1), v_today, interval '1 day') g
  ) d
  order by d.day;
end;
$$;

revoke execute on function public.admin_customer_series(integer) from public, anon;
grant execute on function public.admin_customer_series(integer) to authenticated;

-- Units and value sold per product in the period (every product, including ones that sold nothing).
create or replace function public.admin_product_performance(p_days integer default 30)
returns table (
  product_id bigint,
  name text,
  slug text,
  image text,
  is_active boolean,
  stock integer,
  units_sold bigint,
  revenue numeric
)
language plpgsql
stable
security definer
set search_path = ''
as $$
#variable_conflict use_column
declare
  v_since timestamptz := now() - make_interval(days => least(greatest(coalesce(p_days, 30), 1), 365));
begin
  if not (select public.has_permission('analytics.view')) then
    raise exception 'not_authorized';
  end if;

  return query
  select p.id, p.name, p.slug, p.image, p.is_active, p.stock,
         coalesce(sum(i.quantity) filter (where o.id is not null), 0)::bigint,
         coalesce(sum(i.quantity * i.unit_price) filter (where o.id is not null), 0)
  from public.products p
  left join public.order_items i on i.product_id = p.id
  left join public.orders o
    on o.id = i.order_id and o.status not in ('cancelled', 'refunded') and o.created_at >= v_since
  group by p.id
  order by 7 desc, 8 desc, p.name;
end;
$$;

revoke execute on function public.admin_product_performance(integer) from public, anon;
grant execute on function public.admin_product_performance(integer) to authenticated;

-- ---------------------------------------------------------------------------
-- System health
-- ---------------------------------------------------------------------------

create or replace function public.admin_system_health()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_latest_migration text;
  v_media_bucket boolean;
begin
  if not (select public.has_permission('security.view')) then
    raise exception 'not_authorized';
  end if;

  -- Only present when migrations were applied with the Supabase CLI.
  if to_regclass('supabase_migrations.schema_migrations') is not null then
    execute 'select max(version) from supabase_migrations.schema_migrations' into v_latest_migration;
  end if;
  begin
    select exists (select 1 from storage.buckets where id = 'media') into v_media_bucket;
  exception when others then
    v_media_bucket := null;
  end;

  return jsonb_build_object(
    'database_version', current_setting('server_version'),
    'server_time', now(),
    'latest_migration', v_latest_migration,
    'media_bucket', v_media_bucket,
    'counts', jsonb_build_object(
      'products', (select count(*) from public.products),
      'orders', (select count(*) from public.orders),
      'customers', (select count(*) from public.profiles where role = 'customer'),
      'staff', (select count(*) from public.profiles where role in ('super_admin', 'admin', 'manager', 'staff')),
      'pending_reviews', (select count(*) from public.product_reviews where status = 'pending')
    ),
    'tables_without_rls', (
      select coalesce(jsonb_agg(c.relname order by c.relname), '[]'::jsonb)
      from pg_class c
      join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'public' and c.relkind = 'r' and not c.relrowsecurity
    ),
    'recent_errors', (
      select coalesce(jsonb_agg(e order by e.created_at desc), '[]'::jsonb)
      from (
        select a.created_at, a.action, a.summary
        from public.staff_activity a
        where a.level = 'error'
        order by a.created_at desc
        limit 10
      ) e
    )
  );
end;
$$;

revoke execute on function public.admin_system_health() from public, anon;
grant execute on function public.admin_system_health() to authenticated;

-- ---------------------------------------------------------------------------
-- Media library: a public bucket for product and category images. Anyone can view files by
-- URL; only catalog managers can upload or delete, and staff with catalog access can list.
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('media', 'media', true, 5242880, array['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif'])
on conflict (id) do nothing;

create policy "Staff with catalog access can list media"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'media' and (select public.has_permission('catalog.view')));

create policy "Catalog managers can upload media"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'media' and (select public.has_permission('catalog.manage')));

create policy "Catalog managers can update media"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'media' and (select public.has_permission('catalog.manage')))
  with check (bucket_id = 'media' and (select public.has_permission('catalog.manage')));

create policy "Catalog managers can delete media"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'media' and (select public.has_permission('catalog.manage')));
