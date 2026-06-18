-- 003_platforms_agents.sql
-- Connected platforms, AI agents (embedded JSON config), and agent-outlet mapping.

create table if not exists platforms (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  type platform_type not null,
  label text not null,
  status platform_status not null default 'pending_setup',
  health platform_health not null default 'not_configured',
  account_id text null,
  bot_id text null,
  phone_number_id text null,
  page_id text null,
  app_id text null,
  token_encrypted text null,
  app_secret_encrypted text null,
  credentials_encrypted text null,
  webhook_configured boolean not null default false,
  webhook_secret_encrypted text null,
  enabled boolean not null default true,
  last_event_at timestamptz null,
  agent_id uuid null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_platforms_updated_at
before update on platforms
for each row execute function set_updated_at();

create table if not exists agents (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  platform_id uuid null references platforms(id) on delete set null,
  name text not null,
  behavior text not null default '',
  prompt text not null default '',
  welcome_message text null,
  sticker_url text null,
  tools jsonb not null default '[]'::jsonb,
  knowledge jsonb not null default '[]'::jsonb,
  follow_ups jsonb not null default '[]'::jsonb,
  database jsonb not null default '[]'::jsonb,
  complaint_fields jsonb not null default '[]'::jsonb,
  complaint_notification jsonb not null default '{}'::jsonb,
  sales_forms jsonb not null default '[]'::jsonb,
  payment jsonb not null default '{}'::jsonb,
  status agent_status not null default 'active',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_agents_updated_at
before update on agents
for each row execute function set_updated_at();

do $$ begin
  alter table platforms
    add constraint platforms_agent_fk
    foreign key (agent_id) references agents(id)
    on delete set null;
exception when duplicate_object then null;
end $$;

create table if not exists agent_outlets (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  agent_id uuid not null references agents(id) on delete cascade,
  outlet_id uuid not null references outlets(id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint agent_outlets_unique unique (agent_id, outlet_id)
);

create index if not exists agent_outlets_workspace_idx on agent_outlets (workspace_id);
create index if not exists agent_outlets_outlet_idx on agent_outlets (outlet_id);
