-- Home page hero slider: up to six slides managed from /admin/homepage.
--
-- Adds one table and one new permission, content.manage. No existing policy is relaxed and
-- no existing grant is removed: role_permissions is recreated only to add the new permission
-- to super_admin, admin and manager.

-- ---------------------------------------------------------------------------
-- content.manage
-- ---------------------------------------------------------------------------

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
      'security.view', 'content.manage'
    ]
    when 'admin' then array[
      'dashboard.view', 'revenue.view', 'catalog.view', 'catalog.manage', 'inventory.manage',
      'orders.view', 'orders.manage', 'orders.cancel', 'customers.view', 'coupons.manage',
      'reviews.manage', 'analytics.view', 'payments.view', 'staff.manage', 'settings.manage',
      'security.view', 'content.manage'
    ]
    when 'manager' then array[
      'dashboard.view', 'revenue.view', 'catalog.view', 'catalog.manage', 'inventory.manage',
      'orders.view', 'orders.manage', 'orders.cancel', 'customers.view', 'coupons.manage',
      'reviews.manage', 'analytics.view', 'payments.view', 'staff.manage', 'content.manage'
    ]
    when 'staff' then array[
      'dashboard.view', 'catalog.view', 'inventory.manage', 'orders.view', 'orders.manage',
      'customers.view'
    ]
    else array[]::text[]
  end;
$$;

-- ---------------------------------------------------------------------------
-- The slides
-- ---------------------------------------------------------------------------

-- A hero button may only point at a path on this site or at an https address. Anything else —
-- javascript:, data:, //evil.example — is refused here as well as in the app, so a bypassed
-- form can't put a dangerous link on the home page.
create or replace function public.is_safe_link(p_url text)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select p_url ~ '^/([^/\s]\S*)?$' or p_url ~ '^https://[^\s/]+(/\S*)?$';
$$;

create table public.home_hero_slides (
  id bigint generated always as identity primary key,
  image_url text not null check (char_length(image_url) between 1 and 1000),
  -- Empty is allowed: a purely decorative hero image is better described by the heading.
  image_alt text not null default '' check (char_length(image_alt) <= 160),
  title text not null check (char_length(btrim(title)) between 1 and 80),
  subtitle text not null default '' check (char_length(subtitle) <= 200),
  button_text text not null default 'Know More' check (char_length(btrim(button_text)) between 1 and 30),
  button_url text not null default '/shop' check (public.is_safe_link(button_url)),
  sort_order integer not null check (sort_order between 1 and 6),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.home_hero_slides is
  'Home page hero slides, at most six including inactive ones. Public readers see active slides only.';

create index home_hero_slides_order_idx on public.home_hero_slides (sort_order, id);

create trigger home_hero_slides_set_updated_at
  before update on public.home_hero_slides
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Six slides, numbered 1..n with no gaps
-- ---------------------------------------------------------------------------

-- Places a new slide last and refuses the seventh. Inactive slides count towards the six.
create function public.home_hero_slides_before_insert()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_count integer;
begin
  -- Serialises concurrent inserts, so two admins can't both slip in a sixth slide.
  lock table public.home_hero_slides in exclusive mode;

  select count(*) into v_count from public.home_hero_slides;
  if v_count >= 6 then
    raise exception 'too_many_slides';
  end if;

  select coalesce(max(sort_order), 0) + 1 into new.sort_order from public.home_hero_slides;
  return new;
end;
$$;

create trigger home_hero_slides_before_insert
  before insert on public.home_hero_slides
  for each row execute function public.home_hero_slides_before_insert();

-- Closes the gap a deletion leaves, so the remaining slides stay 1..n.
create function public.home_hero_slides_after_delete()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.home_hero_slides s
  set sort_order = ranked.position
  from (
    select id, row_number() over (order by sort_order, id) as position
    from public.home_hero_slides
  ) ranked
  where s.id = ranked.id and s.sort_order <> ranked.position;
  return null;
end;
$$;

create trigger home_hero_slides_after_delete
  after delete on public.home_hero_slides
  for each statement execute function public.home_hero_slides_after_delete();

-- Rewrites the whole order in one statement from the list the admin panel sends. Every slide
-- must appear exactly once, so a stale page can't drop or duplicate one.
create function public.reorder_home_hero_slides(p_ids bigint[])
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_total integer;
begin
  if not (select public.has_permission('content.manage')) then
    raise exception 'not_authorized';
  end if;

  if p_ids is null or array_length(p_ids, 1) is null then
    raise exception 'invalid_order';
  end if;

  select count(*) into v_total from public.home_hero_slides;

  if array_length(p_ids, 1) <> v_total
    or (select count(distinct id) from unnest(p_ids) as id) <> v_total
    or exists (select 1 from unnest(p_ids) as id where id not in (select s.id from public.home_hero_slides s)) then
    raise exception 'invalid_order';
  end if;

  update public.home_hero_slides s
  set sort_order = ordered.position
  from (select id, ordinality as position from unnest(p_ids) with ordinality as t(id, ordinality)) ordered
  where s.id = ordered.id and s.sort_order <> ordered.position;
end;
$$;

revoke execute on function public.reorder_home_hero_slides(bigint[]) from public, anon;
grant execute on function public.reorder_home_hero_slides(bigint[]) to authenticated;

-- ---------------------------------------------------------------------------
-- Row level security
-- ---------------------------------------------------------------------------

alter table public.home_hero_slides enable row level security;

-- Visitors and customers see active slides only; inactive drafts never leave the admin panel.
create policy "Active hero slides are public"
  on public.home_hero_slides for select
  to anon, authenticated
  using (is_active or (select public.has_permission('content.manage')));

create policy "Content managers can add hero slides"
  on public.home_hero_slides for insert
  to authenticated
  with check ((select public.has_permission('content.manage')));

create policy "Content managers can edit hero slides"
  on public.home_hero_slides for update
  to authenticated
  using ((select public.has_permission('content.manage')))
  with check ((select public.has_permission('content.manage')));

create policy "Content managers can delete hero slides"
  on public.home_hero_slides for delete
  to authenticated
  using ((select public.has_permission('content.manage')));
