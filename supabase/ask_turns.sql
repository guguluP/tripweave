-- Ask TripWeave threads and the ask caps. No passport numbers: the app stores a redacted
-- placeholder instead of any question that looks like a document number.
-- Paste after schema.sql (and auth_identity.sql if you use it). Safe to re-run.

create table if not exists public.ask_turns (
  id bigint generated always as identity primary key,
  user_id text not null,
  confirmation_code text not null,
  question text not null,
  answer text not null,
  created_at timestamptz not null default now()
);

create index if not exists ask_turns_user_code_idx
  on public.ask_turns (user_id, confirmation_code, created_at);
create index if not exists ask_turns_created_idx on public.ask_turns (created_at);

create table if not exists public.ask_hits (
  user_id text not null,
  asked_at timestamptz not null default now()
);
-- typed | suggest | car:<CONFIRMATION CODE>
alter table public.ask_hits add column if not exists bucket text not null default 'typed';

drop index if exists public.ask_hits_user_idx;
create index if not exists ask_hits_user_bucket_idx on public.ask_hits (user_id, bucket, asked_at);

alter table public.ask_turns enable row level security;
alter table public.ask_hits enable row level security;
drop policy if exists "block_client_ask_turns" on public.ask_turns;
drop policy if exists "block_client_ask_hits" on public.ask_hits;
create policy "block_client_ask_turns"
  on public.ask_turns for all to anon, authenticated
  using (false) with check (false);
create policy "block_client_ask_hits"
  on public.ask_hits for all to anon, authenticated
  using (false) with check (false);
revoke all on public.ask_turns from public, anon, authenticated;
revoke all on public.ask_hits from public, anon, authenticated;
grant all on public.ask_turns to service_role;
grant all on public.ask_hits to service_role;

-- The earlier draft took an unused p_gate. Access is the service-role check below, so the
-- parameter is gone (D13).
drop function if exists public.tw_ask(text, text, jsonb);

create or replace function public.tw_ask(p_op text, p_payload jsonb)
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
  if coalesce(auth.role(), '') is distinct from 'service_role'
     and session_user not in ('postgres', 'supabase_admin') then
    raise exception 'forbidden';
  end if;
  if uid is null then
    raise exception 'missing_user';
  end if;
  delete from public.ask_hits where asked_at < now() - interval '25 hours';
  delete from public.ask_turns where created_at < now() - interval '90 days';
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
    -- One caller at a time per user + bucket, so parallel asks cannot pass the cap.
    perform pg_advisory_xact_lock(hashtext('tw_ask:' || uid || ':' || v_bucket));
    select count(*) into n
    from public.ask_hits
    where user_id = uid and bucket = v_bucket and asked_at > now() - win;
    if n >= lim then
      return jsonb_build_object('ok', false);
    end if;
    insert into public.ask_hits (user_id, bucket) values (uid, v_bucket);
    return jsonb_build_object('ok', true);
  elsif p_op = 'list' then
    if code is null then
      return '[]'::jsonb;
    end if;
    return coalesce((
      select jsonb_agg(jsonb_build_object('question', question, 'answer', answer) order by created_at)
      from (
        select question, answer, created_at
        from public.ask_turns
        where user_id = uid and confirmation_code = code
        order by created_at desc
        limit 20
      ) recent
    ), '[]'::jsonb);
  elsif p_op = 'append' then
    if code is null then
      return jsonb_build_object('ok', false);
    end if;
    insert into public.ask_turns (user_id, confirmation_code, question, answer)
    values (
      uid,
      code,
      left(coalesce(p_payload->>'question', ''), 400),
      left(coalesce(p_payload->>'answer', ''), 1200)
    );
    delete from public.ask_turns
    where user_id = uid and confirmation_code = code
      and id not in (
        select id from public.ask_turns
        where user_id = uid and confirmation_code = code
        order by created_at desc, id desc
        limit 20
      );
    return jsonb_build_object('ok', true);
  elsif p_op = 'forget' then
    if code is null then
      return jsonb_build_object('ok', false);
    end if;
    delete from public.ask_turns where user_id = uid and confirmation_code = code;
    delete from public.ask_hits where user_id = uid and bucket = 'car:' || upper(code);
    return jsonb_build_object('ok', true);
  elsif p_op = 'forget_user' then
    delete from public.ask_turns where user_id = uid;
    delete from public.ask_hits where user_id = uid;
    return jsonb_build_object('ok', true);
  end if;
  raise exception 'unknown_op';
end;
$$;

revoke all on function public.tw_ask(text, jsonb) from public, anon, authenticated;
grant execute on function public.tw_ask(text, jsonb) to service_role;

-- A cancelled or refunded stay (any code path, including the hotel desk) and a deleted
-- booking lose their Ask thread.
create or replace function public.tw_ask_forget_booking()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'DELETE' then
    delete from public.ask_turns where user_id = old.user_id and confirmation_code = old.confirmation_code;
    return old;
  end if;
  if new.status in ('cancelled', 'refunded') and new.status is distinct from old.status then
    delete from public.ask_turns where user_id = new.user_id and confirmation_code = new.confirmation_code;
  end if;
  return new;
end;
$$;

drop trigger if exists tw_ask_forget_booking on public.bookings;
create trigger tw_ask_forget_booking
  after update of status or delete on public.bookings
  for each row execute function public.tw_ask_forget_booking();

-- A deleted account loses every Ask thread and cap row.
create or replace function public.tw_ask_forget_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.ask_turns where user_id = old.id;
  delete from public.ask_hits where user_id = old.id;
  return old;
end;
$$;

do $$
begin
  if to_regclass('public.ba_user') is not null then
    execute 'drop trigger if exists tw_ask_forget_user on public.ba_user';
    execute 'create trigger tw_ask_forget_user after delete on public.ba_user
             for each row execute function public.tw_ask_forget_user()';
  end if;
end;
$$;

revoke all on function public.tw_ask_forget_booking() from public, anon, authenticated;
revoke all on function public.tw_ask_forget_user() from public, anon, authenticated;

-- Optional: purge old rows even on days nobody asks (needs the pg_cron extension).
-- select cron.schedule('tw-ask-purge', '17 3 * * *',
--   $cron$delete from public.ask_turns where created_at < now() - interval '90 days';
--         delete from public.ask_hits where asked_at < now() - interval '25 hours'$cron$);

notify pgrst, 'reload schema';
