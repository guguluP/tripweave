-- A fresh database (local PGLite, a new DATABASE_URL) has no profiles table yet:
-- it was only ever created by supabase/schema.sql. Create it first so this file applies.
create table if not exists public.profiles (
  user_id text primary key,
  display_name text,
  email text,
  phone text,
  updated_at timestamptz not null default now()
);
alter table public.profiles add column if not exists home_city text;
alter table public.profiles add column if not exists whatsapp_opt_in boolean not null default false;
