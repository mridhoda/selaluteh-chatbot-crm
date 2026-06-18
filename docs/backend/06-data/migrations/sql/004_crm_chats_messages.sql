-- 004_crm_chats_messages.sql
-- CRM contacts, chats, chat_messages, webhook idempotency, and AI action audit.

create table if not exists contacts (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  platform_id uuid null references platforms(id) on delete set null,
  external_id text not null,
  name text not null default '',
  phone text null,
  email citext null,
  handle text null,
  tags text[] not null default '{}',
  last_outlet_id uuid null references outlets(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint contacts_platform_identity_unique unique (workspace_id, platform_id, external_id)
);

create trigger set_contacts_updated_at
before update on contacts
for each row execute function set_updated_at();

create table if not exists chats (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  platform_id uuid not null references platforms(id) on delete cascade,
  contact_id uuid not null references contacts(id) on delete cascade,
  current_outlet_id uuid null references outlets(id) on delete set null,
  status chat_status not null default 'open',
  ai_enabled boolean not null default true,
  is_blocked boolean not null default false,
  is_escalated boolean not null default false,
  taken_over_by_user_id uuid null references users(id) on delete set null,
  assigned_at timestamptz null,
  resolved_at timestamptz null,
  last_message_at timestamptz null,
  state jsonb not null default '{}'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint chats_platform_contact_unique unique (workspace_id, platform_id, contact_id)
);

create trigger set_chats_updated_at
before update on chats
for each row execute function set_updated_at();

create table if not exists chat_messages (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  chat_id uuid not null references chats(id) on delete cascade,
  platform_id uuid not null references platforms(id) on delete cascade,
  contact_id uuid not null references contacts(id) on delete cascade,
  sender_type chat_message_sender not null,
  user_id uuid null references users(id) on delete set null,
  direction chat_message_direction not null,
  message_type chat_message_type not null default 'text',
  content text null,
  attachment_file_id uuid null,
  platform_message_id text null,
  raw_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists webhook_events (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid null references workspaces(id) on delete cascade,
  platform_id uuid null references platforms(id) on delete set null,
  provider text not null,
  event_type text not null default '',
  external_event_id text not null,
  status webhook_event_status not null default 'received',
  payload_hash text null,
  payload jsonb not null default '{}'::jsonb,
  signature_valid boolean null,
  attempt_count integer not null default 1,
  error text null,
  received_at timestamptz not null default now(),
  processed_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint webhook_events_attempt_count_positive check (attempt_count > 0),
  constraint webhook_events_payload_hash_required check (payload_hash is null or payload_hash <> '')
);

create trigger set_webhook_events_updated_at
before update on webhook_events
for each row execute function set_updated_at();

create table if not exists ai_actions (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  chat_id uuid null references chats(id) on delete cascade,
  chat_message_id uuid null references chat_messages(id) on delete set null,
  agent_id uuid null references agents(id) on delete set null,
  action_type text not null,
  status ai_action_status not null default 'proposed',
  input jsonb not null default '{}'::jsonb,
  output jsonb not null default '{}'::jsonb,
  error text null,
  confirmed_at timestamptz null,
  executed_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_ai_actions_updated_at
before update on ai_actions
for each row execute function set_updated_at();
