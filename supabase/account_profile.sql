-- Home city and WhatsApp preference on the account profile. Safe to re-run.

alter table public.profiles add column if not exists home_city text;
alter table public.profiles add column if not exists whatsapp_opt_in boolean not null default false;

notify pgrst, 'reload schema';
