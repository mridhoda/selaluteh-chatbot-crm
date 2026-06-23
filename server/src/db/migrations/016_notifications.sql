-- 016_notifications.sql
-- Task 17.2 & 17.3: Notification delivery tracking

create table if not exists notification_deliveries (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  idempotency_key text unique,
  notification_type text not null check (notification_type in ('payment_link', 'payment_paid', 'order_ready', 'order_cancelled', 'contact_welcome', 'outlet_selection', 'product_catalog', 'cart_summary')),
  channel text not null check (channel in ('telegram', 'whatsapp', 'instagram')),
  contact_id uuid references contacts(id) on delete set null,
  outlet_id uuid references outlets(id) on delete set null,
  message_id text,
  template text,
  variables jsonb,
  priority text not null default 'normal' check (priority in ('low', 'normal', 'high')),
  status text not null default 'pending' check (status in ('pending', 'delivered', 'failed', 'skipped')),
  delivered_at timestamptz,
  failed_at timestamptz,
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_notification_deliveries_updated_at
before update on notification_deliveries
for each row execute function set_updated_at();

create index if not exists notification_deliveries_workspace_id_idx on notification_deliveries(workspace_id);
create index if not exists notification_deliveries_idempotency_key_idx on notification_deliveries(idempotency_key);
create index if not exists notification_deliveries_notification_type_idx on notification_deliveries(notification_type);
create index if not exists notification_deliveries_channel_idx on notification_deliveries(channel);
create index if not exists notification_deliveries_contact_id_idx on notification_deliveries(contact_id);
create index if not exists notification_deliveries_outlet_id_idx on notification_deliveries(outlet_id);
create index if not exists notification_deliveries_status_idx on notification_deliveries(status);
create index if not exists notification_deliveries_created_at_idx on notification_deliveries(created_at);

create index if not exists notification_deliveries_pending_idx on notification_deliveries(workspace_id, status, created_at);