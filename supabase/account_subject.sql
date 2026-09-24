-- Keep one user id per sign-in email.
-- Vercel sessions are cookies, so a new login would otherwise mint a new id
-- and hide bookings stored under the previous one.
-- Safe to re-run. Execute stays with service_role.

create table if not exists public.account_subjects (
  email text primary key,
  user_id text not null,
  created_at timestamptz not null default now()
);

alter table public.account_subjects enable row level security;

drop policy if exists "block_client_account_subjects" on public.account_subjects;
create policy "block_client_account_subjects"
  on public.account_subjects for all to anon, authenticated
  using (false) with check (false);

create or replace function public.tw_booking_account_email(swaps jsonb)
returns text
language sql
immutable
as $$
  select case
    when swaps is null or not (swaps ? '__tw') or left(coalesce(swaps->>'__tw', ''), 1) <> '{' then ''
    else lower(btrim(coalesce(
      (swaps->>'__tw')::jsonb->>'accountEmail',
      (swaps->>'__tw')::jsonb->>'guestEmail',
      ''
    )))
  end;
$$;

create or replace function public.tw_booking_owned_by_email(
  p_booking_id bigint,
  p_user_id text,
  swaps jsonb,
  p_email text
)
returns boolean
language sql
stable
as $$
  select public.tw_booking_account_email(swaps) = p_email
    or exists (
      select 1 from public.profiles p
      where p.user_id = p_user_id
        and lower(btrim(coalesce(p.email, ''))) = p_email
    )
    or (
      exists (
        select 1 from public.travellers t
        where t.booking_id = p_booking_id
          and lower(btrim(coalesce(t.email, ''))) = p_email
      )
      and not exists (
        select 1 from public.profiles p
        where p.user_id = p_user_id
          and btrim(coalesce(p.email, '')) <> ''
          and lower(btrim(p.email)) <> p_email
      )
    );
$$;

create or replace function public.tw_claim_subject(p_email text, p_session_user_id text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email text := lower(btrim(coalesce(p_email, '')));
  v_fresh text := btrim(coalesce(p_session_user_id, ''));
  canon text;
  owners text[];
begin
  if coalesce(auth.role(), '') is distinct from 'service_role'
     and session_user not in ('postgres', 'supabase_admin') then
    raise exception 'forbidden';
  end if;

  if v_email = '' or v_fresh = '' then
    return nullif(v_fresh, '');
  end if;

  select s.user_id into canon
  from public.account_subjects s
  where s.email = v_email;

  if canon is null then
    select p.user_id into canon
    from public.profiles p
    where lower(btrim(coalesce(p.email, ''))) = v_email
    order by p.updated_at asc nulls last
    limit 1;
  end if;

  if canon is null then
    select b.user_id into canon
    from public.bookings b
    where public.tw_booking_owned_by_email(b.id, b.user_id, b.swaps, v_email)
    order by b.created_at asc
    limit 1;
  end if;

  if canon is null or canon = '' then
    canon := v_fresh;
  end if;

  insert into public.account_subjects (email, user_id)
  values (v_email, canon)
  on conflict (email) do update
    set user_id = public.account_subjects.user_id
  returning user_id into canon;

  select coalesce(array_agg(distinct owner), array[]::text[]) into owners
  from (
    select canon as owner
    union all select v_fresh
    union all
    select p.user_id from public.profiles p
    where lower(btrim(coalesce(p.email, ''))) = v_email
    union all
    select b.user_id from public.bookings b
    where public.tw_booking_owned_by_email(b.id, b.user_id, b.swaps, v_email)
  ) found
  where owner is not null and owner <> '';

  update public.bookings
    set user_id = canon
    where user_id = any(owners) and user_id is distinct from canon;

  update public.travellers
    set user_id = canon
    where user_id = any(owners) and user_id is distinct from canon;

  update public.payment_events
    set user_id = canon
    where user_id = any(owners) and user_id is distinct from canon;

  insert into public.profiles (user_id, display_name, email, phone, updated_at)
  select canon, p.display_name, p.email, p.phone, p.updated_at
  from public.profiles p
  where p.user_id = any(owners) and p.user_id is distinct from canon
  order by p.updated_at desc nulls last
  limit 1
  on conflict (user_id) do nothing;

  update public.saved_stays s
    set user_id = canon
    where s.user_id = any(owners)
      and s.user_id is distinct from canon
      and not exists (
        select 1 from public.saved_stays x
        where x.user_id = canon and x.package_id = s.package_id
      );
  delete from public.saved_stays
    where user_id = any(owners) and user_id is distinct from canon;

  if to_regclass('public.room_holds') is not null then
    update public.room_holds
      set user_id = canon
      where user_id = any(owners) and user_id is distinct from canon;
  end if;

  if to_regclass('public.refund_intents') is not null then
    update public.refund_intents r
      set user_id = canon
      where r.user_id = any(owners)
        and r.user_id is distinct from canon
        and not exists (
          select 1 from public.refund_intents x
          where x.user_id = canon and x.booking_id = r.booking_id
        );
  end if;

  if to_regclass('public.payment_reconcile_jobs') is not null then
    update public.payment_reconcile_jobs j
      set user_id = canon
      where j.user_id = any(owners)
        and j.user_id is distinct from canon
        and not exists (
          select 1 from public.payment_reconcile_jobs x
          where x.user_id = canon and x.payment_id = j.payment_id
        );
  end if;

  return canon;
end;
$$;

revoke all on function public.tw_booking_account_email(jsonb) from public;
revoke all on function public.tw_booking_account_email(jsonb) from anon, authenticated;
revoke all on function public.tw_booking_owned_by_email(bigint, text, jsonb, text) from public;
revoke all on function public.tw_booking_owned_by_email(bigint, text, jsonb, text) from anon, authenticated;
revoke all on function public.tw_claim_subject(text, text) from public;
revoke all on function public.tw_claim_subject(text, text) from anon, authenticated;
grant execute on function public.tw_claim_subject(text, text) to service_role;
