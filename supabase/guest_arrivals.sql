-- Optional arrival details for foreign guests (Form III worksheet). No passport or visa numbers.
-- Paste after schema.sql and partner_desk_ops.sql. Safe to re-run.

create table if not exists public.guest_arrivals (
  booking_id bigint not null references public.bookings (id) on delete cascade,
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

alter table public.guest_arrivals enable row level security;
drop policy if exists "block_client_guest_arrivals" on public.guest_arrivals;
create policy "block_client_guest_arrivals"
  on public.guest_arrivals for all to anon, authenticated
  using (false) with check (false);
revoke all on public.guest_arrivals from public, anon, authenticated;
grant all on public.guest_arrivals to service_role;

create or replace function public.tw_guest_arrivals(p_gate text, p_op text, p_payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  uid text := p_payload->>'user_id';
  v_booking bigint := (p_payload->>'booking_id')::bigint;
  v_expires timestamptz := nullif(p_payload->>'expires_at', '')::timestamptz;
begin
  if coalesce(auth.role(), '') is distinct from 'service_role'
     and session_user not in ('postgres', 'supabase_admin') then
    raise exception 'forbidden';
  end if;
  if p_op = 'purge' then
    delete from public.guest_arrivals where expires_at is not null and expires_at < now();
    return jsonb_build_object('ok', true);
  end if;
  if uid is null or uid = '' or v_booking is null then
    raise exception 'missing_booking';
  end if;
  if not exists (
    select 1 from public.bookings b where b.id = v_booking and b.user_id = uid
  ) then
    raise exception 'not_found';
  end if;
  delete from public.guest_arrivals where expires_at is not null and expires_at < now();
  if p_op = 'save' then
    insert into public.guest_arrivals (
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

revoke all on function public.tw_guest_arrivals(text, text, jsonb) from public, anon, authenticated;
grant execute on function public.tw_guest_arrivals(text, text, jsonb) to service_role;

create or replace function public.tw_desk_foreign_register(p_gate text, p_package text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  if coalesce(auth.role(), '') is distinct from 'service_role'
     and session_user not in ('postgres', 'supabase_admin') then
    raise exception 'forbidden';
  end if;
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
    from public.bookings b
    join (
      select tr.*, row_number() over (partition by tr.booking_id order by tr.id) - 1 as guest_index
      from public.travellers tr
    ) g on g.booking_id = b.id
    left join public.guest_arrivals a
      on a.booking_id = b.id and a.guest_index = g.guest_index
    where b.package_id = p_package
      and b.status in ('paid', 'desk_confirmed', 'confirmed', 'checked_in')
      and upper(coalesce(g.nationality, 'IN')) <> 'IN'
  ), '[]'::jsonb);
end;
$$;

revoke all on function public.tw_desk_foreign_register(text, text) from public, anon, authenticated;
grant execute on function public.tw_desk_foreign_register(text, text) to service_role;

notify pgrst, 'reload schema';
