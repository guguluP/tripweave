-- Cancel claim: stop two servers from refunding the same stay twice.
--
-- Apply in the Supabase SQL editor (project csegihiepvxezuypsvop) after schema.sql and
-- partner_desk_ops.sql. Safe to re-run. Same idea as the Postgres claim in #40: before any
-- refund, the cancel writes a short-lived cancelClaimAt into the stay's meta (swaps.__tw) with
-- one atomic UPDATE. Only one request gets the row back; the other is told the cancel is already
-- running. A claim older than 6 minutes counts as abandoned (crashed request), so the guest can
-- retry. The final status write (tw_cancel_open) clears it; a failed refund gives it back
-- (tw_cancel_release).
--
-- Also changes tw_cancel_open:
--   * accepts refund_pending rows, so a queued refund that finished can mark the stay refunded
--     (before, it matched no row and returned null, which the app took as success);
--   * still only touches paid / held / confirmed / refund_pending rows of that guest.

-- Meta stored as JSON text in swaps.__tw. Bad JSON reads as empty, never as an error.
create or replace function public.tw_booking_meta(p_swaps jsonb)
returns jsonb
language plpgsql
immutable
set search_path = public
as $$
declare
  raw text := p_swaps->>'__tw';
  parsed jsonb;
begin
  if raw is null or raw = '' then return '{}'::jsonb; end if;
  parsed := raw::jsonb;
  if jsonb_typeof(parsed) <> 'object' then return '{}'::jsonb; end if;
  return parsed;
exception when others then
  return '{}'::jsonb;
end;
$$;

-- cancelClaimAt as a timestamp; unreadable reads as null (no claim).
create or replace function public.tw_cancel_claim_time(p_swaps jsonb)
returns timestamptz
language plpgsql
immutable
set search_path = public
as $$
begin
  return nullif(public.tw_booking_meta(p_swaps)->>'cancelClaimAt', '')::timestamptz;
exception when others then
  return null;
end;
$$;

-- Claim an open stay for one cancel. Returns the row (with the new swaps) and the claim stamp,
-- or null when the stay is not open or another cancel holds a fresh claim.
-- p_payload: { id, user_id, ttl_seconds? (default 360) }
create or replace function public.tw_cancel_claim(p_gate text, p_payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  rec jsonb;
  stamp text := to_char(now() at time zone 'utc', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"');
  ttl interval := make_interval(secs => coalesce(nullif(p_payload->>'ttl_seconds', '')::int, 360));
begin
  if coalesce(auth.role(), '') is distinct from 'service_role'
     and session_user not in ('postgres', 'supabase_admin') then
    raise exception 'forbidden';
  end if;
  update public.bookings b
    set swaps = coalesce(b.swaps, '{}'::jsonb)
      || jsonb_build_object('__tw', (public.tw_booking_meta(b.swaps) || jsonb_build_object('cancelClaimAt', stamp))::text)
    where b.id = (p_payload->>'id')::bigint
      and b.user_id = p_payload->>'user_id'
      and b.status in ('paid', 'held', 'confirmed', 'refund_pending')
      and (public.tw_cancel_claim_time(b.swaps) is null
           or public.tw_cancel_claim_time(b.swaps) < now() - ttl)
    returning to_jsonb(b.*) into rec;
  if rec is null then return null; end if;
  return jsonb_build_object('booking', rec, 'claim_at', stamp);
end;
$$;

-- Give a claim back after a failed refund, only if it is still ours.
-- p_payload: { id, user_id, claim_at }
create or replace function public.tw_cancel_release(p_gate text, p_payload jsonb)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  n int;
begin
  if coalesce(auth.role(), '') is distinct from 'service_role'
     and session_user not in ('postgres', 'supabase_admin') then
    raise exception 'forbidden';
  end if;
  update public.bookings b
    set swaps = coalesce(b.swaps, '{}'::jsonb)
      || jsonb_build_object('__tw', (public.tw_booking_meta(b.swaps) - 'cancelClaimAt')::text)
    where b.id = (p_payload->>'id')::bigint
      and b.user_id = p_payload->>'user_id'
      and public.tw_booking_meta(b.swaps)->>'cancelClaimAt' = p_payload->>'claim_at';
  get diagnostics n = row_count;
  return n > 0;
end;
$$;

-- Final status write after the refund (or for a stay with nothing to refund). Same signature
-- and checks as before, plus refund_pending.
create or replace function public.tw_cancel_open(p_gate text, p_payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  rec jsonb;
begin
  if coalesce(auth.role(), '') is distinct from 'service_role'
     and session_user not in ('postgres', 'supabase_admin') then
    raise exception 'forbidden';
  end if;
  update public.bookings
    set status = coalesce(nullif(p_payload->>'status', ''), 'refunded'),
        swaps = case when p_payload ? 'swaps' and p_payload->'swaps' is not null and jsonb_typeof(p_payload->'swaps') = 'object'
                     then p_payload->'swaps' else swaps end
    where id = (p_payload->>'id')::bigint
      and user_id = p_payload->>'user_id'
      and status in ('paid', 'held', 'confirmed', 'refund_pending')
    returning to_jsonb(bookings.*) into rec;
  return rec;
end;
$$;

revoke all on function public.tw_booking_meta(jsonb) from public, anon, authenticated;
revoke all on function public.tw_cancel_claim_time(jsonb) from public, anon, authenticated;
revoke all on function public.tw_cancel_claim(text, jsonb) from public, anon, authenticated;
revoke all on function public.tw_cancel_release(text, jsonb) from public, anon, authenticated;
revoke all on function public.tw_cancel_open(text, jsonb) from public, anon, authenticated;
grant execute on function public.tw_booking_meta(jsonb) to service_role;
grant execute on function public.tw_cancel_claim_time(jsonb) to service_role;
grant execute on function public.tw_cancel_claim(text, jsonb) to service_role;
grant execute on function public.tw_cancel_release(text, jsonb) to service_role;
grant execute on function public.tw_cancel_open(text, jsonb) to service_role;
