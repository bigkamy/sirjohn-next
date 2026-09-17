-- Profile photos: customers can upload one from /account/profile, and it appears in the
-- header band and the account sidebar. Apply after 20260920000000_remove_sample_products.sql.

alter table public.profiles
  add column avatar_url text;

comment on column public.profiles.avatar_url is
  'Public URL of the profile photo in the avatars bucket. Null shows the customer''s initials instead.';

-- Customers may edit their own photo, exactly as they may edit their name and phone. The
-- blanket update grant stays revoked (see 20260911000000_init.sql), so naming the column
-- here is what keeps role out of reach: nobody can promote themselves.
grant update (avatar_url) on public.profiles to authenticated;

-- ---------------------------------------------------------------------------
-- Avatars bucket. Public read, because the header shows the photo by URL on pages that are
-- statically generated. Writes are confined to a folder named after the customer's own user
-- id, so one customer can never overwrite or delete another's photo.
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', true, 2097152, array['image/jpeg', 'image/png', 'image/webp', 'image/avif'])
on conflict (id) do nothing;

create policy "Avatars are public"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'avatars');

create policy "Customers can upload their own avatar"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "Customers can replace their own avatar"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  )
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "Customers can delete their own avatar"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
