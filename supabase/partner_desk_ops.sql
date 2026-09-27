-- Partner / desk ops for Supabase.
-- Apply AFTER schema.sql + stay_ops.sql + ops_durability.sql.
--
-- Step A: paste migrations/0007_partner_desk_ops.sql (Neon/PGlite twin) into the SQL editor and Run.
-- Step B: paste this file for service_role-gated wrappers used by the app RPCs.
--
-- Full self-contained SQL (catalog helpers + RLS tables) is in the local a10dcd2 tree as
-- supabase/partner_desk_ops.sql (~19KB). Prefer that full file when you have it.

create or replace function public.tw_set_allotment(p_gate text, p_payload jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
begin
  if coalesce(auth.role(), '') is distinct from 'service_role'
     and session_user not in ('postgres', 'supabase_admin') then
    raise exception 'forbidden';
  end if;
  return tw_set_allotment(p_payload);
end;
$$;

create or replace function public.tw_set_stop_sell(p_gate text, p_payload jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
begin
  if coalesce(auth.role(), '') is distinct from 'service_role'
     and session_user not in ('postgres', 'supabase_admin') then
    raise exception 'forbidden';
  end if;
  return tw_set_stop_sell(p_payload);
end;
$$;

create or replace function public.tw_list_allotment(p_gate text, p_payload jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
begin
  if coalesce(auth.role(), '') is distinct from 'service_role'
     and session_user not in ('postgres', 'supabase_admin') then
    raise exception 'forbidden';
  end if;
  return tw_list_allotment(p_payload);
end;
$$;

create or replace function public.tw_list_stop_sell(p_gate text, p_payload jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
begin
  if coalesce(auth.role(), '') is distinct from 'service_role'
     and session_user not in ('postgres', 'supabase_admin') then
    raise exception 'forbidden';
  end if;
  return tw_list_stop_sell(p_payload);
end;
$$;

create or replace function public.tw_desk_transition(p_gate text, p_payload jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
begin
  if coalesce(auth.role(), '') is distinct from 'service_role'
     and session_user not in ('postgres', 'supabase_admin') then
    raise exception 'forbidden';
  end if;
  return tw_desk_transition(p_payload);
end;
$$;

create or replace function public.tw_flag_unconfirmed(p_gate text, p_payload jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
begin
  if coalesce(auth.role(), '') is distinct from 'service_role'
     and session_user not in ('postgres', 'supabase_admin') then
    raise exception 'forbidden';
  end if;
  return tw_flag_unconfirmed(p_payload);
end;
$$;

create or replace function public.tw_desk_bookings(p_gate text, p_package text)
returns jsonb language plpgsql security definer set search_path = public as $$
begin
  if coalesce(auth.role(), '') is distinct from 'service_role'
     and session_user not in ('postgres', 'supabase_admin') then
    raise exception 'forbidden';
  end if;
  return coalesce((
    select jsonb_agg(jsonb_build_object(
      'id', b.id,
      'packageId', b.package_id,
      'packageName', b.package_name,
      'checkIn', b.check_in,
      'nights', b.nights,
      'travelers', b.travelers,
      'payerName', b.payer_name,
      'status', b.status,
      'confirmationCode', b.confirmation_code,
      'amountInr', b.amount_inr,
      'guestEmail', coalesce(b.swaps#>>'{__tw,guestEmail}', b.swaps->>'guestEmail'),
      'opsFlaggedAt', b.ops_flagged_at
    ) order by b.created_at desc)
    from public.bookings b
    where b.package_id = p_package
      and b.status in ('paid','confirmed','desk_confirmed','checked_in','held')
  ), '[]'::jsonb);
end;
$$;
