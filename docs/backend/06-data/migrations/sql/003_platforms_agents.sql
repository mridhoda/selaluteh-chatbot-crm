-- 003_platforms_agents.sql
-- Connected platforms, AI agents, legacy sales forms, and normalized agent child tables.
--
-- Agent sales forms are retained for backward compatibility with the existing AI
-- order capture flow. New marketplace product catalog lives in 005_orders_complaints_files.sql.

create table if not exists platforms (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  owner_user_id uuid null references users(id) on delete set null,
  type platform_type not null,
  label text not null,
  token text not null default '',
  account_id text not null default '',
  phone_number_id text not null default '',
  app_id text not null default '',
  app_secret text not null default '',
  webhook_secret text not null default '',
  enabled boolean not null default true,
  webhook_url text null,
  last_webhook_at timestamptz null,
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
  owner_user_id uuid null references users(id) on delete set null,
  platform_id uuid null references platforms(id) on delete set null,
  name text not null,
  prompt text not null default '',
  behavior text not null default '',
  welcome_message text not null default 'Halo! Ada yang bisa saya bantu?',
  response_delay integer not null default 0,
  sticker_url text null,
  ai_enabled boolean not null default true,
  ai_commerce_mode boolean not null default false,
  ai_may_recommend_products boolean not null default true,
  ai_may_create_cart boolean not null default false,
  ai_may_create_order boolean not null default false,
  payment_enabled boolean not null default false,
  payment_bank_info text not null default '',
  payment_qris_url text not null default '',
  complaint_notification_enabled boolean not null default false,
  complaint_notification_platform_id uuid null references platforms(id) on delete set null,
  complaint_notification_destination text null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_agents_updated_at
before update on agents
for each row execute function set_updated_at();

create table if not exists agent_knowledge (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  agent_id uuid not null references agents(id) on delete cascade,
  kind knowledge_kind not null,
  value text null,
  question text null,
  answer text null,
  position integer not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger set_agent_knowledge_updated_at before update on agent_knowledge for each row execute function set_updated_at();

create table if not exists agent_followups (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  agent_id uuid not null references agents(id) on delete cascade,
  name text not null,
  trigger_text text not null,
  prompt text not null,
  delay_minutes integer not null check (delay_minutes >= 0),
  enabled boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger set_agent_followups_updated_at before update on agent_followups for each row execute function set_updated_at();

create table if not exists agent_database_files (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  agent_id uuid not null references agents(id) on delete cascade,
  file_id uuid null,
  legacy_file_id text null,
  name text null,
  original_name text null,
  url text null,
  mime_type text null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger set_agent_database_files_updated_at before update on agent_database_files for each row execute function set_updated_at();

create table if not exists agent_complaint_fields (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  agent_id uuid not null references agents(id) on delete cascade,
  label text not null,
  key text not null,
  field_type text not null default 'text',
  required boolean not null default false,
  position integer not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger set_agent_complaint_fields_updated_at before update on agent_complaint_fields for each row execute function set_updated_at();

create table if not exists agent_outlets (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  agent_id uuid not null references agents(id) on delete cascade,
  name text not null,
  address text null,
  phone text null,
  maps_url text null,
  is_active boolean not null default true,
  position integer not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger set_agent_outlets_updated_at before update on agent_outlets for each row execute function set_updated_at();

-- Legacy agent.products[] support. New production catalog uses product tables in 005.
create table if not exists agent_products (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  agent_id uuid not null references agents(id) on delete cascade,
  name text not null,
  description text null,
  price numeric(14,2) not null default 0,
  currency text not null default 'IDR',
  image_url text null,
  is_active boolean not null default true,
  position integer not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger set_agent_products_updated_at before update on agent_products for each row execute function set_updated_at();

create table if not exists agent_sales_forms (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  agent_id uuid not null references agents(id) on delete cascade,
  name text not null,
  description text null,
  enabled boolean not null default true,
  position integer not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger set_agent_sales_forms_updated_at before update on agent_sales_forms for each row execute function set_updated_at();

create table if not exists agent_sales_form_fields (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  sales_form_id uuid not null references agent_sales_forms(id) on delete cascade,
  label text not null,
  key text not null,
  field_type text not null default 'text',
  required boolean not null default false,
  position integer not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger set_agent_sales_form_fields_updated_at before update on agent_sales_form_fields for each row execute function set_updated_at();

create table if not exists agent_sales_form_products (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  sales_form_id uuid not null references agent_sales_forms(id) on delete cascade,
  name text not null,
  description text null,
  price numeric(14,2) not null default 0,
  currency text not null default 'IDR',
  image_url text null,
  position integer not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger set_agent_sales_form_products_updated_at before update on agent_sales_form_products for each row execute function set_updated_at();
