-- Apply in Supabase SQL editor after ops_durability.sql (or merge into it).
create or replace function public.tw_list_pending_refund_intents(p_gate text, p_payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  if coalesce(auth.role(), '') is distinct from 'service_role'
     and session_user not in ('postgres', 'supabase_admin') then
    raise exception 'forbidden';
  end if;
  return coalesce((
    select jsonb_agg(to_jsonb(r) order by r.created_at)
    from public.refund_intents r
    where r.status in ('pending', 'gateway_done')
  ), '[]'::jsonb);
end;
$$;

revoke all on function public.tw_list_pending_refund_intents(text, jsonb) from public;
grant execute on function public.tw_list_pending_refund_intents(text, jsonb) to service_role;
revoke all on function public.tw_list_pending_refund_intents(text, jsonb) from anon, authenticated;
