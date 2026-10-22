-- Saved co-travellers. Neon / PGlite mirror.
-- No auth.role() check: PGlite has no auth schema. The server passes user_id.
-- Roles anon / authenticated / service_role are applied only when they exist,
-- because CREATE ROLE cannot run inside the migrator's transaction.

create table if not exists saved_travellers (
  id bigint generated always as identity primary key,
  user_id text not null,
  label text not null default '',
  full_name text not null,
  nationality text not null default 'IN',
  phone text not null default '',
  email text not null default '',
  id_type text,
  id_last4 text,
  last_used_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists saved_travellers_user_idx on saved_travellers (user_id);

alter table saved_travellers enable row level security;
drop policy if exists "block_client_saved_travellers" on saved_travellers;
create policy "block_client_saved_travellers"
  on saved_travellers for all
  using (false) with check (false);
revoke all on saved_travellers from public;

create or replace function tw_saved_travellers(p_op text, p_payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  uid text := p_payload->>'user_id';
begin
  if uid is null or uid = '' then
    raise exception 'missing_user';
  end if;
  delete from saved_travellers
    where user_id = uid and last_used_at < now() - interval '12 months';
  if p_op = 'list' then
    return coalesce((
      select jsonb_agg((to_jsonb(s) - 'user_id') order by s.last_used_at desc)
      from saved_travellers s
      where s.user_id = uid
    ), '[]'::jsonb);
  elsif p_op = 'upsert' then
    if nullif(p_payload->>'id', '') is null then
      if (select count(*) from saved_travellers where user_id = uid) >= 20 then
        raise exception 'limit_reached';
      end if;
      insert into saved_travellers
        (user_id, label, full_name, nationality, phone, email, id_type, id_last4)
      values (
        uid,
        coalesce(p_payload->>'label', ''),
        p_payload->>'full_name',
        coalesce(p_payload->>'nationality', 'IN'),
        coalesce(p_payload->>'phone', ''),
        coalesce(p_payload->>'email', ''),
        p_payload->>'id_type',
        right(p_payload->>'id_last4', 4)
      );
    else
      update saved_travellers set
        label = coalesce(p_payload->>'label', label),
        full_name = coalesce(p_payload->>'full_name', full_name),
        nationality = coalesce(p_payload->>'nationality', nationality),
        phone = coalesce(p_payload->>'phone', phone),
        email = coalesce(p_payload->>'email', email),
        id_type = coalesce(p_payload->>'id_type', id_type),
        id_last4 = coalesce(right(p_payload->>'id_last4', 4), id_last4),
        last_used_at = now()
      where id = (p_payload->>'id')::bigint and user_id = uid;
    end if;
    return jsonb_build_object('ok', true);
  elsif p_op = 'delete' then
    delete from saved_travellers
      where id = (p_payload->>'id')::bigint and user_id = uid;
    return jsonb_build_object('ok', true);
  end if;
  raise exception 'unknown_op';
end;
$$;

revoke all on function tw_saved_travellers(text, jsonb) from public;

do $$
begin
  if exists (select 1 from pg_roles where rolname = 'anon')
     and exists (select 1 from pg_roles where rolname = 'authenticated') then
    execute 'drop policy if exists "block_client_saved_travellers" on saved_travellers';
    execute 'create policy "block_client_saved_travellers" on saved_travellers for all to anon, authenticated using (false) with check (false)';
    execute 'revoke all on saved_travellers from anon, authenticated';
    execute 'revoke all on function tw_saved_travellers(text, jsonb) from anon, authenticated';
  end if;
  if exists (select 1 from pg_roles where rolname = 'service_role') then
    execute 'grant all on saved_travellers to service_role';
    execute 'grant execute on function tw_saved_travellers(text, jsonb) to service_role';
  end if;
end $$;
