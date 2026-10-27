-- Ask TripWeave threads and the hourly cap. No passport numbers.
-- Paste after schema.sql. Safe to re-run.

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

create table if not exists public.ask_hits (
  user_id text not null,
  asked_at timestamptz not null default now()
);

create index if not exists ask_hits_user_idx on public.ask_hits (user_id, asked_at);

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

create or replace function public.tw_ask(p_gate text, p_op text, p_payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  uid text := nullif(p_payload->>'user_id', '');
  code text := nullif(p_payload->>'confirmation_code', '');
  n int;
begin
  if coalesce(auth.role(), '') is distinct from 'service_role'
     and session_user not in ('postgres', 'supabase_admin') then
    raise exception 'forbidden';
  end if;
  if uid is null then
    raise exception 'missing_user';
  end if;
  delete from public.ask_hits where asked_at < now() - interval '2 hours';
  delete from public.ask_turns where created_at < now() - interval '90 days';
  if p_op = 'take' then
    select count(*) into n
    from public.ask_hits
    where user_id = uid and asked_at > now() - interval '1 hour';
    if n >= 10 then
      return jsonb_build_object('ok', false);
    end if;
    insert into public.ask_hits (user_id) values (uid);
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
    return jsonb_build_object('ok', true);
  end if;
  raise exception 'unknown_op';
end;
$$;

revoke all on function public.tw_ask(text, text, jsonb) from public, anon, authenticated;
grant execute on function public.tw_ask(text, text, jsonb) to service_role;

notify pgrst, 'reload schema';
