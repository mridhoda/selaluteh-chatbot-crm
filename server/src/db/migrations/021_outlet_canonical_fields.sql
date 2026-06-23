-- 021_outlet_canonical_fields.sql
-- Alpha slice: extend outlets table with canonical management fields
-- Task 2.1-2.4 per selaluteh-outlet-management-operations

alter table outlets
  add column if not exists slug text,
  add column if not exists email text,
  add column if not exists operational_status text not null default case
    when status = 'active' then 'ACTIVE'
    when status = 'inactive' then 'PAUSED'
    when status = 'archived' then 'ARCHIVED'
    else 'DRAFT'
  end,
  add column if not exists health_status text not null default 'UNKNOWN',
  add column if not exists accepts_orders boolean not null default false,
  add column if not exists pickup_enabled boolean not null default true,
  add column if not exists version bigint not null default 1,
  add column if not exists archived_at timestamptz;

create unique index if not exists uq_outlets_workspace_slug
  on outlets (workspace_id, slug) where slug is not null and slug <> '';

create table if not exists outlet_service_settings (
  outlet_id uuid primary key references outlets(id) on delete cascade,
  workspace_id uuid not null references workspaces(id) on delete cascade,
  pickup_enabled boolean not null default true,
  delivery_enabled boolean not null default false,
  dine_in_enabled boolean not null default false,
  preorder_enabled boolean not null default false,
  default_prep_minutes integer not null default 15,
  order_acceptance_policy jsonb not null default '{}'::jsonb,
  version bigint not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_outlet_service_settings_updated_at
  before update on outlet_service_settings
  for each row execute function set_updated_at();

create table if not exists outlet_operating_hours (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  outlet_id uuid not null references outlets(id) on delete cascade,
  day_of_week smallint not null check (day_of_week between 0 and 6),
  opens_at time not null,
  closes_at time not null,
  sequence smallint not null default 0,
  is_closed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_outlet_operating_hours_updated_at
  before update on outlet_operating_hours
  for each row execute function set_updated_at();

create index idx_outlet_operating_hours_outlet
  on outlet_operating_hours (outlet_id, day_of_week);

create table if not exists outlet_special_hours (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  outlet_id uuid not null references outlets(id) on delete cascade,
  date date not null,
  is_closed boolean not null default false,
  opens_at time,
  closes_at time,
  reason text,
  customer_note text,
  version bigint not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_outlet_special_hours_updated_at
  before update on outlet_special_hours
  for each row execute function set_updated_at();

create unique index idx_outlet_special_hours_unique
  on outlet_special_hours (outlet_id, date);

create index idx_outlet_special_hours_workspace
  on outlet_special_hours (workspace_id);

create table if not exists outlet_channel_policies (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  outlet_id uuid not null references outlets(id) on delete cascade,
  platform_connection_id uuid,
  enabled_for_outlet boolean not null default false,
  accepts_chats boolean not null default true,
  accepts_orders boolean not null default false,
  routing_enabled boolean not null default true,
  version bigint not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_outlet_channel_policies_updated_at
  before update on outlet_channel_policies
  for each row execute function set_updated_at();

create index idx_outlet_channel_policies_outlet
  on outlet_channel_policies (outlet_id);

create table if not exists outlet_tags (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  outlet_id uuid not null references outlets(id) on delete cascade,
  tag text not null,
  created_at timestamptz not null default now(),
  created_by uuid references users(id) on delete set null,
  constraint uq_outlet_tags unique (workspace_id, outlet_id, tag)
);

create index idx_outlet_tags_workspace on outlet_tags (workspace_id, outlet_id);
