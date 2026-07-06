alter table if exists orders
  add column if not exists public_order_token text,
  add column if not exists channel text not null default 'online_store',
  add column if not exists qr_session_id uuid,
  add column if not exists table_id uuid,
  add column if not exists qr_location_label text,
  add column if not exists cancel_reason text,
  add column if not exists cancelled_by uuid,
  add column if not exists cancelled_actor_role text;

create unique index if not exists orders_public_order_token_key
  on orders(public_order_token)
  where public_order_token is not null;

create index if not exists orders_channel_idx on orders(channel);
create index if not exists orders_fulfillment_status_idx on orders(fulfillment_status);
create index if not exists orders_public_status_lookup_idx on orders(public_order_token, payment_status, fulfillment_status);

update orders
set fulfillment_status = 'not_started'
where fulfillment_status is null or fulfillment_status = 'unfulfilled';

create table if not exists qr_order_sessions (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  outlet_id uuid not null references outlets(id) on delete cascade,
  qr_token_hash text unique not null,
  table_id uuid null,
  table_label text null,
  location_label text null,
  fulfillment_type text not null default 'pickup',
  is_active boolean not null default true,
  expires_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists qr_order_sessions_workspace_idx on qr_order_sessions(workspace_id);
create index if not exists qr_order_sessions_outlet_idx on qr_order_sessions(outlet_id);
create index if not exists qr_order_sessions_active_idx on qr_order_sessions(is_active, expires_at);
