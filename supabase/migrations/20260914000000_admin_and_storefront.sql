-- Admin tools (dashboard stats, stock adjustments, order status) and storefront forms
-- (newsletter, contact). Apply after 20260913000000_accounts_options_payments.sql.

-- ---------------------------------------------------------------------------
-- Catalog
-- ---------------------------------------------------------------------------

-- Slugs appear in URLs: lowercase words separated by single hyphens.
alter table public.products
  add constraint products_slug_format check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$');

-- Adds units (or removes them, with a negative delta) relative to the current stock, so an
-- admin edit never overwrites a decrement made by checkout in the meantime.
create or replace function public.adjust_product_stock(p_product_id bigint, p_delta integer)
returns integer
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_stock integer;
begin
  if not (select public.is_admin()) then
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

-- ---------------------------------------------------------------------------
-- Orders
-- ---------------------------------------------------------------------------

-- Moves an order through its lifecycle. Cancelling returns the items to stock and the
-- coupon use to the pool. Shipped orders can only be delivered; delivered and cancelled
-- orders are final.
create or replace function public.admin_set_order_status(p_order_number text, p_status public.order_status)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_order public.orders;
begin
  if not (select public.is_admin()) then
    raise exception 'not_authorized';
  end if;

  select * into v_order from public.orders where order_number = p_order_number for update;
  if not found then
    raise exception 'order_not_found';
  end if;
  if v_order.status = p_status then
    return;
  end if;
  if v_order.status in ('delivered', 'cancelled') then
    raise exception 'order_closed';
  end if;
  if v_order.status = 'shipped' and p_status <> 'delivered' then
    raise exception 'order_shipped';
  end if;
  if p_status = 'pending' then
    raise exception 'invalid_transition';
  end if;

  if p_status = 'cancelled' then
    update public.products p
    set stock = p.stock + i.quantity
    from (
      select product_id, sum(quantity) as quantity
      from public.order_items
      where order_id = v_order.id and product_id is not null
      group by product_id
    ) i
    where p.id = i.product_id;

    if v_order.coupon_code is not null then
      update public.coupons set used_count = greatest(used_count - 1, 0) where code = v_order.coupon_code;
    end if;
  end if;

  update public.orders set status = p_status where id = v_order.id;
end;
$$;

revoke execute on function public.admin_set_order_status(text, public.order_status) from public, anon;
grant execute on function public.admin_set_order_status(text, public.order_status) to authenticated;

-- Figures for the admin dashboard, computed in the database. Cancelled orders are excluded;
-- "paid_revenue" only counts orders a payment provider has confirmed.
create or replace function public.admin_dashboard_stats(p_low_stock_threshold integer default 5)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not (select public.is_admin()) then
    raise exception 'not_authorized';
  end if;

  return jsonb_build_object(
    'order_count', (select count(*) from public.orders where status <> 'cancelled'),
    'orders_last_30_days', (
      select count(*) from public.orders
      where status <> 'cancelled' and created_at >= now() - interval '30 days'
    ),
    'order_value', (select coalesce(sum(total), 0) from public.orders where status <> 'cancelled'),
    'paid_revenue', (
      select coalesce(sum(total), 0) from public.orders
      where status <> 'cancelled' and payment_status = 'paid'
    ),
    'customer_count', (select count(*) from public.profiles where role = 'customer'),
    'new_customers_last_30_days', (
      select count(*) from public.profiles
      where role = 'customer' and created_at >= now() - interval '30 days'
    ),
    'low_stock_count', (select count(*) from public.products where is_active and stock <= p_low_stock_threshold),
    'out_of_stock_count', (select count(*) from public.products where is_active and stock = 0),
    'low_stock_threshold', p_low_stock_threshold
  );
end;
$$;

revoke execute on function public.admin_dashboard_stats(integer) from public, anon;
grant execute on function public.admin_dashboard_stats(integer) to authenticated;

-- ---------------------------------------------------------------------------
-- Newsletter and contact form. Visitors can only submit through these functions;
-- nobody but admins can read the rows back.
-- ---------------------------------------------------------------------------

create table public.newsletter_subscribers (
  id bigint generated always as identity primary key,
  email text not null unique check (
    email = lower(email) and char_length(email) <= 254 and email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'
  ),
  created_at timestamptz not null default now()
);

alter table public.newsletter_subscribers enable row level security;

create policy "Admins can view subscribers"
  on public.newsletter_subscribers for select
  to authenticated
  using ((select public.is_admin()));

create or replace function public.subscribe_newsletter(p_email text)
returns void
language sql
security definer
set search_path = ''
as $$
  insert into public.newsletter_subscribers (email)
  values (lower(btrim(p_email)))
  on conflict (email) do nothing;
$$;

grant execute on function public.subscribe_newsletter(text) to anon, authenticated;

create table public.contact_messages (
  id bigint generated always as identity primary key,
  user_id uuid references auth.users (id) on delete set null,
  name text not null check (char_length(name) between 1 and 120),
  email text not null check (char_length(email) <= 254 and email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  phone text check (char_length(phone) <= 30),
  subject text not null check (char_length(subject) between 1 and 150),
  message text not null check (char_length(message) between 10 and 5000),
  handled_at timestamptz,
  created_at timestamptz not null default now()
);

create index contact_messages_created_at_idx on public.contact_messages (created_at desc);

alter table public.contact_messages enable row level security;

create policy "Admins can view contact messages"
  on public.contact_messages for select
  to authenticated
  using ((select public.is_admin()));

create policy "Admins can update contact messages"
  on public.contact_messages for update
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

create or replace function public.submit_contact_message(
  p_name text,
  p_email text,
  p_phone text,
  p_subject text,
  p_message text
)
returns void
language sql
security definer
set search_path = ''
as $$
  insert into public.contact_messages (user_id, name, email, phone, subject, message)
  values (
    auth.uid(),
    btrim(p_name),
    lower(btrim(p_email)),
    nullif(btrim(coalesce(p_phone, '')), ''),
    btrim(p_subject),
    btrim(p_message)
  );
$$;

grant execute on function public.submit_contact_message(text, text, text, text, text) to anon, authenticated;
