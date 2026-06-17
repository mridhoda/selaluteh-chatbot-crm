-- 002_core_identity.sql
-- Core identity, workspace settings, outlets, and access tables.

create table if not exists workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null default 'Default Workspace',
  owner_user_id uuid null,
  status text not null default 'active',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_workspaces_updated_at
before update on workspaces
for each row execute function set_updated_at();

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid null unique,
  workspace_id uuid not null references workspaces(id) on delete cascade,
  name text not null,
  email citext not null unique,
  password_hash text null,
  role user_role not null default 'owner',
  verified boolean not null default false,
  status user_status not null default 'offline',
  plan plan_type not null default 'pro',
  plan_expiry timestamptz not null default (now() + interval '30 days'),
  last_login_at timestamptz null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_users_updated_at
before update on users
for each row execute function set_updated_at();

do $$ begin
  alter table workspaces
    add constraint workspaces_owner_user_fk
    foreign key (owner_user_id) references users(id)
    on delete set null;
exception when duplicate_object then null;
end $$;

create table if not exists otps (
  id uuid primary key default gen_random_uuid(),
  email citext not null,
  code text not null,
  expires_at timestamptz not null,
  consumed_at timestamptz null,
  created_at timestamptz not null default now()
);

create table if not exists password_resets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  token text not null unique,
  expires_at timestamptz not null,
  consumed_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_password_resets_updated_at
before update on password_resets
for each row execute function set_updated_at();

create table if not exists outlets (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  name text not null,
  code text null,
  city text null,
  region text null,
  address text null,
  postal_code text null,
  phone text null,
  manager_user_id uuid null references users(id) on delete set null,
  status text not null default 'active',
  timezone text not null default 'Asia/Makassar',
  opening_hours jsonb not null default '{}'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_outlets_updated_at
before update on outlets
for each row execute function set_updated_at();

create table if not exists workspace_settings (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null unique references workspaces(id) on delete cascade,
  business_display_name text not null default '',
  timezone text not null default 'Asia/Makassar',
  currency text not null default 'IDR',
  locale text not null default 'id-ID',
  support_contact_email citext null,
  default_outlet_id uuid null references outlets(id) on delete set null,
  allow_all_outlets_view boolean not null default false,
  primary_ai text not null default 'openai' check (primary_ai in ('openai', 'gemini', 'none')),
  secondary_ai text not null default 'gemini' check (secondary_ai in ('openai', 'gemini', 'none')),
  default_language text not null default 'id',
  ai_commerce_enabled boolean not null default false,
  require_checkout_confirmation boolean not null default true,
  human_handoff_enabled boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_workspace_settings_updated_at
before update on workspace_settings
for each row execute function set_updated_at();

create table if not exists user_workspace_memberships (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  role text not null default 'member',
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint user_workspace_memberships_unique unique (workspace_id, user_id)
);

create trigger set_user_workspace_memberships_updated_at
before update on user_workspace_memberships
for each row execute function set_updated_at();

create table if not exists user_outlet_access (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  outlet_id uuid not null references outlets(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  role text not null default 'outlet_viewer',
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint user_outlet_access_unique unique (workspace_id, outlet_id, user_id)
);

create trigger set_user_outlet_access_updated_at
before update on user_outlet_access
for each row execute function set_updated_at();
