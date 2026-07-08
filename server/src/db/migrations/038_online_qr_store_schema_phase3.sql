-- 038_online_qr_store_schema_phase3.sql
-- Phase 3 additive schema for Online Store + QR Store + configurable payment providers.
-- Non-destructive: keeps existing runtime tables and adds compatibility references only.

create table if not exists storefronts (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  slug text not null,
  name text not null,
  brandline text null,
  ordering_enabled boolean not null default true,
  status text not null default 'active' check (status in ('active', 'inactive', 'archived')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint storefronts_workspace_slug_key unique (workspace_id, slug),
  constraint storefronts_slug_key unique (slug)
);

create table if not exists storefront_outlets (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  storefront_id uuid not null references storefronts(id) on delete cascade,
  outlet_id uuid not null references outlets(id) on delete cascade,
  is_default boolean not null default false,
  ordering_enabled boolean not null default true,
  pickup_enabled boolean not null default true,
  dine_in_enabled boolean not null default false,
  takeaway_enabled boolean not null default false,
  sort_order integer not null default 0,
  status text not null default 'active' check (status in ('active', 'inactive', 'archived')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint storefront_outlets_storefront_outlet_key unique (storefront_id, outlet_id)
);

create unique index if not exists storefront_outlets_one_default_idx
  on storefront_outlets(storefront_id)
  where is_default = true and status = 'active';

create table if not exists qr_locations (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  outlet_id uuid not null references outlets(id) on delete cascade,
  location_type text not null default 'pickup' check (location_type in ('pickup', 'counter', 'table', 'room', 'area', 'other')),
  label text not null,
  code text null,
  default_fulfillment_type text not null default 'pickup' check (default_fulfillment_type in ('pickup', 'dine_in', 'takeaway')),
  status text not null default 'active' check (status in ('active', 'inactive', 'archived')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists qr_locations_outlet_code_key
  on qr_locations(outlet_id, code)
  where code is not null;

create table if not exists qr_codes (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  outlet_id uuid not null references outlets(id) on delete cascade,
  qr_location_id uuid null references qr_locations(id) on delete set null,
  public_code text not null,
  qr_token_hash text not null,
  status text not null default 'active' check (status in ('active', 'inactive', 'revoked', 'expired', 'archived')),
  expires_at timestamptz null,
  revoked_at timestamptz null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint qr_codes_public_code_key unique (public_code),
  constraint qr_codes_token_hash_key unique (qr_token_hash)
);

alter table if exists qr_order_sessions
  add column if not exists qr_code_id uuid null references qr_codes(id) on delete set null,
  add column if not exists qr_location_id uuid null references qr_locations(id) on delete set null,
  add column if not exists session_status text not null default 'active',
  add column if not exists completed_order_id uuid null references orders(id) on delete set null;

alter table if exists orders
  add column if not exists qr_location_id uuid null references qr_locations(id) on delete set null,
  add column if not exists storefront_id uuid null references storefronts(id) on delete set null,
  add column if not exists service_fee_amount numeric(14,2) not null default 0,
  add column if not exists tax_amount numeric(14,2) not null default 0,
  add column if not exists payment_provider text null;

create table if not exists payment_providers (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  is_enabled boolean not null default true,
  supports_qris boolean not null default false,
  supports_virtual_account boolean not null default false,
  supports_ewallet boolean not null default false,
  supports_card boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists payment_provider_settings (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  provider_code text not null references payment_providers(code),
  is_active boolean not null default false,
  mode text not null default 'sandbox' check (mode in ('sandbox', 'test', 'production')),
  public_key text null,
  secret_key_ciphertext text null,
  webhook_secret_ciphertext text null,
  credential_fingerprint text null,
  callback_url text null,
  webhook_url text null,
  config_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint payment_provider_settings_workspace_provider_key unique (workspace_id, provider_code)
);

create unique index if not exists payment_provider_settings_one_active_idx
  on payment_provider_settings(workspace_id)
  where is_active = true;

create table if not exists payment_status_history (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  payment_id uuid not null references payments(id) on delete cascade,
  order_id uuid null references orders(id) on delete set null,
  from_status text null,
  to_status text not null,
  actor_type text not null,
  source_event_id text null,
  reason_code text null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

insert into payment_providers (code, name, is_enabled, supports_qris, supports_virtual_account, supports_ewallet, supports_card, metadata)
values
  ('bayargg', 'BayarGG', true, true, false, false, false, '{}'::jsonb),
  ('xendit', 'Xendit', true, true, true, true, true, '{}'::jsonb),
  ('doku', 'DOKU', true, true, true, true, true, '{}'::jsonb),
  ('manual', 'Manual Payment', true, false, false, false, false, '{}'::jsonb)
on conflict (code) do update set
  name = excluded.name,
  is_enabled = excluded.is_enabled,
  supports_qris = excluded.supports_qris,
  supports_virtual_account = excluded.supports_virtual_account,
  supports_ewallet = excluded.supports_ewallet,
  supports_card = excluded.supports_card;

create index if not exists storefronts_workspace_status_idx on storefronts(workspace_id, status);
create index if not exists storefronts_slug_status_idx on storefronts(slug, status);
create index if not exists storefront_outlets_workspace_idx on storefront_outlets(workspace_id, status);
create index if not exists storefront_outlets_outlet_idx on storefront_outlets(outlet_id, status);
create index if not exists qr_locations_workspace_outlet_idx on qr_locations(workspace_id, outlet_id, status);
create index if not exists qr_codes_workspace_outlet_idx on qr_codes(workspace_id, outlet_id, status);
create index if not exists qr_codes_location_idx on qr_codes(qr_location_id);
create index if not exists qr_order_sessions_qr_code_idx on qr_order_sessions(qr_code_id);
create index if not exists qr_order_sessions_qr_location_idx on qr_order_sessions(qr_location_id);
create index if not exists orders_storefront_idx on orders(storefront_id);
create index if not exists orders_qr_location_idx on orders(qr_location_id);
create index if not exists payment_provider_settings_workspace_idx on payment_provider_settings(workspace_id, provider_code);
create index if not exists payment_status_history_payment_idx on payment_status_history(payment_id, created_at);
create index if not exists payment_status_history_order_idx on payment_status_history(order_id, created_at);

do $$ begin
  if not exists (select 1 from pg_trigger where tgname = 'set_storefronts_updated_at') then
    create trigger set_storefronts_updated_at before update on storefronts for each row execute function set_updated_at();
  end if;
  if not exists (select 1 from pg_trigger where tgname = 'set_storefront_outlets_updated_at') then
    create trigger set_storefront_outlets_updated_at before update on storefront_outlets for each row execute function set_updated_at();
  end if;
  if not exists (select 1 from pg_trigger where tgname = 'set_qr_locations_updated_at') then
    create trigger set_qr_locations_updated_at before update on qr_locations for each row execute function set_updated_at();
  end if;
  if not exists (select 1 from pg_trigger where tgname = 'set_qr_codes_updated_at') then
    create trigger set_qr_codes_updated_at before update on qr_codes for each row execute function set_updated_at();
  end if;
  if not exists (select 1 from pg_trigger where tgname = 'set_payment_providers_updated_at') then
    create trigger set_payment_providers_updated_at before update on payment_providers for each row execute function set_updated_at();
  end if;
  if not exists (select 1 from pg_trigger where tgname = 'set_payment_provider_settings_updated_at') then
    create trigger set_payment_provider_settings_updated_at before update on payment_provider_settings for each row execute function set_updated_at();
  end if;
end $$;

alter table storefronts enable row level security;
alter table storefront_outlets enable row level security;
alter table qr_locations enable row level security;
alter table qr_codes enable row level security;
alter table payment_providers enable row level security;
alter table payment_provider_settings enable row level security;
alter table payment_status_history enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'storefronts' and policyname = 'storefronts_service_role_all') then
    create policy "storefronts_service_role_all" on storefronts for all to service_role using (true) with check (true);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'storefront_outlets' and policyname = 'storefront_outlets_service_role_all') then
    create policy "storefront_outlets_service_role_all" on storefront_outlets for all to service_role using (true) with check (true);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'qr_locations' and policyname = 'qr_locations_service_role_all') then
    create policy "qr_locations_service_role_all" on qr_locations for all to service_role using (true) with check (true);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'qr_codes' and policyname = 'qr_codes_service_role_all') then
    create policy "qr_codes_service_role_all" on qr_codes for all to service_role using (true) with check (true);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'payment_providers' and policyname = 'payment_providers_service_role_all') then
    create policy "payment_providers_service_role_all" on payment_providers for all to service_role using (true) with check (true);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'payment_provider_settings' and policyname = 'payment_provider_settings_service_role_all') then
    create policy "payment_provider_settings_service_role_all" on payment_provider_settings for all to service_role using (true) with check (true);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'payment_status_history' and policyname = 'payment_status_history_service_role_all') then
    create policy "payment_status_history_service_role_all" on payment_status_history for all to service_role using (true) with check (true);
  end if;
end $$;
