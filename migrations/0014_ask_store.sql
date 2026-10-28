-- Ask TripWeave on local Postgres / PGLite: the same tw_ask function as supabase/ask_turns.sql
-- so local dev keeps threads and caps in the database. Roles anon / authenticated /
-- service_role are applied only when they exist (same pattern as 0010), so this file is also
-- safe when the deploy build runs migrations against the Supabase database.

alter table ask_hits add column if not exists bucket text not null default 'typed';
drop index if exists ask_hits_user_idx;
create index if not exists ask_hits_user_bucket_idx on ask_hits (user_id, bucket, asked_at);
create index if not exists ask_turns_created_idx on ask_turns (created_at);

create or replace function tw_ask(p_op text, p_payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  uid text := nullif(p_payload->>'user_id', '');
  code text := nullif(p_payload->>'confirmation_code', '');
  v_bucket text := coalesce(nullif(p_payload->>'bucket', ''), 'typed');
  lim int;
  win interval;
  n int;
begin
  if uid is null then
    raise exception 'missing_user';
  end if;
  delete from ask_hits where asked_at < now() - interval '25 hours';
  delete from ask_turns where created_at < now() - interval '90 days';
  if p_op = 'take' then
    if v_bucket = 'typed' then
      lim := 10; win := interval '1 hour';
    elsif v_bucket = 'suggest' then
      lim := 60; win := interval '1 hour';
    elsif v_bucket like 'car:%' and length(v_bucket) between 7 and 44 then
      lim := 3; win := interval '24 hours';
    else
      raise exception 'unknown_bucket';
    end if;
    perform pg_advisory_xact_lock(hashtext('tw_ask:' || uid || ':' || v_bucket));
    select count(*) into n
    from ask_hits
    where user_id = uid and bucket = v_bucket and asked_at > now() - win;
    if n >= lim then
      return jsonb_build_object('ok', false);
    end if;
    insert into ask_hits (user_id, bucket) values (uid, v_bucket);
    return jsonb_build_object('ok', true);
  elsif p_op = 'list' then
    if code is null then
      return '[]'::jsonb;
    end if;
    return coalesce((
      select jsonb_agg(jsonb_build_object('question', question, 'answer', answer) order by created_at)
      from (
        select question, answer, created_at
        from ask_turns
        where user_id = uid and confirmation_code = code
        order by created_at desc
        limit 20
      ) recent
    ), '[]'::jsonb);
  elsif p_op = 'append' then
    if code is null then
      return jsonb_build_object('ok', false);
    end if;
    insert into ask_turns (user_id, confirmation_code, question, answer)
    values (uid, code, left(coalesce(p_payload->>'question', ''), 400), left(coalesce(p_payload->>'answer', ''), 1200));
    delete from ask_turns
    where user_id = uid and confirmation_code = code
      and id not in (
        select id from ask_turns
        where user_id = uid and confirmation_code = code
        order by created_at desc, id desc
        limit 20
      );
    return jsonb_build_object('ok', true);
  elsif p_op = 'forget' then
    if code is null then
      return jsonb_build_object('ok', false);
    end if;
    delete from ask_turns where user_id = uid and confirmation_code = code;
    delete from ask_hits where user_id = uid and bucket = 'car:' || upper(code);
    return jsonb_build_object('ok', true);
  elsif p_op = 'forget_user' then
    delete from ask_turns where user_id = uid;
    delete from ask_hits where user_id = uid;
    return jsonb_build_object('ok', true);
  end if;
  raise exception 'unknown_op';
end;
$$;

create or replace function tw_ask_forget_booking()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'DELETE' then
    delete from ask_turns where user_id = old.user_id and confirmation_code = old.confirmation_code;
    return old;
  end if;
  if new.status in ('cancelled', 'refunded') and new.status is distinct from old.status then
    delete from ask_turns where user_id = new.user_id and confirmation_code = new.confirmation_code;
  end if;
  return new;
end;
$$;

drop trigger if exists tw_ask_forget_booking on bookings;
create trigger tw_ask_forget_booking
  after update of status or delete on bookings
  for each row execute function tw_ask_forget_booking();

create or replace function tw_ask_forget_user()
returns trigger
language plpgsql
as $$
begin
  delete from ask_turns where user_id = old.id;
  delete from ask_hits where user_id = old.id;
  return old;
end;
$$;

do $$
begin
  if to_regclass('"user"') is not null then
    execute 'drop trigger if exists tw_ask_forget_user on "user"';
    execute 'create trigger tw_ask_forget_user after delete on "user" for each row execute function tw_ask_forget_user()';
  end if;
end;
$$;

revoke all on function tw_ask(text, jsonb) from public;
revoke all on function tw_ask_forget_booking() from public;
revoke all on function tw_ask_forget_user() from public;

do $$
begin
  if exists (select 1 from pg_roles where rolname = 'anon')
     and exists (select 1 from pg_roles where rolname = 'authenticated') then
    execute 'alter table ask_turns enable row level security';
    execute 'alter table ask_hits enable row level security';
    execute 'drop policy if exists "block_client_ask_turns" on ask_turns';
    execute 'drop policy if exists "block_client_ask_hits" on ask_hits';
    execute 'create policy "block_client_ask_turns" on ask_turns for all to anon, authenticated using (false) with check (false)';
    execute 'create policy "block_client_ask_hits" on ask_hits for all to anon, authenticated using (false) with check (false)';
    execute 'revoke all on ask_turns from anon, authenticated';
    execute 'revoke all on ask_hits from anon, authenticated';
    execute 'revoke all on function tw_ask(text, jsonb) from anon, authenticated';
  end if;
  if exists (select 1 from pg_roles where rolname = 'service_role') then
    execute 'grant all on ask_turns to service_role';
    execute 'grant all on ask_hits to service_role';
    execute 'grant execute on function tw_ask(text, jsonb) to service_role';
  end if;
end $$;
