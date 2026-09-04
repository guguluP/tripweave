-- TripWeave schema for Supabase (Postgres)
-- Run in Supabase SQL Editor: Project → SQL → New query → paste → Run
--
-- Auth note: TripWeave currently uses Better Auth user ids (text).
-- user_id is text so it works with Better Auth OR Supabase Auth uuids.
-- Service role on the server filters by user_id; RLS is ready if you later
-- migrate to Supabase Auth (auth.uid()::text = user_id).

create extension if not exists "pgcrypto";

create table if not exists public.bookings (
  id bigint generated always as identity primary key,
  user_id text not null,
  package_id text not null,
  package_name text not null,
  nights int not null check (nights > 0),
  travelers int not null check (travelers > 0),
  check_in date not null,
  amount_inr int not null check (amount_inr >= 0),
  swaps jsonb not null default '{}'::jsonb,
  status text not null default 'paid'
    check (status in ('paid', 'cancelled', 'pending', 'failed')),
  card_last4 text,
  card_brand text,
  payer_name text not null,
  confirmation_code text not null unique,
  payment_method text,
  payment_ref text,
  upi_handle text,
  bank_name text,
  created_at timestamptz not null default now()
);

create index if not exists bookings_user_id_idx on public.bookings (user_id);
create index if not exists bookings_created_at_idx on public.bookings (created_at desc);

create table if not exists public.travellers (
  id bigint generated always as identity primary key,
  user_id text not null,
  booking_id bigint references public.bookings (id) on delete set null,
  full_name text not null,
  phone text not null default '',
  email text not null default '',
  date_of_birth date,
  gender text,
  nationality text,
  id_type text,
  id_number text,
  special_requests text,
  emergency_name text,
  emergency_phone text,
  identity_source text default 'manual',
  created_at timestamptz not null default now()
);

create index if not exists travellers_user_id_idx on public.travellers (user_id);
create index if not exists travellers_booking_id_idx on public.travellers (booking_id);

create table if not exists public.payment_events (
  id bigint generated always as identity primary key,
  user_id text,
  booking_id bigint references public.bookings (id) on delete set null,
  provider text not null default 'razorpay',
  event_type text not null,
  order_id text,
  payment_id text,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists payment_events_order_id_idx on public.payment_events (order_id);

alter table public.bookings enable row level security;
alter table public.travellers enable row level security;
alter table public.payment_events enable row level security;

drop policy if exists "bookings_select_own" on public.bookings;
create policy "bookings_select_own" on public.bookings
  for select using (
    auth.uid() is not null and auth.uid()::text = user_id
  );

drop policy if exists "bookings_insert_own" on public.bookings;
create policy "bookings_insert_own" on public.bookings
  for insert with check (
    auth.uid() is not null and auth.uid()::text = user_id
  );

drop policy if exists "bookings_update_own" on public.bookings;
create policy "bookings_update_own" on public.bookings
  for update using (
    auth.uid() is not null and auth.uid()::text = user_id
  );

drop policy if exists "travellers_select_own" on public.travellers;
create policy "travellers_select_own" on public.travellers
  for select using (
    auth.uid() is not null and auth.uid()::text = user_id
  );

drop policy if exists "travellers_insert_own" on public.travellers;
create policy "travellers_insert_own" on public.travellers
  for insert with check (
    auth.uid() is not null and auth.uid()::text = user_id
  );

drop policy if exists "travellers_update_own" on public.travellers;
create policy "travellers_update_own" on public.travellers
  for update using (
    auth.uid() is not null and auth.uid()::text = user_id
  );

drop policy if exists "payment_events_no_client" on public.payment_events;
create policy "payment_events_no_client" on public.payment_events
  for all using (false);

comment on table public.bookings is 'TripWeave hotel bookings; user_id = Better Auth or Supabase Auth subject';
comment on table public.travellers is 'Guest details captured before payment';
comment on table public.payment_events is 'Razorpay (and future) payment audit log';
