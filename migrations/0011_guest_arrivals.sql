-- Optional arrival details and the desk foreign-guest register.
-- Neon / PGlite. No passport or visa numbers. expires_at matches the 14-day guest retention.

create table if not exists guest_arrivals (
  booking_id integer not null references bookings (id) on delete cascade,
  guest_index int not null check (guest_index between 0 and 11),
  user_id text not null,
  arrived_from text not null default '',
  arrival_time text not null default '',
  purpose text check (purpose in ('tourism', 'business', 'employment', 'medical', 'student', 'conference', 'others')),
  previous_stay text not null default '',
  next_destination text not null default '',
  expires_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key (booking_id, guest_index)
);

alter table guest_arrivals enable row level security;
drop policy if exists "block_client_guest_arrivals" on guest_arrivals;
create policy "block_client_guest_arrivals"
  on guest_arrivals for all
  using (false) with check (false);
revoke all on guest_arrivals from public;

create or replace function tw_guest_arrivals(p_op text, p_payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  uid text := p_payload->>'user_id';
  v_booking integer := (p_payload->>'booking_id')::integer;
  v_expires timestamptz := nullif(p_payload->>'expires_at', '')::timestamptz;
begin
  if p_op = 'purge' then
    delete from guest_arrivals where expires_at is not null and expires_at < now();
    return jsonb_build_object('ok', true);
  end if;
  if uid is null or uid = '' or v_booking is null then
    raise exception 'missing_booking';
  end if;
  if not exists (
    select 1 from bookings b where b.id = v_booking and b.user_id = uid
  ) then
    raise exception 'not_found';
  end if;
  delete from guest_arrivals where expires_at is not null and expires_at < now();
  if p_op = 'save' then
    insert into guest_arrivals (
      booking_id, guest_index, user_id, arrived_from, arrival_time, purpose,
      previous_stay, next_destination, expires_at, updated_at
    )
    select
      v_booking,
      (r->>'guest_index')::int,
      uid,
      coalesce(r->>'arrived_from', ''),
      coalesce(r->>'arrival_time', ''),
      nullif(r->>'purpose', ''),
      coalesce(r->>'previous_stay', ''),
      coalesce(r->>'next_destination', ''),
      v_expires,
      now()
    from jsonb_array_elements(coalesce(p_payload->'rows', '[]'::jsonb)) as r
    where (r->>'guest_index')::int between 0 and 11
    on conflict (booking_id, guest_index) do update set
      user_id = excluded.user_id,
      arrived_from = excluded.arrived_from,
      arrival_time = excluded.arrival_time,
      purpose = excluded.purpose,
      previous_stay = excluded.previous_stay,
      next_destination = excluded.next_destination,
      expires_at = excluded.expires_at,
      updated_at = now();
    return jsonb_build_object('ok', true);
  end if;
  raise exception 'unknown_op';
end;
$$;

revoke all on function tw_guest_arrivals(text, jsonb) from public;

create or replace function tw_desk_foreign_register(p_package text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  return coalesce((
    select jsonb_agg(jsonb_build_object(
      'fullName', g.full_name,
      'nationality', g.nationality,
      'idType', g.id_type,
      'idLast4', g.id_last4,
      'phone', g.phone,
      'email', g.email,
      'checkIn', b.check_in,
      'nights', b.nights,
      'arrivedFrom', coalesce(a.arrived_from, ''),
      'arrivalTime', coalesce(a.arrival_time, ''),
      'purpose', coalesce(a.purpose, ''),
      'previousStay', coalesce(a.previous_stay, ''),
      'nextDestination', coalesce(a.next_destination, ''),
      'confirmationCode', b.confirmation_code
    ) order by b.check_in, g.guest_index)
    from bookings b
    join (
      select sg.*, row_number() over (partition by sg.booking_id order by sg.id) - 1 as guest_index
      from stay_guests sg
    ) g on g.booking_id = b.id
    left join guest_arrivals a
      on a.booking_id = b.id and a.guest_index = g.guest_index
    where b.package_id = p_package
      and b.status in ('paid', 'desk_confirmed', 'confirmed', 'checked_in')
      and upper(coalesce(g.nationality, 'IN')) <> 'IN'
  ), '[]'::jsonb);
end;
$$;

revoke all on function tw_desk_foreign_register(text) from public;

do $$
begin
  if exists (select 1 from pg_roles where rolname = 'anon')
     and exists (select 1 from pg_roles where rolname = 'authenticated') then
    execute 'drop policy if exists "block_client_guest_arrivals" on guest_arrivals';
    execute 'create policy "block_client_guest_arrivals" on guest_arrivals for all to anon, authenticated using (false) with check (false)';
    execute 'revoke all on guest_arrivals from anon, authenticated';
  end if;
  if exists (select 1 from pg_roles where rolname = 'service_role') then
    execute 'grant all on guest_arrivals to service_role';
    execute 'grant execute on function tw_guest_arrivals(text, jsonb) to service_role';
    execute 'grant execute on function tw_desk_foreign_register(text) to service_role';
  end if;
end $$;
