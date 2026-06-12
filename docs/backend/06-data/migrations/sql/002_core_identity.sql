-- 002_core_identity.sql
-- Core identity, workspace, custom JWT compatibility, and settings tables.
--
-- Current app still has custom JWT + password_hash. This schema keeps that path
-- while allowing a future Supabase Auth migration via users.auth_user_id.

create table if not exists workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null default 'Default Workspace',
  owner_user_id uuid null,
  default_currency text not null default 'IDR',
  timezone text not null default 'Asia/Makassar',
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

create table if not exists settings (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null unique references workspaces(id) on delete cascade,
  primary_ai text not null default 'openai' check (primary_ai in ('openai', 'gemini', 'none')),
  secondary_ai text not null default 'gemini' check (secondary_ai in ('openai', 'gemini', 'none')),
  default_language text not null default 'id',
  default_currency text not null default 'IDR',
  timezone text not null default 'Asia/Makassar',
  ai_commerce_enabled boolean not null default false,
  ai_auto_create_order boolean not null default false,
  require_checkout_confirmation boolean not null default true,
  human_handoff_enabled boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_settings_updated_at
before update on settings
for each row execute function set_updated_at();
