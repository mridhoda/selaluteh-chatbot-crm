-- Additive Telegram multi-tenant channel connection schema.
-- This migration intentionally keeps legacy platforms/contacts/chats columns.

create table if not exists channel_connections (
  id uuid primary key default gen_random_uuid(),
  public_id text not null,

  workspace_id uuid not null references workspaces(id),
  provider text not null,

  provider_account_id text not null,
  provider_username text,
  display_name text,

  credential_ciphertext text not null,
  credential_key_version text not null,
  credential_fingerprint text not null,

  webhook_secret_ciphertext text not null,
  webhook_secret_hash text not null,
  webhook_secret_version integer not null default 1,

  connection_status text not null default 'DRAFT',
  webhook_status text not null default 'NOT_REGISTERED',
  webhook_url text,
  allowed_updates jsonb not null default '[]'::jsonb,

  last_webhook_registered_at timestamptz,
  last_webhook_verified_at timestamptz,
  last_webhook_received_at timestamptz,
  last_outbound_success_at timestamptz,
  last_reconciled_at timestamptz,

  pending_update_count integer,
  last_error_code text,
  last_error_message text,

  created_by uuid references users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz,
  version integer not null default 1,

  constraint channel_connections_provider_nonempty check (provider <> ''),
  constraint channel_connections_public_id_nonempty check (public_id <> ''),
  constraint channel_connections_status_valid check (
    connection_status in ('DRAFT','VALIDATING','CONNECTING','CONNECTED','DEGRADED','DISABLED','REVOKED','ERROR','ARCHIVED')
  ),
  constraint channel_connections_webhook_status_valid check (
    webhook_status in ('NOT_REGISTERED','REGISTERING','REGISTERED','VERIFYING','VERIFIED','ERROR','REMOVED')
  ),
  constraint channel_connections_allowed_updates_array check (jsonb_typeof(allowed_updates) = 'array')
);

create unique index if not exists uq_channel_connections_public_id
  on channel_connections(public_id);

create unique index if not exists uq_channel_connections_provider_account_active
  on channel_connections(provider, provider_account_id)
  where archived_at is null;

create unique index if not exists uq_channel_connections_provider_fingerprint_active
  on channel_connections(provider, credential_fingerprint)
  where archived_at is null;

create index if not exists idx_channel_connections_workspace_provider_status
  on channel_connections(workspace_id, provider, connection_status);

create table if not exists outlet_channel_assignments (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id),
  outlet_id uuid not null references outlets(id),
  channel_connection_id uuid not null references channel_connections(id),
  status text not null default 'ACTIVE',
  accepts_chats boolean not null default true,
  accepts_orders boolean not null default true,
  routing_mode text not null default 'CUSTOMER_SELECT',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  version integer not null default 1,
  constraint outlet_channel_assignments_status_valid check (status in ('ACTIVE','DISABLED','ARCHIVED')),
  constraint outlet_channel_assignments_routing_valid check (routing_mode in ('AUTO','CUSTOMER_SELECT','DISABLED'))
);

create unique index if not exists uq_outlet_channel_assignments_outlet_connection
  on outlet_channel_assignments(outlet_id, channel_connection_id);

create index if not exists idx_outlet_channel_assignments_workspace
  on outlet_channel_assignments(workspace_id, channel_connection_id, status);

create table if not exists telegram_webhook_events (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id),
  connection_id uuid not null references channel_connections(id),
  update_id bigint not null,
  update_type text,
  payload jsonb not null,
  status text not null default 'PENDING',
  attempt_count integer not null default 0,
  received_at timestamptz not null default now(),
  available_at timestamptz not null default now(),
  processing_started_at timestamptz,
  processed_at timestamptz,
  failed_at timestamptz,
  error_code text,
  safe_error_message text,
  correlation_id text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint telegram_webhook_events_status_valid check (status in ('PENDING','PROCESSING','PROCESSED','RETRY','DEAD_LETTER','IGNORED')),
  constraint telegram_webhook_events_attempt_count_nonnegative check (attempt_count >= 0)
);

create unique index if not exists uq_telegram_webhook_events_connection_update
  on telegram_webhook_events(connection_id, update_id);

create index if not exists idx_telegram_webhook_events_status_available
  on telegram_webhook_events(status, available_at, received_at);

create index if not exists idx_telegram_webhook_events_workspace
  on telegram_webhook_events(workspace_id, received_at desc);

alter table if exists contacts
  add column if not exists channel_connection_id uuid references channel_connections(id);

alter table if exists chats
  add column if not exists channel_connection_id uuid references channel_connections(id),
  add column if not exists provider_conversation_id text;

alter table if exists chat_messages
  add column if not exists channel_connection_id uuid references channel_connections(id),
  add column if not exists provider_message_id text,
  add column if not exists provider_update_id text;

create unique index if not exists uq_contacts_connection_provider_user
  on contacts(channel_connection_id, external_id)
  where channel_connection_id is not null;

create unique index if not exists uq_contacts_connection_external_id
  on contacts(channel_connection_id, external_id);

create unique index if not exists uq_chats_connection_conversation
  on chats(channel_connection_id, provider_conversation_id)
  where channel_connection_id is not null and provider_conversation_id is not null;

create unique index if not exists uq_chats_connection_provider_conversation
  on chats(channel_connection_id, provider_conversation_id);

create unique index if not exists uq_messages_connection_provider_message_inbound
  on chat_messages(channel_connection_id, provider_message_id)
  where channel_connection_id is not null
    and provider_message_id is not null
    and direction = 'inbound';

create index if not exists idx_chat_messages_connection_update
  on chat_messages(channel_connection_id, provider_update_id)
  where channel_connection_id is not null and provider_update_id is not null;
