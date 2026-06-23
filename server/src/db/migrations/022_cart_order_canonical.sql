-- 022_cart_order_canonical.sql
-- Alpha slice: add missing cart/order tables for cart-order-lifecycle spec
-- Task 2 per selaluteh-cart-order-lifecycle

-- order_status_history (already exists as order_events, but add canonical history)
create table if not exists order_status_history (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  order_id uuid not null references orders(id) on delete cascade,
  from_status text,
  to_status text not null,
  actor_type text not null,
  actor_id text,
  reason_code text,
  reason_text text,
  source_event_id text,
  created_at timestamptz not null default now()
);

create index if not exists idx_order_status_history_order on order_status_history(order_id, created_at);

-- order_inventory_links
create table if not exists order_inventory_links (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  order_id uuid not null references orders(id) on delete cascade,
  reservation_group_id text,
  commit_transaction_id text,
  release_transaction_id text,
  status text not null default 'pending',
  updated_at timestamptz not null default now()
);

create index if not exists idx_order_inventory_links_order on order_inventory_links(order_id);

-- order_notes
create table if not exists order_notes (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  order_id uuid not null references orders(id) on delete cascade,
  outlet_id uuid not null references outlets(id) on delete cascade,
  author_id uuid not null references users(id) on delete cascade,
  note_text text not null,
  created_at timestamptz not null default now(),
  edited_at timestamptz
);

create index if not exists idx_order_notes_order on order_notes(order_id, created_at);

-- order_idempotency_records
create table if not exists order_idempotency_records (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  idempotency_key text not null,
  command_type text not null,
  request_hash text not null,
  resource_id uuid,
  response_snapshot jsonb,
  created_at timestamptz not null default now(),
  expires_at timestamptz,
  constraint uq_order_idempotency unique (workspace_id, command_type, idempotency_key)
);

create index if not exists idx_order_idempotency_lookup on order_idempotency_records(workspace_id, command_type, idempotency_key);
