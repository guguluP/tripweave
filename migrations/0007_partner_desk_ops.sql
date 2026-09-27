-- Partner desk ops: per-night allotment, stop-sell, desk_confirmed / checked_in.
-- Neon / local (PGlite). Supabase copy: supabase/partner_desk_ops.sql

alter table bookings drop constraint if exists bookings_status_check;
alter table bookings add constraint bookings_status_check
  check (status = any (array[
    'paid','cancelled','pending','failed','held','completed','refunded',
    'confirmed','desk_confirmed','checked_in','refund_pending'
  ]));

alter table bookings add column if not exists desk_notified_at timestamptz;
alter table bookings add column if not exists desk_confirmed_at timestamptz;
alter table bookings add column if not exists desk_declined_at timestamptz;
alter table bookings add column if not exists ops_flagged_at timestamptz;
alter table bookings add column if not exists checked_in_at timestamptz;

create table if not exists room_allotment (
  package_id text not null,
  room_id text not null,
  night date not null,
  units integer not null check (units >= 0 and units <= 200),
  updated_by text,
  updated_at timestamptz not null default now(),
  primary key (package_id, room_id, night)
);

create table if not exists stop_sell (
  package_id text not null,
  room_id text not null default '',
  night date not null,
  reason text,
  updated_by text,
  updated_at timestamptz not null default now(),
  primary key (package_id, room_id, night)
);

create index if not exists stop_sell_night_idx on stop_sell (package_id, night);

create or replace function tw_set_allotment(p_payload jsonb)
returns jsonb
language plpgsql
as $$
declare
  v_pkg text := p_payload->>'package_id';
  v_room text := p_payload->>'room_id';
  v_night date := (p_payload->>'night')::date;
  v_units int := (p_payload->>'units')::int;
begin
  if v_pkg is null or v_room is null or v_night is null or v_units is null or v_units < 0 then
    raise exception 'invalid_allotment';
  end if;
  insert into room_allotment (package_id, room_id, night, units, updated_by, updated_at)
  values (v_pkg, v_room, v_night, v_units, p_payload->>'updated_by', now())
  on conflict (package_id, room_id, night) do update set
    units = excluded.units,
    updated_by = excluded.updated_by,
    updated_at = now();
  return jsonb_build_object('ok', true, 'package_id', v_pkg, 'room_id', v_room, 'night', v_night, 'units', v_units);
end;
$$;

create or replace function tw_set_stop_sell(p_payload jsonb)
returns jsonb
language plpgsql
as $$
declare
  v_pkg text := p_payload->>'package_id';
  v_room text := coalesce(p_payload->>'room_id', '');
  v_night date := (p_payload->>'night')::date;
  v_closed boolean := coalesce((p_payload->>'closed')::boolean, true);
begin
  if v_pkg is null or v_night is null then
    raise exception 'invalid_stop_sell';
  end if;
  if v_closed then
    insert into stop_sell (package_id, room_id, night, reason, updated_by, updated_at)
    values (v_pkg, v_room, v_night, p_payload->>'reason', p_payload->>'updated_by', now())
    on conflict (package_id, room_id, night) do update set
      reason = excluded.reason,
      updated_by = excluded.updated_by,
      updated_at = now();
  else
    delete from stop_sell where package_id = v_pkg and room_id = v_room and night = v_night;
  end if;
  return jsonb_build_object('ok', true, 'closed', v_closed);
end;
$$;

create or replace function tw_list_allotment(p_payload jsonb)
returns jsonb
language plpgsql
as $$
declare
  pkg text := p_payload->>'package_id';
  from_d date := coalesce((p_payload->>'from')::date, current_date);
  to_d date := coalesce((p_payload->>'to')::date, current_date + 30);
begin
  return coalesce((
    select jsonb_agg(jsonb_build_object(
      'packageId', a.package_id,
      'roomId', a.room_id,
      'night', a.night,
      'units', a.units
    ) order by a.night, a.room_id)
    from room_allotment a
    where a.package_id = pkg and a.night between from_d and to_d
  ), '[]'::jsonb);
end;
$$;

create or replace function tw_list_stop_sell(p_payload jsonb)
returns jsonb
language plpgsql
as $$
declare
  pkg text := p_payload->>'package_id';
  from_d date := coalesce((p_payload->>'from')::date, current_date);
  to_d date := coalesce((p_payload->>'to')::date, current_date + 30);
begin
  return coalesce((
    select jsonb_agg(jsonb_build_object(
      'packageId', s.package_id,
      'roomId', s.room_id,
      'night', s.night,
      'reason', s.reason
    ) order by s.night, s.room_id)
    from stop_sell s
    where s.package_id = pkg and s.night between from_d and to_d
  ), '[]'::jsonb);
end;
$$;

create or replace function tw_desk_transition(p_payload jsonb)
returns jsonb
language plpgsql
as $$
declare
  bid bigint := (p_payload->>'id')::bigint;
  pkg text := p_payload->>'package_id';
  action text := p_payload->>'action';
  rec record;
  new_status text;
begin
  select * into rec from bookings where id = bid and package_id = pkg for update;
  if not found then raise exception 'not_found'; end if;

  if action = 'desk_confirm' then
    if rec.status is distinct from 'paid' then raise exception 'not_open'; end if;
    new_status := 'desk_confirmed';
    update bookings set status = new_status, desk_confirmed_at = now() where id = bid;
  elsif action = 'desk_decline' then
    if rec.status is distinct from 'paid' then raise exception 'not_open'; end if;
    new_status := 'cancelled';
    update bookings set status = new_status, desk_declined_at = now() where id = bid;
  elsif action = 'check_in' then
    if rec.status not in ('desk_confirmed', 'confirmed') then raise exception 'not_open'; end if;
    new_status := 'checked_in';
    update bookings set status = new_status, checked_in_at = now() where id = bid;
  else
    raise exception 'unknown_action';
  end if;

  return jsonb_build_object('ok', true, 'id', bid, 'status', new_status);
end;
$$;

create or replace function tw_flag_unconfirmed(p_payload jsonb)
returns jsonb
language plpgsql
as $$
declare
  minutes int := greatest(coalesce((p_payload->>'minutes')::int, 20), 1);
  flagged int := 0;
begin
  update bookings
    set ops_flagged_at = now()
    where status = 'paid'
      and ops_flagged_at is null
      and created_at < now() - make_interval(mins => minutes);
  get diagnostics flagged = row_count;
  return jsonb_build_object(
    'flagged', flagged,
    'rows', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', b.id,
        'packageId', b.package_id,
        'packageName', b.package_name,
        'confirmationCode', b.confirmation_code,
        'checkIn', b.check_in,
        'payerName', b.payer_name,
        'amountInr', b.amount_inr,
        'createdAt', b.created_at
      ) order by b.created_at)
      from bookings b
      where b.status = 'paid'
        and b.ops_flagged_at is not null
        and b.ops_flagged_at > now() - interval '1 day'
    ), '[]'::jsonb)
  );
end;
$$;

create or replace function tw_is_stop_sell(p_payload jsonb)
returns boolean
language plpgsql
as $$
declare
  v_pkg text := p_payload->>'package_id';
  v_room text := coalesce(p_payload->>'room_id', '');
  v_night date := (p_payload->>'night')::date;
begin
  return exists (
    select 1 from stop_sell s
    where s.package_id = v_pkg
      and s.night = v_night
      and (s.room_id = '' or s.room_id = v_room)
  );
end;
$$;

create or replace function tw_night_units(p_payload jsonb)
returns int
language plpgsql
as $$
declare
  v_pkg text := p_payload->>'package_id';
  v_room text := p_payload->>'room_id';
  v_night date := (p_payload->>'night')::date;
  v_fallback int := greatest(coalesce((p_payload->>'fallback')::int, 1), 0);
  v_found int;
begin
  select a.units into v_found from room_allotment a
  where a.package_id = v_pkg and a.room_id = v_room and a.night = v_night;
  if v_found is null then return v_fallback; end if;
  return v_found;
end;
$$;
