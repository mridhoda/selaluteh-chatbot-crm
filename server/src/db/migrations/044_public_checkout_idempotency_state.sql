-- 044_public_checkout_idempotency_state.sql
-- Phase 4.5 public checkout idempotency state hardening.
-- Additive only: no credential, provider-setting, or destructive changes.

alter table if exists order_idempotency_records
  add column if not exists status text not null default 'completed',
  add column if not exists error_snapshot jsonb null;

do $$
begin
  if to_regclass('public.order_idempotency_records') is not null then
    if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'order_idempotency_records' and column_name = 'command_type') then
      update order_idempotency_records
      set status = case
        when response_snapshot is not null then 'completed'
        when error_snapshot is not null then 'failed'
        else 'processing'
      end
      where command_type = 'public_checkout'
        and status is null;
    end if;

    if not exists (select 1 from pg_constraint where conname = 'order_idempotency_records_status_check') then
      alter table order_idempotency_records add constraint order_idempotency_records_status_check
        check (status in ('processing', 'completed', 'failed')) not valid;
    end if;
  end if;
end $$;

do $$
begin
  if to_regclass('public.order_idempotency_records') is not null then
    execute 'create index if not exists order_idempotency_records_public_checkout_status_idx on order_idempotency_records(workspace_id, idempotency_key, status) where command_type = ''public_checkout''';
  end if;
end $$;
