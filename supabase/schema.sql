-- TripWeave schema for Supabase (Postgres)
-- Run in SQL Editor. If you already ran an earlier text-id draft, drop those
-- tables first — this app uses bigint identity ids matching the code.
--
-- Retention: bookings + payment_events are long-lived.
-- travellers hold stay-only guest data (last-4 of ID, expires_at). Full ID
-- numbers and DigiLocker documents are never stored.

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
    check (status in ('paid', 'cancelled', 'pending', 'failed', 'held', 'completed', 'refunded')),
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
  booking_id bigint references public.bookings (id) on delete cascade,
  full_name text not null,
  phone text not null default '',
  email text not null default '',
  nationality text,
  id_type text,
  id_last4 text,
  id_number text,
  emergency_name text,
  emergency_phone text,
  digiyatra_status text,
  expires_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.travellers add column if not exists id_last4 text;
alter table public.travellers add column if not exists expires_at timestamptz;
alter table public.travellers add column if not exists digiyatra_status text;

create index if not exists travellers_user_id_idx on public.travellers (user_id);
create index if not exists travellers_booking_id_idx on public.travellers (booking_id);
create index if not exists travellers_expires_at_idx on public.travellers (expires_at);

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

-- Hybrid: Better Auth on the server uses the secret key (bypasses RLS).
-- Browser publishable key must not read or write these tables.

drop policy if exists "bookings_select_own" on public.bookings;
drop policy if exists "bookings_insert_own" on public.bookings;
drop policy if exists "bookings_update_own" on public.bookings;
drop policy if exists "travellers_select_own" on public.travellers;
drop policy if exists "travellers_insert_own" on public.travellers;
drop policy if exists "travellers_update_own" on public.travellers;
drop policy if exists "payment_events_no_client" on public.payment_events;
drop policy if exists "block client bookings" on public.bookings;
drop policy if exists "block client travellers" on public.travellers;
drop policy if exists "block client payments" on public.payment_events;
drop policy if exists "block anon bookings" on public.bookings;
drop policy if exists "block anon travellers" on public.travellers;
drop policy if exists "block anon payments" on public.payments;

drop policy if exists "block_client_bookings" on public.bookings;
create policy "block_client_bookings"
  on public.bookings for all to anon, authenticated
  using (false) with check (false);

drop policy if exists "block_client_travellers" on public.travellers;
create policy "block_client_travellers"
  on public.travellers for all to anon, authenticated
  using (false) with check (false);

drop policy if exists "block_client_payment_events" on public.payment_events;
create policy "block_client_payment_events"
  on public.payment_events for all to anon, authenticated
  using (false) with check (false);

comment on table public.bookings is 'Long-lived stays. user_id = Better Auth subject.';
comment on table public.travellers is 'Stay-only guests. Last-4 of ID. Delete when expires_at passes. Never store DigiLocker files.';
comment on column public.travellers.id_number is 'Deprecated. App writes null. Use id_last4.';
comment on table public.payment_events is 'Provider ids only. No card PAN.';

-- Reviewer consensus: world-readable cache of YouTube stay-review summaries.
-- Writes go through the service role from the server. No user_id — unowned public data.
create table if not exists public.reviewer_consensus (
  package_id text primary key,
  overall_sentiment text not null
    check (overall_sentiment in ('positive', 'mixed', 'negative')),
  key_positives jsonb not null default '[]'::jsonb,
  key_negatives jsonb not null default '[]'::jsonb,
  caveats jsonb not null default '[]'::jsonb,
  consensus_summary text not null default '',
  sources jsonb not null default '[]'::jsonb,
  origin text not null default 'seed'
    check (origin in ('seed', 'live', 'empty')),
  video_hash text,
  updated_at timestamptz not null default now()
);

alter table public.reviewer_consensus enable row level security;

drop policy if exists "reviewer_consensus_public_read" on public.reviewer_consensus;
create policy "reviewer_consensus_public_read"
  on public.reviewer_consensus for select
  using (true);

drop policy if exists "reviewer_consensus_no_client_write" on public.reviewer_consensus;
create policy "reviewer_consensus_no_client_write"
  on public.reviewer_consensus for insert to anon, authenticated
  with check (false);

drop policy if exists "reviewer_consensus_no_client_update" on public.reviewer_consensus;
create policy "reviewer_consensus_no_client_update"
  on public.reviewer_consensus for update to anon, authenticated
  using (false) with check (false);

drop policy if exists "reviewer_consensus_no_client_delete" on public.reviewer_consensus;
create policy "reviewer_consensus_no_client_delete"
  on public.reviewer_consensus for delete to anon, authenticated
  using (false);

comment on table public.reviewer_consensus is 'Cached YouTube reviewer consensus per stay. Public read. Server writes via service role.';
