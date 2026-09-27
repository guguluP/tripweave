-- Money ops: list pending/gateway_done refunds for the hourly cron (all guests).
create or replace function tw_list_pending_refund_intents(p_payload jsonb)
returns jsonb
language sql
stable
set search_path = public
as $$
  select coalesce((
    select jsonb_agg(to_jsonb(r) order by r.created_at)
    from refund_intents r
    where r.status in ('pending', 'gateway_done')
  ), '[]'::jsonb);
$$;

revoke all on function tw_list_pending_refund_intents(jsonb) from public;
