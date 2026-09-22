-- Durable checkout holds, reconcile jobs, and refund intents.
-- A cold start reloads these rows. Room counts stay a simulated allotment.
-- Bookings.swaps is text in this schema. The Supabase copy uses jsonb.

create table if not exists room_holds (
  hold_id text primary key,
  user_id text not null,
  package_id text not null,
  room_id text not null,
  check_in date not null,
  nights integer not null check (nights between 1 and 14),
  units integer not null check (units >= 1),
  status text not null default 'held' check (status in ('held', 'released', 'converted')),
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index if not exists room_holds_live_idx
  on room_holds (package_id, room_id, check_in)
  where status = 'held';

create table if not exists payment_reconcile_jobs (
  id text primary key,
  user_id text not null,
  payment_id text not null,
  order_id text,
  attempts integer not null default 0,
  last_error text,
  payload jsonb not null,
  state text not null default 'queued' check (state in ('queued', 'done', 'failed', 'refunded')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists payment_reconcile_jobs_user_payment_idx
  on payment_reconcile_jobs (user_id, payment_id);

create index if not exists payment_reconcile_jobs_queued_idx
  on payment_reconcile_jobs (user_id, created_at)
  where state = 'queued';

create table if not exists refund_intents (
  id text primary key,
  user_id text not null,
  booking_id bigint not null,
  payment_ref text not null default '',
  amount_inr integer not null,
  status text not null check (status in ('pending', 'gateway_done', 'applied')),
  refund_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists refund_intents_user_booking_idx
  on refund_intents (user_id, booking_id);

create index if not exists bookings_package_check_in_idx
  on bookings (package_id, check_in);

create unique index if not exists bookings_payment_ref_uidx
  on bookings (payment_ref)
  where payment_ref is not null and payment_ref <> '';

alter table room_holds enable row level security;
alter table payment_reconcile_jobs enable row level security;
alter table refund_intents enable row level security;

create or replace function tw_except_ids(p_payload jsonb)
returns text[]
language sql
immutable
set search_path = public
as $$
  select coalesce(
    (
      select array_agg(value)
      from jsonb_array_elements_text(
        case
          when jsonb_typeof(p_payload->'except_hold_ids') = 'array' then p_payload->'except_hold_ids'
          else '[]'::jsonb
        end
      ) as t(value)
      where value <> ''
    ),
    array[]::text[]
  );
$$;

create or replace function tw_room_of(p_swaps text)
returns text
language sql
immutable
set search_path = public
as $$
  select coalesce(
    case
      when left(btrim(coalesce(p_swaps, '')), 1) = '{' then p_swaps::jsonb->>'roomId'
      else ''
    end,
    ''
  );
$$;

create or replace function tw_keys_taken(
  p_package text,
  p_room text,
  p_day date,
  p_except text[]
) returns integer
language sql
volatile
set search_path = public
as $$
  select coalesce((
    select count(*)::int
    from bookings b
    where b.status in ('paid', 'held')
      and b.package_id = p_package
      and tw_room_of(b.swaps) = p_room
      and b.check_in <= p_day
      and b.check_in + b.nights > p_day
  ), 0)
  +
  coalesce((
    select count(*)::int
    from room_holds h
    where h.status = 'held'
      and h.expires_at > now()
      and h.package_id = p_package
      and h.room_id = p_room
      and h.check_in <= p_day
      and h.check_in + h.nights > p_day
      and h.hold_id <> all(coalesce(p_except, array[]::text[]))
  ), 0);
$$;

create or replace function tw_reserve_hold(p_payload jsonb)
returns jsonb
language plpgsql
set search_path = public
as $$
declare
  v_units int := greatest(coalesce((p_payload->>'units')::int, 1), 1);
  v_nights int := (p_payload->>'nights')::int;
  v_check_in date := (p_payload->>'check_in')::date;
  v_pkg text := p_payload->>'package_id';
  v_room text := p_payload->>'room_id';
  v_hid text := p_payload->>'hold_id';
  v_uid text := p_payload->>'user_id';
  v_exp timestamptz := nullif(p_payload->>'expires_at', '')::timestamptz;
  v_day date;
begin
  if v_hid is null or v_hid = '' or v_uid is null or v_uid = ''
     or v_pkg is null or v_pkg = '' or v_room is null or v_room = ''
     or v_nights is null or v_nights < 1 or v_nights > 14 or v_check_in is null then
    raise exception 'invalid_hold';
  end if;
  if v_exp is null then
    v_exp := now() + interval '15 minutes';
  end if;

  perform pg_advisory_xact_lock(hashtext(v_pkg || ':' || v_room));

  if exists (
    select 1 from room_holds h
    where h.hold_id = v_hid and h.user_id = v_uid and h.status = 'held'
  ) then
    update room_holds
      set expires_at = v_exp, nights = v_nights, check_in = v_check_in, units = v_units
      where hold_id = v_hid;
    return jsonb_build_object('ok', true, 'holdId', v_hid);
  end if;

  delete from room_holds where hold_id = v_hid and user_id = v_uid;

  v_day := v_check_in;
  while v_day < v_check_in + v_nights loop
    if tw_keys_taken(v_pkg, v_room, v_day, array[]::text[]) >= v_units then
      raise exception 'sold_out';
    end if;
    v_day := v_day + 1;
  end loop;

  insert into room_holds (
    hold_id, user_id, package_id, room_id, check_in, nights, units, status, expires_at
  ) values (
    v_hid, v_uid, v_pkg, v_room, v_check_in, v_nights, v_units, 'held', v_exp
  );
  return jsonb_build_object('ok', true, 'holdId', v_hid);
end;
$$;

create or replace function tw_release_hold(p_payload jsonb)
returns jsonb
language plpgsql
set search_path = public
as $$
begin
  update room_holds
    set status = 'released'
    where hold_id = p_payload->>'hold_id'
      and user_id = p_payload->>'user_id'
      and status = 'held';
  return jsonb_build_object('ok', true);
end;
$$;

create or replace function tw_reserve_booking(p_payload jsonb)
returns jsonb
language plpgsql
set search_path = public
as $$
declare
  v_units int := greatest(coalesce((p_payload->>'units')::int, 1), 1);
  v_nights int := (p_payload->>'nights')::int;
  v_check_in date := (p_payload->>'check_in')::date;
  v_pkg text := p_payload->>'package_id';
  v_room text := coalesce(nullif(p_payload->>'room_id', ''), '');
  v_uid text := p_payload->>'user_id';
  v_except text[] := tw_except_ids(p_payload);
  v_swaps jsonb := coalesce(p_payload->'swaps', '{}'::jsonb);
  v_day date;
  v_rec jsonb;
begin
  if v_uid is null or v_uid = '' or v_pkg is null or v_nights is null or v_nights < 1
     or v_check_in is null or coalesce(p_payload->>'confirmation_code', '') = ''
     or coalesce(p_payload->>'payer_name', '') = '' then
    raise exception 'invalid_hold';
  end if;
  if jsonb_typeof(v_swaps) is distinct from 'object' then
    v_swaps := '{}'::jsonb;
  end if;
  if v_room = '' then
    v_room := coalesce(v_swaps->>'roomId', '');
  end if;
  if v_room = '' then
    raise exception 'invalid_hold';
  end if;
  v_swaps := v_swaps || jsonb_build_object('roomId', v_room);

  perform pg_advisory_xact_lock(hashtext(v_pkg || ':' || v_room));

  if coalesce(p_payload->>'payment_ref', '') <> '' then
    select to_jsonb(b.*) into v_rec
    from bookings b
    where b.user_id = v_uid and b.payment_ref = p_payload->>'payment_ref'
    limit 1;
    if v_rec is not null then
      update room_holds
        set status = 'converted'
        where user_id = v_uid and hold_id = any(v_except) and status = 'held';
      return v_rec;
    end if;
  end if;

  v_day := v_check_in;
  while v_day < v_check_in + v_nights loop
    if tw_keys_taken(v_pkg, v_room, v_day, v_except) >= v_units then
      raise exception 'sold_out';
    end if;
    v_day := v_day + 1;
  end loop;

  begin
    insert into bookings (
      user_id, package_id, package_name, nights, travelers, check_in,
      amount_inr, swaps, status, card_last4, card_brand, payer_name,
      confirmation_code, payment_method, payment_ref, upi_handle, bank_name
    ) values (
      v_uid,
      v_pkg,
      p_payload->>'package_name',
      v_nights,
      (p_payload->>'travelers')::int,
      v_check_in,
      (p_payload->>'amount_inr')::int,
      v_swaps::text,
      coalesce(nullif(p_payload->>'status', ''), 'paid'),
      nullif(p_payload->>'card_last4', ''),
      nullif(p_payload->>'card_brand', ''),
      p_payload->>'payer_name',
      p_payload->>'confirmation_code',
      nullif(p_payload->>'payment_method', ''),
      nullif(p_payload->>'payment_ref', ''),
      nullif(p_payload->>'upi_handle', ''),
      nullif(p_payload->>'bank_name', '')
    )
    returning to_jsonb(bookings.*) into v_rec;
  exception
    when unique_violation then
      select to_jsonb(b.*) into v_rec
      from bookings b
      where b.user_id = v_uid
        and (
          (coalesce(p_payload->>'payment_ref', '') <> '' and b.payment_ref = p_payload->>'payment_ref')
          or b.confirmation_code = p_payload->>'confirmation_code'
        )
      limit 1;
      if v_rec is null then
        raise;
      end if;
  end;

  update room_holds
    set status = 'converted'
    where user_id = v_uid and hold_id = any(v_except) and status = 'held';
  return v_rec;
end;
$$;

create or replace function tw_occupancy()
returns jsonb
language sql
volatile
set search_path = public
as $$
  select coalesce((
    select jsonb_agg(item)
    from (
      select jsonb_build_object(
        'holdId', b.confirmation_code,
        'packageId', b.package_id,
        'roomId', tw_room_of(b.swaps),
        'checkIn', b.check_in,
        'nights', b.nights,
        'status', b.status,
        'expiresAt', null
      ) as item
      from bookings b
      where b.status in ('paid', 'held')
        and tw_room_of(b.swaps) <> ''
      union all
      select jsonb_build_object(
        'holdId', h.hold_id,
        'packageId', h.package_id,
        'roomId', h.room_id,
        'checkIn', h.check_in,
        'nights', h.nights,
        'status', 'held',
        'expiresAt', h.expires_at
      ) as item
      from room_holds h
      where h.status = 'held' and h.expires_at > now()
    ) listed
  ), '[]'::jsonb);
$$;

create or replace function tw_save_reconcile_job(p_payload jsonb)
returns jsonb
language plpgsql
set search_path = public
as $$
declare
  v_id text := p_payload->>'id';
  v_uid text := p_payload->>'user_id';
  v_pay text := p_payload->>'payment_id';
  v_state text := coalesce(nullif(p_payload->>'state', ''), 'queued');
begin
  if v_id is null or v_uid is null or v_pay is null or v_pay = '' then
    raise exception 'invalid_job';
  end if;
  if v_state not in ('queued', 'done', 'failed', 'refunded') then
    raise exception 'invalid_job';
  end if;
  insert into payment_reconcile_jobs (
    id, user_id, payment_id, order_id, attempts, last_error, payload, state, created_at, updated_at
  ) values (
    v_id,
    v_uid,
    v_pay,
    nullif(p_payload->>'order_id', ''),
    coalesce((p_payload->>'attempts')::int, 0),
    nullif(p_payload->>'last_error', ''),
    coalesce(p_payload->'payload', '{}'::jsonb),
    v_state,
    coalesce(nullif(p_payload->>'created_at', '')::timestamptz, now()),
    now()
  )
  on conflict (id) do update set
    attempts = excluded.attempts,
    last_error = excluded.last_error,
    payload = excluded.payload,
    state = excluded.state,
    order_id = excluded.order_id,
    updated_at = now();
  return jsonb_build_object('ok', true);
end;
$$;

create or replace function tw_list_reconcile_jobs(p_payload jsonb)
returns jsonb
language sql
stable
set search_path = public
as $$
  select coalesce((
    select jsonb_agg(to_jsonb(j) order by j.created_at)
    from payment_reconcile_jobs j
    where j.user_id = p_payload->>'user_id'
      and j.state = 'queued'
  ), '[]'::jsonb);
$$;

create or replace function tw_save_refund_intent(p_payload jsonb)
returns jsonb
language plpgsql
set search_path = public
as $$
declare
  v_status text := p_payload->>'status';
begin
  if coalesce(p_payload->>'user_id', '') = '' or p_payload->>'booking_id' is null then
    raise exception 'invalid_job';
  end if;
  if v_status not in ('pending', 'gateway_done', 'applied') then
    raise exception 'invalid_job';
  end if;
  insert into refund_intents (
    id, user_id, booking_id, payment_ref, amount_inr, status, refund_id, created_at, updated_at
  ) values (
    coalesce(nullif(p_payload->>'id', ''), p_payload->>'user_id' || ':' || (p_payload->>'booking_id')),
    p_payload->>'user_id',
    (p_payload->>'booking_id')::bigint,
    coalesce(p_payload->>'payment_ref', ''),
    coalesce((p_payload->>'amount_inr')::int, 0),
    v_status,
    nullif(p_payload->>'refund_id', ''),
    coalesce(nullif(p_payload->>'created_at', '')::timestamptz, now()),
    now()
  )
  on conflict (user_id, booking_id) do update set
    status = excluded.status,
    refund_id = coalesce(excluded.refund_id, refund_intents.refund_id),
    amount_inr = excluded.amount_inr,
    payment_ref = excluded.payment_ref,
    updated_at = now();
  return jsonb_build_object('ok', true);
end;
$$;

create or replace function tw_list_refund_intents(p_payload jsonb)
returns jsonb
language sql
stable
set search_path = public
as $$
  select coalesce((
    select jsonb_agg(to_jsonb(r) order by r.created_at)
    from refund_intents r
    where r.user_id = p_payload->>'user_id'
  ), '[]'::jsonb);
$$;

revoke all on function tw_except_ids(jsonb) from public;
revoke all on function tw_room_of(text) from public;
revoke all on function tw_keys_taken(text, text, date, text[]) from public;
revoke all on function tw_reserve_hold(jsonb) from public;
revoke all on function tw_release_hold(jsonb) from public;
revoke all on function tw_reserve_booking(jsonb) from public;
revoke all on function tw_occupancy() from public;
revoke all on function tw_save_reconcile_job(jsonb) from public;
revoke all on function tw_list_reconcile_jobs(jsonb) from public;
revoke all on function tw_save_refund_intent(jsonb) from public;
revoke all on function tw_list_refund_intents(jsonb) from public;
