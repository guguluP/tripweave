-- public.profiles lives in the Supabase schema (supabase/schema.sql), not in migrations/.
-- Guard so the local PGLite fallback (which has no profiles table) can still boot.
do $$
begin
  if to_regclass('public.profiles') is not null then
    alter table public.profiles add column if not exists home_city text;
    alter table public.profiles add column if not exists whatsapp_opt_in boolean not null default false;
  end if;
end
$$;
