-- Supabase SQL Editor. Apply after creating the project; independent of vector schema.
-- auth.users owns email/phone and their verified timestamps.
create table if not exists public.profiles (
 id uuid primary key references auth.users(id) on delete cascade,
 first_name text not null check (length(trim(first_name)) between 1 and 60),
 last_name text not null check (length(trim(last_name)) between 1 and 60),
 city text not null check (length(trim(city)) between 2 and 100),
 age integer not null check (age between 1 and 120),
 -- Requested phone, compared with the authoritative Auth phone at completion.
 phone text not null check (phone ~ '^\+[1-9][0-9]{7,14}$'),
 locale text not null default 'he' check (locale in ('he','en')),
 created_at timestamptz not null default now()
);
comment on column public.profiles.age is 'Self-reported age at profile creation or last edit; not date of birth.';
alter table public.profiles enable row level security;
revoke all on public.profiles from anon, authenticated;
grant select on public.profiles to authenticated;
grant insert (id,first_name,last_name,city,age,phone,locale) on public.profiles to authenticated;
grant update (first_name,last_name,city,age,phone,locale) on public.profiles to authenticated;
drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own on public.profiles for select to authenticated using ((select auth.uid())=id);
drop policy if exists profiles_insert_own on public.profiles;
create policy profiles_insert_own on public.profiles for insert to authenticated with check ((select auth.uid())=id);
drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles for update to authenticated using ((select auth.uid())=id) with check ((select auth.uid())=id);
-- No client-writable verified, role or completed flags. No public profile directory.
-- Phone change confirmation MUST stay enabled in Supabase Auth.
