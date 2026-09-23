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

alter table public.reviewer_consensus add column if not exists room_notes jsonb not null default '{}'::jsonb;

grant usage on schema public to anon, authenticated, service_role;
grant select on table public.reviewer_consensus to anon, authenticated, service_role;
grant all on table public.bookings to service_role;
grant all on table public.travellers to service_role;
grant all on table public.payment_events to service_role;
grant all on table public.reviewer_consensus to service_role;
grant usage, select on all sequences in schema public to service_role;

create unique index if not exists payment_events_payment_id_uidx
  on public.payment_events (payment_id)
  where payment_id is not null;

create table if not exists public.saved_stays (
  user_id text not null,
  package_id text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, package_id)
);
create index if not exists saved_stays_user_id_idx on public.saved_stays (user_id);
alter table public.saved_stays enable row level security;
drop policy if exists "block_client_saved_stays" on public.saved_stays;
create policy "block_client_saved_stays"
  on public.saved_stays for all to anon, authenticated
  using (false) with check (false);

create table if not exists public.profiles (
  user_id text primary key,
  display_name text,
  email text,
  phone text,
  updated_at timestamptz not null default now()
);
alter table public.profiles enable row level security;
drop policy if exists "block_client_profiles" on public.profiles;
create policy "block_client_profiles"
  on public.profiles for all to anon, authenticated
  using (false) with check (false);

grant all on table public.profiles to service_role;
grant all on table public.saved_stays to service_role;

-- Writes go through public.tw_apply (gated RPC). Do not grant table writes to anon.
create or replace function public.tw_apply(p_gate text, p_op text, p_payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  -- No shared password. The publishable key cannot execute this function.
  uid text;
  rec jsonb;
  rec_id bigint;
begin
  if coalesce(auth.role(), '') is distinct from 'service_role'
     and session_user not in ('postgres', 'supabase_admin') then
    raise exception 'forbidden';
  end if;

  uid := p_payload->>'user_id';

  if p_op = 'list_bookings' then
    return coalesce((
      select jsonb_agg(to_jsonb(b) order by b.created_at desc)
      from public.bookings b
      where b.user_id = uid
    ), '[]'::jsonb);

  elsif p_op = 'insert_booking' then
    insert into public.bookings (
      user_id, package_id, package_name, nights, travelers, check_in,
      amount_inr, swaps, status, card_last4, card_brand, payer_name,
      confirmation_code, payment_method, payment_ref, upi_handle, bank_name
    ) values (
      uid,
      p_payload->>'package_id',
      p_payload->>'package_name',
      (p_payload->>'nights')::int,
      (p_payload->>'travelers')::int,
      (p_payload->>'check_in')::date,
      (p_payload->>'amount_inr')::int,
      coalesce(p_payload->'swaps', '{}'::jsonb),
      coalesce(p_payload->>'status', 'paid'),
      p_payload->>'card_last4',
      p_payload->>'card_brand',
      p_payload->>'payer_name',
      p_payload->>'confirmation_code',
      p_payload->>'payment_method',
      p_payload->>'payment_ref',
      p_payload->>'upi_handle',
      p_payload->>'bank_name'
    )
    returning to_jsonb(bookings.*) into rec;
    return rec;

  elsif p_op = 'cancel_booking' then
    update public.bookings
      set status = coalesce(nullif(p_payload->>'status', ''), 'refunded'),
          swaps = case
            when p_payload ? 'swaps' and p_payload->'swaps' is not null
              then p_payload->'swaps'
            else swaps
          end
      where id = (p_payload->>'id')::bigint
        and user_id = uid
        and status in ('paid', 'held')
      returning to_jsonb(bookings.*) into rec;
    return rec;

  elsif p_op = 'insert_payment_event' then
    insert into public.payment_events (
      user_id, booking_id, provider, event_type, order_id, payment_id, payload
    ) values (
      uid,
      nullif(p_payload->>'booking_id', '')::bigint,
      coalesce(p_payload->>'provider', 'razorpay'),
      p_payload->>'event_type',
      p_payload->>'order_id',
      p_payload->>'payment_id',
      coalesce(p_payload->'payload', '{}'::jsonb)
    )
    returning to_jsonb(payment_events.*) into rec;
    return rec;

  elsif p_op = 'toggle_saved' then
    if coalesce((p_payload->>'on')::boolean, false) then
      insert into public.saved_stays (user_id, package_id)
      values (uid, p_payload->>'package_id')
      on conflict do nothing;
      return jsonb_build_object('on', true);
    else
      delete from public.saved_stays
      where user_id = uid and package_id = p_payload->>'package_id';
      return jsonb_build_object('on', false);
    end if;

  elsif p_op = 'list_saved' then
    return coalesce((
      select jsonb_agg(package_id order by created_at desc)
      from public.saved_stays
      where user_id = uid
    ), '[]'::jsonb);

  elsif p_op = 'save_travellers' then
    rec_id := nullif(p_payload->>'booking_id', '')::bigint;
    delete from public.travellers
      where user_id = uid
        and (rec_id is null or booking_id = rec_id);
    insert into public.travellers (
      user_id, booking_id, full_name, phone, email, nationality, id_type,
      id_last4, emergency_name, emergency_phone, digiyatra_status, expires_at
    )
    select
      uid,
      rec_id,
      t->>'full_name',
      coalesce(t->>'phone', ''),
      coalesce(t->>'email', ''),
      t->>'nationality',
      t->>'id_type',
      t->>'id_last4',
      t->>'emergency_name',
      t->>'emergency_phone',
      t->>'digiyatra_status',
      nullif(t->>'expires_at', '')::timestamptz
    from jsonb_array_elements(coalesce(p_payload->'travelers', '[]'::jsonb)) as t;
    return jsonb_build_object('ok', true);

  elsif p_op = 'list_travellers' then
    delete from public.travellers
      where user_id = uid and expires_at is not null and expires_at < now();
    return coalesce((
      select jsonb_agg(to_jsonb(t) order by t.created_at desc)
      from public.travellers t
      where t.user_id = uid
    ), '[]'::jsonb);

  elsif p_op = 'get_profile' then
    select to_jsonb(p) into rec from public.profiles p where p.user_id = uid;
    return rec;

  elsif p_op = 'upsert_profile' then
    insert into public.profiles (user_id, display_name, email, phone, updated_at)
    values (
      uid,
      p_payload->>'display_name',
      nullif(p_payload->>'email', ''),
      p_payload->>'phone',
      now()
    )
    on conflict (user_id) do update set
      display_name = excluded.display_name,
      email = coalesce(excluded.email, public.profiles.email),
      phone = excluded.phone,
      updated_at = now()
    returning to_jsonb(profiles.*) into rec;
    return rec;

  elsif p_op = 'upsert_consensus' then
    insert into public.reviewer_consensus (
      package_id, overall_sentiment, key_positives, key_negatives, caveats,
      consensus_summary, sources, origin, video_hash, updated_at, room_notes
    ) values (
      p_payload->>'package_id',
      p_payload->>'overall_sentiment',
      coalesce(p_payload->'key_positives', '[]'::jsonb),
      coalesce(p_payload->'key_negatives', '[]'::jsonb),
      coalesce(p_payload->'caveats', '[]'::jsonb),
      coalesce(p_payload->>'consensus_summary', ''),
      coalesce(p_payload->'sources', '[]'::jsonb),
      coalesce(p_payload->>'origin', 'live'),
      p_payload->>'video_hash',
      coalesce(nullif(p_payload->>'updated_at', '')::timestamptz, now()),
      coalesce(p_payload->'room_notes', '{}'::jsonb)
    )
    on conflict (package_id) do update set
      overall_sentiment = excluded.overall_sentiment,
      key_positives = excluded.key_positives,
      key_negatives = excluded.key_negatives,
      caveats = excluded.caveats,
      consensus_summary = excluded.consensus_summary,
      sources = excluded.sources,
      origin = excluded.origin,
      video_hash = excluded.video_hash,
      updated_at = excluded.updated_at,
      room_notes = excluded.room_notes
    returning to_jsonb(reviewer_consensus.*) into rec;
    return rec;
  end if;

  raise exception 'unknown op %', p_op;
end;
$$;

revoke all on function public.tw_apply(text, text, jsonb) from public;
revoke all on function public.tw_apply(text, text, jsonb) from anon, authenticated;
grant execute on function public.tw_apply(text, text, jsonb) to service_role;


