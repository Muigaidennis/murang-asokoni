-- Murang'a Sokoni marketplace baseline.
-- Run in the Supabase SQL Editor before using seller registration/listing features.

create extension if not exists pgcrypto;

create table if not exists public.listings (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid references auth.users(id) on delete cascade,
  seller_name text not null default '',
  contact_phone text not null default '',
  title text not null,
  category text not null,
  price numeric(12, 2) not null default 0 check (price >= 0),
  description text not null default '',
  location text not null,
  image_url text,
  created_at timestamptz not null default now()
);

-- Backfill-compatible additions for the original prototype's listings table.
alter table public.listings add column if not exists id uuid default gen_random_uuid();
alter table public.listings add column if not exists seller_id uuid references auth.users(id) on delete cascade;
alter table public.listings add column if not exists seller_name text not null default '';
alter table public.listings add column if not exists contact_phone text not null default '';
alter table public.listings add column if not exists title text not null default '';
alter table public.listings add column if not exists category text not null default '';
alter table public.listings add column if not exists price numeric(12, 2) not null default 0;
alter table public.listings add column if not exists description text not null default '';
alter table public.listings add column if not exists location text not null default '';
alter table public.listings add column if not exists image_url text;
alter table public.listings add column if not exists created_at timestamptz not null default now();

create index if not exists listings_created_at_idx on public.listings (created_at desc);
create index if not exists listings_seller_id_idx on public.listings (seller_id);
create index if not exists listings_category_location_idx on public.listings (category, location);

alter table public.listings enable row level security;
grant select on public.listings to anon, authenticated;
grant insert, update, delete on public.listings to authenticated;

-- Policies are permissive by default (OR-combined). Remove legacy rules first so
-- an old public insert/update policy cannot bypass seller ownership checks.
do $listing_policy_cleanup$
declare policy_row record;
begin
  for policy_row in
    select policyname from pg_policies
    where schemaname = 'public' and tablename = 'listings'
  loop
    execute format('drop policy %I on public.listings', policy_row.policyname);
  end loop;
end
$listing_policy_cleanup$;

create policy "Anyone can browse listings" on public.listings
  for select to anon, authenticated using (true);
create policy "Sellers can create their own listings" on public.listings
  for insert to authenticated with check (seller_id = (select auth.uid()));
create policy "Sellers can update their own listings" on public.listings
  for update to authenticated
  using (seller_id = (select auth.uid()))
  with check (seller_id = (select auth.uid()));
create policy "Sellers can delete their own listings" on public.listings
  for delete to authenticated using (seller_id = (select auth.uid()));

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('product-images', 'product-images', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set public = true, file_size_limit = 5242880,
  allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp'];

-- Remove old rules scoped to this bucket, while leaving other buckets untouched.
do $image_policy_cleanup$
declare policy_row record;
begin
  for policy_row in
    select policyname from pg_policies
    where schemaname = 'storage' and tablename = 'objects'
      and concat(coalesce(qual, ''), ' ', coalesce(with_check, '')) ilike '%product-images%'
  loop
    execute format('drop policy %I on storage.objects', policy_row.policyname);
  end loop;
end
$image_policy_cleanup$;

create policy "Anyone can view product images" on storage.objects
  for select to anon, authenticated using (bucket_id = 'product-images');
create policy "Sellers can upload their own product images" on storage.objects
  for insert to authenticated with check (
    bucket_id = 'product-images' and (storage.foldername(name))[1] = (select auth.uid())::text
  );
create policy "Sellers can update their own product images" on storage.objects
  for update to authenticated
  using (bucket_id = 'product-images' and (storage.foldername(name))[1] = (select auth.uid())::text)
  with check (bucket_id = 'product-images' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "Sellers can delete their own product images" on storage.objects
  for delete to authenticated using (
    bucket_id = 'product-images' and (storage.foldername(name))[1] = (select auth.uid())::text
  );
