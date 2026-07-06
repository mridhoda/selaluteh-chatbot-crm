-- 035_ai_action_confirmations.sql
-- AISG Phase 3: persistent AI action confirmation records.

create table if not exists ai_action_confirmations (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  channel_connection_id uuid,
  conversation_id uuid,
  contact_id uuid,
  cart_id uuid,
  checkout_id uuid,
  action text not null,
  payload_hash text not null,
  state_version text,
  token_hash text not null unique,
  status text not null default 'pending',
  expires_at timestamptz not null,
  consumed_at timestamptz,
  created_at timestamptz not null default now(),
  constraint chk_ai_action_confirmations_status check (status in ('pending', 'consumed', 'expired', 'cancelled'))
);

create index if not exists idx_ai_action_confirmations_context
  on ai_action_confirmations(workspace_id, conversation_id, contact_id, status, expires_at);

create index if not exists idx_ai_action_confirmations_cart
  on ai_action_confirmations(workspace_id, cart_id, state_version);
