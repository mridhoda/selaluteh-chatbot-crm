-- 023_payments_xendit_canonical.sql
-- Add missing payment_xendit tables for spec

create table if not exists payment_sessions (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  payment_id uuid not null references payments(id) on delete cascade,
  order_id uuid not null references orders(id) on delete cascade,
  provider text not null default 'xendit',
  provider_session_id text,
  reference_id text,
  status text not null default 'ACTIVE',
  mode text not null default 'PAYMENT_LINK',
  amount bigint not null,
  currency text not null default 'IDR',
  payment_url text,
  expires_at timestamptz,
  is_current boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_payment_sessions_updated_at
  before update on payment_sessions
  for each row execute function set_updated_at();

create index idx_payment_sessions_payment on payment_sessions(payment_id);
create index idx_payment_sessions_provider_session on payment_sessions(provider_session_id);

create table if not exists payment_webhook_events (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid,
  payment_id uuid references payments(id) on delete set null,
  provider text not null,
  provider_event_id text,
  event_type text not null,
  deduplication_key text,
  payload_hash text,
  raw_payload jsonb,
  verification_result text,
  processing_status text not null default 'received',
  processed_at timestamptz,
  created_at timestamptz not null default now()
);

create unique index uq_payment_webhook_dedup on payment_webhook_events(provider, provider_event_id) where provider_event_id is not null;
create index idx_payment_webhook_processing on payment_webhook_events(processing_status, created_at);
