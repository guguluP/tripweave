-- Reservation book: paid/held bookings are the only thing that consumes a key.
-- tw_occupancy lists those holds (no guest data).
-- tw_reserve_insert refuses the sale when any night is already at allotment.

create or replace function public.tw_occupancy(p_gate text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  expected text := 'twg_6fc5976ec6ca8ce5a99ec06cb98d6a98';
begin
  if p_gate is distinct from expected then
    raise exception 'forbidden';
  end if;
  return coalesce((
    select jsonb_agg(jsonb_build_object(
      'packageId', b.package_id,
      'roomId', coalesce(b.swaps->>'roomId', ''),
      'checkIn', b.check_in,
      'nights', b.nights,
      'status', b.status
    ))
    from public.bookings b
    where b.status in ('paid', 'held')
      and coalesce(b.swaps->>'roomId', '') <> ''
  ), '[]'::jsonb);
end;
$$;

revoke all on function public.tw_occupancy(text) from public;
grant execute on function public.tw_occupancy(text) to anon, authenticated, service_role;

create or replace function public.tw_reserve_insert(p_gate text, p_payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  expected text := 'twg_6fc5976ec6ca8ce5a99ec06cb98d6a98';
  units int := greatest(coalesce((p_payload->>'units')::int, 1), 1);
  night_count int := (p_payload->>'nights')::int;
  check_in date := (p_payload->>'check_in')::date;
  pkg text := p_payload->>'package_id';
  room text := coalesce(nullif(p_payload->>'room_id', ''), p_payload->'swaps'->>'roomId', '');
  d date;
  taken int;
  rec jsonb;
  uid text := p_payload->>'user_id';
begin
  if p_gate is distinct from expected then
    raise exception 'forbidden';
  end if;
  if night_count is null or night_count < 1 or check_in is null or pkg is null or room = '' then
    raise exception 'invalid_hold';
  end if;
  perform pg_advisory_xact_lock(hashtext(pkg || ':' || room));
  d := check_in;
  while d < check_in + night_count loop
    select count(*) into taken
    from public.bookings b
    where b.status in ('paid', 'held')
      and b.package_id = pkg
      and coalesce(b.swaps->>'roomId', '') = room
      and b.check_in <= d
      and b.check_in + b.nights > d;
    if taken >= units then
      raise exception 'sold_out';
    end if;
    d := d + 1;
  end loop;

  insert into public.bookings (
    user_id, package_id, package_name, nights, travelers, check_in,
    amount_inr, swaps, status, card_last4, card_brand, payer_name,
    confirmation_code, payment_method, payment_ref, upi_handle, bank_name
  ) values (
    uid,
    pkg,
    p_payload->>'package_name',
    night_count,
    (p_payload->>'travelers')::int,
    check_in,
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
end;
$$;

revoke all on function public.tw_reserve_insert(text, jsonb) from public;
grant execute on function public.tw_reserve_insert(text, jsonb) to anon, authenticated, service_role;
