-- Cart persistence, shipping methods, coupons, and transactional checkout.
-- Apply after 20260911000000_init.sql.

-- ---------------------------------------------------------------------------
-- Cart. Signed-in carts live here; guest carts live in a cookie and are merged
-- in when the shopper logs in (lib/cart.ts).
-- ---------------------------------------------------------------------------

create table public.cart_items (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  product_id bigint not null references public.products (id) on delete cascade,
  quantity integer not null check (quantity between 1 and 99),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, product_id)
);

create index cart_items_product_id_idx on public.cart_items (product_id);

create trigger cart_items_set_updated_at
  before update on public.cart_items
  for each row execute function public.set_updated_at();

alter table public.cart_items enable row level security;

create policy "Users manage their own cart"
  on public.cart_items for all
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- Adds quantities to the caller's cart, capped at available stock. Used by
-- "Add to cart" and to merge a guest cart on login. Runs with the caller's RLS.
create or replace function public.add_cart_items(p_items jsonb)
returns void
language sql
security invoker
set search_path = ''
as $$
  insert into public.cart_items as c (user_id, product_id, quantity)
  select (select auth.uid()), p.id, least(r.quantity, p.stock, 99)
  from (
    select (item ->> 'product_id')::bigint as product_id, sum((item ->> 'quantity')::integer) as quantity
    from jsonb_array_elements(coalesce(p_items, '[]'::jsonb)) as item
    group by 1
  ) as r
  join public.products p on p.id = r.product_id and p.is_active and p.stock > 0
  where r.quantity > 0
  on conflict (user_id, product_id) do update
    set quantity = least(
      c.quantity + excluded.quantity,
      (select stock from public.products where id = excluded.product_id),
      99
    );
$$;

revoke execute on function public.add_cart_items(jsonb) from public, anon;
grant execute on function public.add_cart_items(jsonb) to authenticated;

-- ---------------------------------------------------------------------------
-- Shipping methods. Edit rows here to change delivery pricing.
-- ---------------------------------------------------------------------------

create table public.shipping_methods (
  code text primary key,
  name text not null,
  description text not null default '',
  price numeric(12, 2) not null check (price >= 0),
  -- Shipping is free when the subtotal reaches this amount (null = never free).
  free_over numeric(12, 2) check (free_over >= 0),
  sort_order integer not null default 0,
  is_active boolean not null default true
);

alter table public.shipping_methods enable row level security;

create policy "Active shipping methods are public"
  on public.shipping_methods for select
  to anon, authenticated
  using (is_active or (select public.is_admin()));

create policy "Admins can insert shipping methods"
  on public.shipping_methods for insert
  to authenticated
  with check ((select public.is_admin()));

create policy "Admins can update shipping methods"
  on public.shipping_methods for update
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

insert into public.shipping_methods (code, name, description, price, free_over, sort_order) values
  ('standard', 'Standard Delivery', '3-5 business days', 799, 2999, 1),
  ('express', 'Express Delivery', '1-2 business days', 799, null, 2);

-- ---------------------------------------------------------------------------
-- Coupons. Customers can't read this table; codes are only checked through
-- quote_cart and place_order.
-- ---------------------------------------------------------------------------

create type public.discount_type as enum ('percent', 'fixed');

create table public.coupons (
  id bigint generated always as identity primary key,
  code text not null unique check (code = upper(code)),
  description text not null default '',
  discount_type public.discount_type not null,
  value numeric(12, 2) not null check (value > 0),
  min_subtotal numeric(12, 2) not null default 0 check (min_subtotal >= 0),
  max_discount numeric(12, 2) check (max_discount > 0),
  starts_at timestamptz,
  expires_at timestamptz,
  usage_limit integer check (usage_limit > 0),
  used_count integer not null default 0 check (used_count >= 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  check (discount_type <> 'percent' or value <= 100)
);

alter table public.coupons enable row level security;

create policy "Admins manage coupons"
  on public.coupons for all
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

-- ---------------------------------------------------------------------------
-- Orders
-- ---------------------------------------------------------------------------

-- Keep payment method values in sync with lib/checkout.ts.
alter table public.orders
  add column coupon_code text,
  add constraint orders_shipping_method_fkey
    foreign key (shipping_method) references public.shipping_methods (code) on update cascade,
  add constraint orders_payment_method_check
    check (payment_method in ('upi', 'card', 'netbanking', 'wallet'));

-- Prices a list of {product_id, quantity} from current database prices. This is the
-- only place totals are computed: the cart and checkout pages display its result and
-- place_order charges it. Unknown or inactive products are dropped. A null shipping
-- method means the first active one.
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
      (item ->> 'product_id')::bigint as product_id,
      sum((item ->> 'quantity')::integer) as quantity,
      min(position) as position
    from jsonb_array_elements(coalesce(p_items, '[]'::jsonb)) with ordinality as t(item, position)
    group by 1
  )
  select
    coalesce(jsonb_agg(jsonb_build_object(
      'product_id', p.id,
      'slug', p.slug,
      'name', p.name,
      'brand', p.brand,
      'image', p.image,
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

grant execute on function public.quote_cart(jsonb, text, text) to anon, authenticated;

-- Turns the caller's cart into an order in a single transaction: locks the cart and
-- its products, re-checks stock, prices everything with quote_cart, records the order
-- and its items, decrements stock, consumes the coupon, and empties the cart.
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
  order by p.id
  for update of c, p;

  if v_code is not null then
    perform 1 from public.coupons where code = v_code for update;
  end if;

  select jsonb_build_object('name', p.name, 'available', case when p.is_active then p.stock else 0 end)
  into v_unavailable
  from public.cart_items c
  join public.products p on p.id = c.product_id
  where c.user_id = v_user_id and (not p.is_active or p.stock < c.quantity)
  limit 1;

  if v_unavailable is not null then
    raise exception 'insufficient_stock' using detail = v_unavailable::text;
  end if;

  select coalesce(jsonb_agg(jsonb_build_object('product_id', product_id, 'quantity', quantity) order by created_at), '[]'::jsonb)
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

  insert into public.order_items (order_id, product_id, product_name, unit_price, quantity)
  select
    v_order.id,
    (line ->> 'product_id')::bigint,
    line ->> 'name',
    (line ->> 'unit_price')::numeric,
    (line ->> 'quantity')::integer
  from jsonb_array_elements(v_quote -> 'items') as line;

  update public.products p
  set stock = p.stock - c.quantity
  from public.cart_items c
  where c.user_id = v_user_id and c.product_id = p.id;

  if v_code is not null then
    update public.coupons set used_count = used_count + 1 where code = v_code;
  end if;

  delete from public.cart_items where user_id = v_user_id;

  return jsonb_build_object('order_id', v_order.id, 'order_number', v_order.order_number);
end;
$$;

revoke execute on function public.place_order(text, jsonb, text, text, text) from public, anon;
grant execute on function public.place_order(text, jsonb, text, text, text) to authenticated;
