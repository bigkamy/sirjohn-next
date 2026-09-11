-- Product options (hand orientation, shaft flex), default addresses, and payment-ready orders.
-- Apply after 20260912000000_cart_checkout.sql.

-- ---------------------------------------------------------------------------
-- Product options
-- ---------------------------------------------------------------------------

-- Option groups a customer must choose from before buying, e.g.
-- [{"name": "Hand Orientation", "values": ["Right Hand", "Left Hand"]}]. Empty = no options.
alter table public.products
  add column options jsonb not null default '[]'::jsonb check (jsonb_typeof(options) = 'array');

-- True when p_selected ({"Group": "Value", ...}) picks exactly one allowed value for every
-- group in p_available and names no other group.
create or replace function public.product_options_valid(p_available jsonb, p_selected jsonb)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select case
    when jsonb_typeof(p_selected) is distinct from 'object' then false
    else (select count(*) from jsonb_object_keys(p_selected)) = jsonb_array_length(p_available)
      and not exists (
        select 1
        from jsonb_array_elements(p_available) as grp
        where not coalesce((grp -> 'values') ? (p_selected ->> (grp ->> 'name')), false)
      )
  end;
$$;

-- ---------------------------------------------------------------------------
-- Cart lines carry the chosen options, so one product in two configurations is
-- two lines.
-- ---------------------------------------------------------------------------

alter table public.cart_items drop constraint cart_items_pkey;

alter table public.cart_items
  add column id bigint generated always as identity,
  add column options jsonb not null default '{}'::jsonb check (jsonb_typeof(options) = 'object');

alter table public.cart_items add primary key (id);
alter table public.cart_items add constraint cart_items_line_unique unique (user_id, product_id, options);

create or replace function public.add_cart_items(p_items jsonb)
returns void
language sql
security invoker
set search_path = ''
as $$
  insert into public.cart_items as c (user_id, product_id, options, quantity)
  select (select auth.uid()), p.id, r.options, least(r.quantity, p.stock, 99)
  from (
    select
      (item ->> 'product_id')::bigint as product_id,
      coalesce(item -> 'options', '{}'::jsonb) as options,
      sum((item ->> 'quantity')::integer) as quantity,
      min(position) as position
    from jsonb_array_elements(coalesce(p_items, '[]'::jsonb)) with ordinality as t(item, position)
    group by 1, 2
  ) as r
  join public.products p on p.id = r.product_id and p.is_active and p.stock > 0
  where r.quantity > 0 and public.product_options_valid(p.options, r.options)
  -- Insert in the order given, so a merged guest cart keeps the order items were added.
  order by r.position
  on conflict (user_id, product_id, options) do update
    set quantity = least(
      c.quantity + excluded.quantity,
      (select stock from public.products where id = excluded.product_id),
      99
    );
$$;

-- The configuration is recorded permanently with each order line.
alter table public.order_items
  add column options jsonb not null default '{}'::jsonb check (jsonb_typeof(options) = 'object');

-- ---------------------------------------------------------------------------
-- Addresses: at most one default per customer.
-- ---------------------------------------------------------------------------

create unique index addresses_one_default_per_user on public.addresses (user_id) where is_default;

create or replace function public.set_default_address(p_address_id uuid)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if not exists (
    select 1 from public.addresses where id = p_address_id and user_id = (select auth.uid())
  ) then
    raise exception 'address_not_found';
  end if;

  -- Clear the old default first so the one-default index is never violated.
  update public.addresses
  set is_default = false
  where user_id = (select auth.uid()) and is_default and id <> p_address_id;

  update public.addresses set is_default = true where id = p_address_id;
end;
$$;

revoke execute on function public.set_default_address(uuid) from public, anon;
grant execute on function public.set_default_address(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Payments. Orders stay `pending` until a provider (e.g. Razorpay) confirms payment
-- through mark_order_paid, which only the server's service role can call.
-- ---------------------------------------------------------------------------

create type public.payment_status as enum ('pending', 'paid', 'failed', 'refunded');

alter table public.orders
  add column payment_status public.payment_status not null default 'pending',
  add column currency text not null default 'INR' check (char_length(currency) = 3);

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  provider text not null,
  provider_order_id text,
  provider_payment_id text unique,
  amount numeric(12, 2) not null check (amount >= 0),
  currency text not null default 'INR',
  status public.payment_status not null default 'pending',
  raw jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index payments_order_id_idx on public.payments (order_id);

create trigger payments_set_updated_at
  before update on public.payments
  for each row execute function public.set_updated_at();

alter table public.payments enable row level security;

-- Raw provider payloads are for staff only. There are no write policies: rows are
-- written by mark_order_paid or the service role.
create policy "Admins can view payments"
  on public.payments for select
  to authenticated
  using ((select public.is_admin()));

-- Call only after verifying the provider's signature (e.g. Razorpay's HMAC) on the server.
-- Idempotent, so webhook retries are safe; refuses amounts that don't match the order.
create or replace function public.mark_order_paid(
  p_order_id uuid,
  p_provider text,
  p_provider_order_id text,
  p_provider_payment_id text,
  p_amount numeric,
  p_raw jsonb default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order public.orders;
begin
  select * into v_order from public.orders where id = p_order_id for update;

  if not found then
    raise exception 'order_not_found';
  end if;
  if v_order.payment_status = 'paid' then
    return;
  end if;
  if v_order.status = 'cancelled' then
    raise exception 'order_cancelled';
  end if;
  if p_amount is distinct from v_order.total then
    raise exception 'amount_mismatch';
  end if;

  insert into public.payments (order_id, provider, provider_order_id, provider_payment_id, amount, currency, status, raw)
  values (p_order_id, p_provider, p_provider_order_id, p_provider_payment_id, p_amount, v_order.currency, 'paid', p_raw)
  on conflict (provider_payment_id) do nothing;

  update public.orders
  set payment_status = 'paid',
      status = case when status = 'pending' then 'processing'::public.order_status else status end
  where id = p_order_id;
end;
$$;

revoke execute on function public.mark_order_paid(uuid, text, text, text, numeric, jsonb) from public, anon, authenticated;
grant execute on function public.mark_order_paid(uuid, text, text, text, numeric, jsonb) to service_role;

-- ---------------------------------------------------------------------------
-- Pricing and checkout, now option-aware.
-- ---------------------------------------------------------------------------

-- Items are [{key, product_id, quantity, options}]; each line comes back with its key
-- and whether its options are still valid for the product.
create or replace function public.quote_cart(
  p_items jsonb,
  p_shipping_method text default null,
  p_coupon_code text default null
)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_lines jsonb;
  v_item_count integer;
  v_subtotal numeric(12, 2);
  v_options jsonb;
  v_method text;
  v_shipping numeric(12, 2);
  v_code text := nullif(upper(btrim(coalesce(p_coupon_code, ''))), '');
  v_coupon public.coupons;
  v_coupon_status text;
  v_discount numeric(12, 2) := 0;
begin
  with requested as (
    select
      coalesce(item ->> 'key', position::text) as key,
      (item ->> 'product_id')::bigint as product_id,
      (item ->> 'quantity')::integer as quantity,
      coalesce(item -> 'options', '{}'::jsonb) as options,
      position
    from jsonb_array_elements(coalesce(p_items, '[]'::jsonb)) with ordinality as t(item, position)
  )
  select
    coalesce(jsonb_agg(jsonb_build_object(
      'key', r.key,
      'product_id', p.id,
      'slug', p.slug,
      'name', p.name,
      'brand', p.brand,
      'image', p.image,
      'options', r.options,
      'options_valid', public.product_options_valid(p.options, r.options),
      'unit_price', p.price,
      'quantity', r.quantity,
      'line_total', p.price * r.quantity,
      'stock', p.stock
    ) order by r.position), '[]'::jsonb),
    coalesce(sum(r.quantity), 0),
    coalesce(sum(p.price * r.quantity), 0)
  into v_lines, v_item_count, v_subtotal
  from requested r
  join public.products p on p.id = r.product_id and p.is_active
  where r.quantity > 0;

  select coalesce(jsonb_agg(jsonb_build_object(
      'code', m.code,
      'name', m.name,
      'description', m.description,
      'price', case
        when v_item_count = 0 or (m.free_over is not null and v_subtotal >= m.free_over) then 0
        else m.price
      end
    ) order by m.sort_order), '[]'::jsonb)
  into v_options
  from public.shipping_methods m
  where m.is_active;

  v_method := coalesce(p_shipping_method, v_options -> 0 ->> 'code');

  select (o ->> 'price')::numeric
  into v_shipping
  from jsonb_array_elements(v_options) as o
  where o ->> 'code' = v_method;

  if v_shipping is null then
    raise exception 'invalid_shipping_method';
  end if;

  if v_code is not null then
    select * into v_coupon from public.coupons where code = v_code;

    v_coupon_status := case
      when v_coupon.id is null or not v_coupon.is_active then 'invalid'
      when v_coupon.starts_at > now() then 'not_started'
      when v_coupon.expires_at <= now() then 'expired'
      when v_coupon.used_count >= v_coupon.usage_limit then 'exhausted'
      when v_subtotal < v_coupon.min_subtotal then 'below_minimum'
      else 'applied'
    end;

    if v_coupon_status = 'applied' then
      v_discount := case v_coupon.discount_type
        when 'percent' then round(v_subtotal * v_coupon.value / 100, 2)
        else v_coupon.value
      end;
      v_discount := least(v_discount, coalesce(v_coupon.max_discount, v_discount), v_subtotal);
    end if;
  end if;

  return jsonb_build_object(
    'items', v_lines,
    'item_count', v_item_count,
    'subtotal', v_subtotal,
    'shipping_method', v_method,
    'shipping_options', v_options,
    'shipping', v_shipping,
    'discount', v_discount,
    'total', v_subtotal - v_discount + v_shipping,
    'coupon', case when v_code is null then null else jsonb_build_object(
      'code', v_code,
      'status', v_coupon_status,
      'min_subtotal', v_coupon.min_subtotal
    ) end
  );
end;
$$;

create or replace function public.place_order(
  p_email text,
  p_shipping_address jsonb,
  p_shipping_method text,
  p_payment_method text,
  p_coupon_code text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_code text := nullif(upper(btrim(coalesce(p_coupon_code, ''))), '');
  v_unavailable jsonb;
  v_misconfigured text;
  v_items jsonb;
  v_quote jsonb;
  v_order public.orders;
begin
  if v_user_id is null then
    raise exception 'not_authenticated';
  end if;

  if p_payment_method is null or p_payment_method not in ('upi', 'card', 'netbanking', 'wallet') then
    raise exception 'invalid_payment_method';
  end if;

  if coalesce(btrim(p_email), '') !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'
    or exists (
      select 1
      from unnest(array['full_name', 'phone', 'line1', 'city', 'state', 'postal_code']) as field
      where coalesce(btrim(p_shipping_address ->> field), '') = ''
    ) then
    raise exception 'invalid_address';
  end if;

  -- Concurrent checkouts for the same products queue here, so stock can't be oversold,
  -- and a double-submitted checkout finds the cart already empty.
  perform 1
  from public.cart_items c
  join public.products p on p.id = c.product_id
  where c.user_id = v_user_id
  order by p.id, c.id
  for update of c, p;

  if v_code is not null then
    perform 1 from public.coupons where code = v_code for update;
  end if;

  -- Stock is checked per product, across every configuration in the cart.
  select jsonb_build_object('name', p.name, 'available', case when p.is_active then p.stock else 0 end)
  into v_unavailable
  from (
    select product_id, sum(quantity) as quantity
    from public.cart_items
    where user_id = v_user_id
    group by product_id
  ) c
  join public.products p on p.id = c.product_id
  where not p.is_active or p.stock < c.quantity
  limit 1;

  if v_unavailable is not null then
    raise exception 'insufficient_stock' using detail = v_unavailable::text;
  end if;

  select p.name
  into v_misconfigured
  from public.cart_items c
  join public.products p on p.id = c.product_id
  where c.user_id = v_user_id and not public.product_options_valid(p.options, c.options)
  limit 1;

  if v_misconfigured is not null then
    raise exception 'invalid_options' using detail = v_misconfigured;
  end if;

  select coalesce(jsonb_agg(jsonb_build_object(
      'key', id::text,
      'product_id', product_id,
      'quantity', quantity,
      'options', options
    ) order by created_at, id), '[]'::jsonb)
  into v_items
  from public.cart_items
  where user_id = v_user_id;

  v_quote := public.quote_cart(v_items, p_shipping_method, v_code);

  if (v_quote ->> 'item_count')::integer = 0 then
    raise exception 'cart_empty';
  end if;

  if v_code is not null and v_quote #>> '{coupon,status}' <> 'applied' then
    raise exception 'invalid_coupon' using detail = v_quote #>> '{coupon,status}';
  end if;

  insert into public.orders (
    user_id, email, shipping_address, shipping_method, payment_method,
    coupon_code, subtotal, shipping, discount, total
  )
  values (
    v_user_id,
    lower(btrim(p_email)),
    p_shipping_address,
    v_quote ->> 'shipping_method',
    p_payment_method,
    v_code,
    (v_quote ->> 'subtotal')::numeric,
    (v_quote ->> 'shipping')::numeric,
    (v_quote ->> 'discount')::numeric,
    (v_quote ->> 'total')::numeric
  )
  returning * into v_order;

  insert into public.order_items (order_id, product_id, product_name, options, unit_price, quantity)
  select
    v_order.id,
    (line ->> 'product_id')::bigint,
    line ->> 'name',
    line -> 'options',
    (line ->> 'unit_price')::numeric,
    (line ->> 'quantity')::integer
  from jsonb_array_elements(v_quote -> 'items') as line;

  update public.products p
  set stock = p.stock - c.quantity
  from (
    select product_id, sum(quantity) as quantity
    from public.cart_items
    where user_id = v_user_id
    group by product_id
  ) c
  where p.id = c.product_id;

  if v_code is not null then
    update public.coupons set used_count = used_count + 1 where code = v_code;
  end if;

  delete from public.cart_items where user_id = v_user_id;

  return jsonb_build_object('order_id', v_order.id, 'order_number', v_order.order_number);
end;
$$;
