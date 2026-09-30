-- Signed-in trip plan: the brief and the stay the guest had open.
-- Paste in the Supabase SQL editor. Safe to re-run.
-- Hotel photographs stay files on the site (public/stays). They are not rows.

create table if not exists public.trip_briefs (
  user_id text primary key,
  document jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.trip_briefs enable row level security;

drop policy if exists "block_client_trip_briefs" on public.trip_briefs;
create policy "block_client_trip_briefs"
  on public.trip_briefs for all to anon, authenticated
  using (false) with check (false);

revoke all on public.trip_briefs from public, anon, authenticated;
grant all on public.trip_briefs to service_role;

create or replace function public.tw_guest_plan(p_gate text, p_op text, p_payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  uid text := p_payload->>'user_id';
  incoming timestamptz := nullif(p_payload->>'updated_at', '')::timestamptz;
  stored timestamptz;
begin
  if coalesce(auth.role(), '') is distinct from 'service_role'
     and session_user not in ('postgres', 'supabase_admin') then
    raise exception 'forbidden';
  end if;
  if uid is null or uid = '' then
    raise exception 'missing_user';
  end if;

  if p_op = 'load_plan' then
    return (
      select jsonb_build_object('document', document, 'updatedAt', updated_at)
      from public.trip_briefs
      where user_id = uid
    );
  elsif p_op = 'save_plan' then
    select updated_at into stored from public.trip_briefs where user_id = uid;
    if stored is not null and incoming is not null and incoming < stored then
      return (
        select jsonb_build_object('document', document, 'updatedAt', updated_at, 'stale', true)
        from public.trip_briefs
        where user_id = uid
      );
    end if;
    insert into public.trip_briefs (user_id, document, updated_at)
    values (uid, coalesce(p_payload->'document', '{}'::jsonb), coalesce(incoming, now()))
    on conflict (user_id) do update
      set document = excluded.document,
          updated_at = excluded.updated_at;
    return jsonb_build_object('ok', true, 'updatedAt', coalesce(incoming, now()));
  end if;

  raise exception 'unknown_op';
end;
$$;

revoke all on function public.tw_guest_plan(text, text, jsonb) from public, anon, authenticated;
grant execute on function public.tw_guest_plan(text, text, jsonb) to service_role;
