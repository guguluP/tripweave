alter table public.profiles add column if not exists home_city text;
alter table public.profiles add column if not exists whatsapp_opt_in boolean not null default false;
