-- Funnel rows written by the service role from /api/funnel.
-- Apply in the Supabase SQL editor. The app ignores a missing table.

create table if not exists public.funnel_events (
  id bigint generated always as identity primary key,
  event text not null,
  package_id text,
  created_at timestamptz not null default now()
);

alter table public.funnel_events enable row level security;
revoke all on public.funnel_events from public, anon, authenticated;
