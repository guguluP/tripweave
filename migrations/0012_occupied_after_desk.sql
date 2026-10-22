-- A desk-confirmed or checked-in stay still occupies the room.
-- 0005 only counted paid and held, so a second guest could book the same nights.

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
    where b.status in ('paid', 'held', 'confirmed', 'desk_confirmed', 'checked_in')
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
      where b.status in ('paid', 'held', 'confirmed', 'desk_confirmed', 'checked_in')
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
