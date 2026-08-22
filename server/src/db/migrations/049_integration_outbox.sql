-- 049_integration_outbox.sql
-- Fase 4 reliability layer for Online Store -> TATA-POS sales ingestion
-- (TATA-POS repo: specs/backlog/modul-online-store-ingestion/requirements.md
-- R10). Durable outbox table only, in this migration -- the worker that
-- drains it lives in server/src/workers/integration-outbox-dispatch.worker.js
-- and is not registered/started yet; nothing enqueues into this table yet
-- either (that hook-up is a separate, later change). Additive only.
--
-- event_type values match exactly what TATA-POS's
-- private.import_external_sales_order RPC accepts (confirmed directly
-- against TATA-POS repo's
-- docs/mvp/tata-pos-supabase-p0/supabase/migrations/
-- 20260822150000_import_external_sales_order_fulfillment_updated.sql:130).

create table if not exists integration_outbox (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  order_id uuid not null references orders(id) on delete cascade,
  event_type text not null check (event_type in (
    'order.paid', 'order.completed', 'order.refunded', 'order.voided', 'order.fulfillment_updated'
  )),
  -- Snapshotted at enqueue time, not recomputed at send time -- the worker
  -- sends this payload verbatim.
  payload jsonb not null,
  status text not null default 'pending' check (status in ('pending', 'sending', 'delivered', 'dead')),
  attempts int not null default 0 check (attempts >= 0),
  max_attempts int not null default 8 check (max_attempts > 0),
  next_attempt_at timestamptz not null default now(),
  last_error text null,
  created_at timestamptz not null default now(),
  delivered_at timestamptz null
);

create index if not exists integration_outbox_dispatch_idx
  on integration_outbox (status, next_attempt_at)
  where status in ('pending', 'sending');
