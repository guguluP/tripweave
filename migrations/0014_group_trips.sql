-- Group pilgrimage trips. Paste in the Supabase SQL editor. Safe to re-run.
-- tw_group locks the trip row and refuses a stale version.
-- The transition guards are src/lib/group/engine.ts, applied to that version
-- and retried when the version moved. Clients cannot read these tables.

create table if not exists public.group_trips (
  id uuid primary key,
  share_token_hash text unique not null,
  organiser_user_id text not null,
  status text not null,
  check_in date not null,
  pay_deadline_at timestamptz,
  desk_deadline_at timestamptz,
  locked_package_id text,
  version int not null default 0,
  doc jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists group_trips_organiser_idx on public.group_trips (organiser_user_id);
create index if not exists group_trips_collecting_idx
  on public.group_trips (status, pay_deadline_at) where status = 'collecting';
create index if not exists group_trips_desk_idx
  on public.group_trips (status, desk_deadline_at) where status = 'fully_paid_awaiting_hotel';

create table if not exists public.group_members (
  id uuid primary key,
  trip_id uuid not null references public.group_trips (id) on delete cascade,
  display_name text not null,
  phone_e164 text,
  phone_hash text,
  is_organiser boolean not null default false,
  is_elderly boolean not null default false,
  needs text[] not null default '{}',
  family_label text,
  whatsapp_opt_in boolean not null default false,
  consent_at timestamptz,
  left_at timestamptz
);

create table if not exists public.group_votes (
  trip_id uuid not null references public.group_trips (id) on delete cascade,
  member_id uuid not null,
  package_id text not null,
  note text not null default '',
  primary key (trip_id, member_id)
);

create table if not exists public.group_shares (
  id uuid primary key,
  trip_id uuid not null references public.group_trips (id) on delete cascade,
  member_id uuid not null,
  amount_inr int not null,
  status text not null,
  razorpay_link_id text,
  razorpay_short_url text
);

create table if not exists public.group_payments (
  id uuid primary key,
  trip_id uuid not null references public.group_trips (id) on delete cascade,
  share_id uuid,
  member_id text,
  razorpay_payment_id text unique not null,
  amount_inr int not null,
  method text,
  late boolean not null default false
);

create table if not exists public.group_refunds (
  id uuid primary key,
  trip_id uuid not null references public.group_trips (id) on delete cascade,
  payment_id uuid,
  razorpay_payment_id text not null,
  amount_inr int not null,
  reason text not null,
  status text not null
);

create table if not exists public.group_events (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.group_trips (id) on delete cascade,
  kind text not null,
  version int not null,
  created_at timestamptz not null default now()
);

create table if not exists public.group_otp (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.group_trips (id) on delete cascade,
  phone_hash text not null,
  sent_at timestamptz not null default now()
);

do $$ begin
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'bookings') then
    alter table public.bookings add column if not exists group_trip_id text;
    create index if not exists bookings_group_trip_idx on public.bookings (group_trip_id) where group_trip_id is not null;
  end if;
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'room_holds') then
    alter table public.room_holds add column if not exists group_trip_id text;
  end if;
end $$;

alter table public.group_trips enable row level security;
alter table public.group_members enable row level security;
alter table public.group_votes enable row level security;
alter table public.group_shares enable row level security;
alter table public.group_payments enable row level security;
alter table public.group_refunds enable row level security;
alter table public.group_events enable row level security;
alter table public.group_otp enable row level security;

do $$
declare t text;
begin
  if exists (select 1 from pg_roles where rolname = 'anon') then
    foreach t in array array['group_trips','group_members','group_votes','group_shares','group_payments','group_refunds','group_events','group_otp']
    loop
      execute format('drop policy if exists block_client_%s on public.%I', t, t);
      execute format('create policy block_client_%s on public.%I for all to anon, authenticated using (false) with check (false)', t, t);
      execute format('revoke all on public.%I from public, anon, authenticated', t);
      execute format('grant all on public.%I to service_role', t);
    end loop;
  end if;
end $$;

create or replace function public.tw_group(p_gate text, p_op text, p_payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  role text := 'service_role';
  rec public.group_trips%rowtype;
  body jsonb;
  expected int;
  written int;
begin
  begin
    role := coalesce(auth.role(), '');
  exception when undefined_function or invalid_schema_name then
    role := 'service_role';
  end;
  if role is distinct from 'service_role' and session_user not in ('postgres', 'supabase_admin') then
    raise exception 'forbidden';
  end if;

  if p_op = 'load' then
    if nullif(p_payload->>'token_hash', '') is not null then
      select * into rec from public.group_trips where share_token_hash = p_payload->>'token_hash';
    elsif nullif(p_payload->>'trip_id', '') is not null then
      select * into rec from public.group_trips where id = (p_payload->>'trip_id')::uuid;
    end if;
    if rec.id is null then return jsonb_build_object('ok', false, 'error', 'missing'); end if;
    return jsonb_build_object('ok', true, 'doc', rec.doc);
  end if;

  if p_op = 'list_organiser' then
    return coalesce((
      select jsonb_agg(jsonb_build_object(
        'tripId', id, 'title', group_trips.doc->'trip'->>'title', 'status', status,
        'checkIn', check_in, 'nights', (group_trips.doc->'trip'->>'nights')::int, 'version', version
      ) order by created_at desc)
      from public.group_trips
      where organiser_user_id = p_payload->>'organiser_user_id'
    ), '[]'::jsonb);
  end if;

  if p_op = 'list_desk' then
    return coalesce((
      select jsonb_agg(group_trips.doc order by updated_at desc)
      from public.group_trips
      where locked_package_id = p_payload->>'package_id'
        and status in ('fully_paid_awaiting_hotel', 'hotel_confirmed')
    ), '[]'::jsonb);
  end if;

  if p_op = 'list_due' then
    return coalesce((
      select jsonb_agg(group_trips.doc)
      from public.group_trips
      where status in ('collecting', 'fully_paid_awaiting_hotel', 'hotel_confirmed')
    ), '[]'::jsonb);
  end if;

  if p_op = 'list_refunds' then
    return coalesce((
      select jsonb_agg(jsonb_build_object('tripId', trip_id, 'refund', to_jsonb(r)))
      from public.group_refunds r
      where status = 'pending'
    ), '[]'::jsonb);
  end if;

  if p_op = 'create' then
    body := p_payload->'doc';
    insert into public.group_trips (
      id, share_token_hash, organiser_user_id, status, check_in, version, doc
    ) values (
      (body->'trip'->>'id')::uuid,
      body->'trip'->>'shareTokenHash',
      body->'trip'->>'organiserUserId',
      body->'trip'->>'status',
      (body->'trip'->>'checkIn')::date,
      coalesce((body->'trip'->>'version')::int, 0),
      body
    );
    return jsonb_build_object('ok', true, 'doc', body);
  end if;

  if p_op = 'save' then
    expected := (p_payload->>'expected_version')::int;
    body := p_payload->'doc';
    select * into rec from public.group_trips where id = (body->'trip'->>'id')::uuid for update;
    if rec.id is null then return jsonb_build_object('ok', false, 'error', 'missing'); end if;
    if rec.version is distinct from expected then
      return jsonb_build_object('ok', false, 'error', 'version', 'version', rec.version, 'doc', rec.doc);
    end if;
    update public.group_trips set
      status = body->'trip'->>'status',
      check_in = (body->'trip'->>'checkIn')::date,
      pay_deadline_at = nullif(body->'trip'->>'payDeadlineAt', '')::timestamptz,
      desk_deadline_at = nullif(body->'trip'->>'deskDeadlineAt', '')::timestamptz,
      locked_package_id = nullif(body->'trip'->>'lockedPackageId', ''),
      version = (body->'trip'->>'version')::int,
      doc = body,
      updated_at = now()
    where id = rec.id;
    get diagnostics written = row_count;
    if written <> 1 then return jsonb_build_object('ok', false, 'error', 'version', 'version', rec.version); end if;

    delete from public.group_members where trip_id = rec.id;
    insert into public.group_members (id, trip_id, display_name, phone_e164, phone_hash, is_organiser, is_elderly, needs, family_label, whatsapp_opt_in, consent_at, left_at)
    select (m->>'id')::uuid, rec.id, m->>'displayName', nullif(m->>'phoneE164',''), nullif(m->>'phoneHash',''),
      coalesce((m->>'isOrganiser')::boolean, false), coalesce((m->>'isElderly')::boolean, false),
      coalesce((select array_agg(value) from jsonb_array_elements_text(coalesce(m->'needs','[]'::jsonb)) as value), '{}'),
      nullif(m->>'familyLabel',''), coalesce((m->>'whatsappOptIn')::boolean, false),
      nullif(m->>'consentAt','')::timestamptz, nullif(m->>'leftAt','')::timestamptz
    from jsonb_array_elements(coalesce(body->'members','[]'::jsonb)) m;

    delete from public.group_votes where trip_id = rec.id;
    insert into public.group_votes (trip_id, member_id, package_id, note)
    select rec.id, (v->>'memberId')::uuid, v->>'packageId', coalesce(v->>'note','')
    from jsonb_array_elements(coalesce(body->'votes','[]'::jsonb)) v;

    delete from public.group_shares where trip_id = rec.id;
    insert into public.group_shares (id, trip_id, member_id, amount_inr, status, razorpay_link_id, razorpay_short_url)
    select (s->>'id')::uuid, rec.id, (s->>'memberId')::uuid, (s->>'amountInr')::int, s->>'status',
      nullif(s->>'razorpayLinkId',''), nullif(s->>'razorpayShortUrl','')
    from jsonb_array_elements(coalesce(body->'shares','[]'::jsonb)) s;

    delete from public.group_payments where trip_id = rec.id;
    insert into public.group_payments (id, trip_id, share_id, member_id, razorpay_payment_id, amount_inr, method, late)
    select (p->>'id')::uuid, rec.id, nullif(p->>'shareId','')::uuid, p->>'memberId', p->>'razorpayPaymentId',
      (p->>'amountInr')::int, p->>'method', coalesce((p->>'late')::boolean, false)
    from jsonb_array_elements(coalesce(body->'payments','[]'::jsonb)) p;

    delete from public.group_refunds where trip_id = rec.id;
    insert into public.group_refunds (id, trip_id, payment_id, razorpay_payment_id, amount_inr, reason, status)
    select (r->>'id')::uuid, rec.id, nullif(r->>'paymentId','')::uuid, r->>'razorpayPaymentId',
      (r->>'amountInr')::int, r->>'reason', r->>'status'
    from jsonb_array_elements(coalesce(body->'refunds','[]'::jsonb)) r;

    if nullif(p_payload->>'event','') is not null then
      insert into public.group_events (trip_id, kind, version)
      values (rec.id, p_payload->>'event', (body->'trip'->>'version')::int);
    end if;
    return jsonb_build_object('ok', true, 'doc', body);
  end if;

  return jsonb_build_object('ok', false, 'error', 'unknown_op');
end;
$$;

do $$ begin
  if exists (select 1 from pg_roles where rolname = 'anon') then
    revoke all on function public.tw_group(text, text, jsonb) from public, anon, authenticated;
    grant execute on function public.tw_group(text, text, jsonb) to service_role;
  end if;
end $$;

notify pgrst, 'reload schema';
