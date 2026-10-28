-- Insert-only claim for payment reconcile jobs (rec_<paymentId>).
-- A booking job and a mismatch-refund job for the same payment can no longer overwrite each
-- other: the first claim wins and the loser gets the existing row back.
-- Paste after ops_durability.sql. Safe to re-run.

create or replace function public.tw_claim_reconcile_job(p_gate text, p_payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id text := p_payload->>'id';
  v_uid text := p_payload->>'user_id';
  v_pay text := p_payload->>'payment_id';
  v_state text := coalesce(nullif(p_payload->>'state', ''), 'queued');
  v_err text := nullif(p_payload->>'last_error', '');
  v_row public.payment_reconcile_jobs%rowtype;
  v_inserted int;
begin
  if coalesce(auth.role(), '') is distinct from 'service_role'
     and session_user not in ('postgres', 'supabase_admin') then
    raise exception 'forbidden';
  end if;
  if v_id is null or v_uid is null or v_pay is null or v_pay = '' then
    raise exception 'invalid_job';
  end if;
  if v_state not in ('queued', 'done', 'failed', 'refunded') then
    raise exception 'invalid_job';
  end if;
  perform pg_advisory_xact_lock(hashtext('tw_reconcile:' || v_pay));
  insert into public.payment_reconcile_jobs (
    id, user_id, payment_id, order_id, attempts, last_error, payload, state, created_at, updated_at
  ) values (
    v_id, v_uid, v_pay, nullif(p_payload->>'order_id', ''),
    coalesce((p_payload->>'attempts')::int, 0), v_err,
    coalesce(p_payload->'payload', '{}'::jsonb), v_state,
    coalesce(nullif(p_payload->>'created_at', '')::timestamptz, now()), now()
  )
  on conflict do nothing;
  get diagnostics v_inserted = row_count;
  if v_inserted = 1 then
    return jsonb_build_object('won', true);
  end if;
  select * into v_row from public.payment_reconcile_jobs
  where id = v_id or payment_id = v_pay
  order by (id = v_id) desc
  limit 1
  for update;
  -- A booking job that already failed for good (amount or stay mismatch) never books again,
  -- so a refund marker may take its place.
  if found and v_err = 'stay_mismatch_refund' and v_row.state = 'failed'
     and v_row.last_error is distinct from 'stay_mismatch_refund' and v_row.user_id = v_uid then
    update public.payment_reconcile_jobs
    set attempts = 0, last_error = v_err, payload = coalesce(p_payload->'payload', '{}'::jsonb),
        state = 'queued', updated_at = now()
    where id = v_row.id;
    return jsonb_build_object('won', true);
  end if;
  return jsonb_build_object('won', false, 'job', case when found then to_jsonb(v_row) else null end);
end;
$$;

revoke all on function public.tw_claim_reconcile_job(text, jsonb) from public, anon, authenticated;
grant execute on function public.tw_claim_reconcile_job(text, jsonb) to service_role;

-- Backstop for the plain upsert (tw_save_reconcile_job): a refund marker never turns back into a
-- booking job, and a live booking job never turns into a refund marker.
create or replace function public.tw_reconcile_job_guard()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if old.last_error = 'stay_mismatch_refund' and new.last_error is distinct from 'stay_mismatch_refund' then
    raise exception 'reconcile_job_is_refund';
  end if;
  if old.last_error is distinct from 'stay_mismatch_refund' and new.last_error = 'stay_mismatch_refund'
     and old.state <> 'failed' then
    raise exception 'reconcile_job_is_booking';
  end if;
  return new;
end;
$$;

drop trigger if exists tw_reconcile_job_guard on public.payment_reconcile_jobs;
create trigger tw_reconcile_job_guard
  before update on public.payment_reconcile_jobs
  for each row execute function public.tw_reconcile_job_guard();

revoke all on function public.tw_reconcile_job_guard() from public, anon, authenticated;

notify pgrst, 'reload schema';
