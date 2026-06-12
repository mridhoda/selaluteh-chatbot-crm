-- 004_crm_chats_messages.sql
-- CRM contacts, chats, messages, webhook idempotency, and AI action audit tables.
--
-- This keeps the current behavior: platform webhook -> contact upsert -> chat upsert
-- -> message insert -> AI/human flow.

create table if not exists contacts (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  owner_user_id uuid null references users(id) on delete set null,
  name text not null default '',
  platform_type platform_type not null,
  platform_account_id text not null,
  handle text null,
  phone text null,
  email citext null,
  last_seen timestamptz null,
  tags text[] not null default '{}',
  notes text null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint contacts_platform_identity_unique unique (workspace_id, platform_type, platform_account_id)
);

create trigger set_contacts_updated_at
before update on contacts
for each row execute function set_updated_at();

create table if not exists chats (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  owner_user_id uuid null references users(id) on delete set null,
  agent_id uuid null references agents(id) on delete set null,
  contact_id uuid not null references contacts(id) on delete cascade,
  platform_id uuid null references platforms(id) on delete set null,
  platform_type platform_type not null,
  unread integer not null default 0 check (unread >= 0),
  last_message_at timestamptz null,
  takeover_by uuid null references users(id) on delete set null,
  is_escalated boolean not null default false,
  status chat_status not null default 'open',
  state jsonb not null default '{}'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint chats_platform_contact_unique unique (workspace_id, platform_id, contact_id)
);

create trigger set_chats_updated_at
before update on chats
for each row execute function set_updated_at();

create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  chat_id uuid not null references chats(id) on delete cascade,
  sender message_sender not null,
  kind message_kind not null default 'text',
  text text null,
  attachment_file_id uuid null,
  attachment jsonb not null default '{}'::jsonb,
  reply_to uuid null references messages(id) on delete set null,
  platform_message_id text null,
  platform_thread_id text null,
  raw_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_messages_updated_at
before update on messages
for each row execute function set_updated_at();

-- Public webhooks write through backend service role. This table makes webhook
-- processing idempotent for Telegram/Meta/payment providers.
create table if not exists webhook_events (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid null references workspaces(id) on delete cascade,
  platform_id uuid null references platforms(id) on delete set null,
  provider text not null,
  event_type text not null default '',
  external_event_id text not null,
  status webhook_event_status not null default 'received',
  payload jsonb not null default '{}'::jsonb,
  error text null,
  received_at timestamptz not null default now(),
  processed_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint webhook_events_provider_external_unique unique (provider, external_event_id)
);

create trigger set_webhook_events_updated_at
before update on webhook_events
for each row execute function set_updated_at();

-- AI action audit. AI can propose commerce actions, but checkout/order/payment
-- must be confirmed and executed by deterministic backend services.
create table if not exists ai_actions (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  chat_id uuid null references chats(id) on delete cascade,
  message_id uuid null references messages(id) on delete set null,
  agent_id uuid null references agents(id) on delete set null,
  action_type text not null,
  status ai_action_status not null default 'proposed',
  input jsonb not null default '{}'::jsonb,
  output jsonb not null default '{}'::jsonb,
  error text null,
  confirmed_by_user_at timestamptz null,
  executed_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_ai_actions_updated_at
before update on ai_actions
for each row execute function set_updated_at();
