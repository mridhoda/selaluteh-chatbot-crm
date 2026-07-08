-- 042_online_qr_store_target_reconciliation.sql
-- Target-aware additive reconciliation for Supabase schema drift found during Phase 4 task 2.1.
-- This maps the intent of migrations 038-041 onto the live runtime schema without
-- creating duplicate greenfield tables or storing plaintext provider secrets.

create table if not exists storefronts (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  slug text not null,
  name text not null,
  brandline text null,
  ordering_enabled boolean not null default true,
  status text not null default 'active' check (status in ('active', 'inactive', 'archived')),
  metadata jsonb not null default '{}'::jsonb,
  theme_json jsonb not null default '{}'::jsonb,
  logo_url text null,
  brand_id uuid null,
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
  is_visible boolean not null default true,
  status text not null default 'active' check (status in ('active', 'inactive', 'archived')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint storefront_outlets_storefront_outlet_key unique (storefront_id, outlet_id)
);

create table if not exists qr_locations (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  outlet_id uuid not null references outlets(id) on delete cascade,
  location_type text not null default 'pickup_area' check (location_type in ('table', 'counter', 'pickup_area', 'takeaway_area', 'general_store')),
  label text not null,
  code text null,
  default_fulfillment_type text not null default 'pickup' check (default_fulfillment_type in ('pickup', 'dine_in', 'takeaway')),
  sort_order integer not null default 0,
  status text not null default 'active' check (status in ('active', 'inactive', 'archived')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

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
  outlet_locked boolean not null default true,
  revoked_reason text null,
  created_by uuid null references users(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint qr_codes_public_code_key unique (public_code),
  constraint qr_codes_token_hash_key unique (qr_token_hash)
);

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
  provider text not null,
  is_active boolean not null default false,
  mode text not null default 'sandbox' check (mode in ('sandbox', 'test', 'production')),
  public_key text null,
  secret_key_ciphertext text null,
  webhook_secret_ciphertext text null,
  credential_fingerprint text null,
  callback_url text null,
  webhook_url text null,
  display_name text null,
  payment_expiry_minutes integer not null default 15,
  config_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists payment_status_history (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  payment_id uuid not null references payments(id) on delete cascade,
  order_id uuid null references orders(id) on delete set null,
  from_status text null,
  to_status text not null,
  actor_type text not null,
  actor_id uuid null references users(id) on delete set null,
  source_event_id text null,
  provider_event_id text null,
  reason_code text null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists security_events (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid null references workspaces(id) on delete cascade,
  event_type text not null,
  severity text not null default 'low' check (severity in ('low', 'medium', 'high', 'critical')),
  ip_address inet null,
  user_agent text null,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table if exists storefronts
  add column if not exists theme_json jsonb not null default '{}'::jsonb,
  add column if not exists logo_url text null,
  add column if not exists brand_id uuid null;

alter table if exists storefront_outlets
  add column if not exists is_visible boolean not null default true;

alter table if exists qr_locations
  add column if not exists sort_order integer not null default 0;

alter table if exists qr_codes
  add column if not exists outlet_locked boolean not null default true,
  add column if not exists revoked_reason text null,
  add column if not exists created_by uuid null references users(id) on delete set null;

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

alter table if exists payment_provider_settings
  add column if not exists secret_key_ciphertext text null,
  add column if not exists webhook_secret_ciphertext text null,
  add column if not exists credential_fingerprint text null,
  add column if not exists callback_url text null,
  add column if not exists webhook_url text null,
  add column if not exists display_name text null,
  add column if not exists payment_expiry_minutes integer not null default 15,
  add column if not exists config_json jsonb not null default '{}'::jsonb;

alter table if exists payments
  add column if not exists provider_setting_id uuid null references payment_provider_settings(id) on delete set null,
  add column if not exists method_type text null,
  add column if not exists qr_string text null,
  add column if not exists raw_status text null;

alter table if exists payment_webhook_events
  add column if not exists signature_valid boolean null,
  add column if not exists raw_payload_ref text null,
  add column if not exists error_message text null;

alter table if exists payment_status_history
  add column if not exists actor_id uuid null references users(id) on delete set null,
  add column if not exists provider_event_id text null;

alter table if exists order_status_history
  add column if not exists from_fulfillment_status text null,
  add column if not exists to_fulfillment_status text null,
  add column if not exists from_public_order_status text null,
  add column if not exists to_public_order_status text null,
  add column if not exists metadata_json jsonb not null default '{}'::jsonb;

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
create index if not exists storefronts_brand_idx on storefronts(brand_id) where brand_id is not null;
create index if not exists storefront_outlets_workspace_idx on storefront_outlets(workspace_id, status);
create index if not exists storefront_outlets_outlet_idx on storefront_outlets(outlet_id, status);
create index if not exists storefront_outlets_visible_sort_idx on storefront_outlets(storefront_id, is_visible, status, sort_order);
create unique index if not exists storefront_outlets_one_default_idx on storefront_outlets(storefront_id) where is_default = true and status = 'active';
create unique index if not exists qr_locations_outlet_code_key on qr_locations(outlet_id, code) where code is not null;
create index if not exists qr_locations_workspace_outlet_idx on qr_locations(workspace_id, outlet_id, status);
create index if not exists qr_locations_outlet_sort_idx on qr_locations(outlet_id, status, sort_order);
create index if not exists qr_codes_workspace_outlet_idx on qr_codes(workspace_id, outlet_id, status);
create index if not exists qr_codes_location_idx on qr_codes(qr_location_id);
create index if not exists qr_codes_public_code_status_idx on qr_codes(public_code, status);
create index if not exists qr_codes_token_hash_status_idx on qr_codes(qr_token_hash, status);
create index if not exists qr_codes_created_by_idx on qr_codes(created_by) where created_by is not null;
create index if not exists qr_codes_outlet_status_idx on qr_codes(outlet_id, status);
create index if not exists payment_provider_settings_workspace_idx on payment_provider_settings(workspace_id, provider);
create index if not exists payment_provider_settings_active_mode_idx on payment_provider_settings(workspace_id, mode) where is_active = true;
create unique index if not exists payment_provider_settings_one_active_per_mode_idx on payment_provider_settings(workspace_id, mode) where is_active = true;
create unique index if not exists payment_provider_settings_workspace_provider_mode_unique_idx on payment_provider_settings(workspace_id, provider, mode);
create index if not exists payment_status_history_payment_idx on payment_status_history(payment_id, created_at);
create index if not exists payment_status_history_order_idx on payment_status_history(order_id, created_at);
create index if not exists payment_status_history_payment_created_idx on payment_status_history(payment_id, created_at desc);
create index if not exists payment_status_history_order_created_idx on payment_status_history(order_id, created_at desc) where order_id is not null;
create index if not exists payment_status_history_provider_event_idx on payment_status_history(provider_event_id) where provider_event_id is not null;
create index if not exists security_events_workspace_created_idx on security_events(workspace_id, created_at desc);
create index if not exists security_events_type_severity_idx on security_events(event_type, severity, created_at desc);

-- Non-destructive structural reconciliation: these old uniqueness rules prevent
-- multiple modes for the same workspace/provider. They are removed by name only;
-- no payment_provider_settings rows or secret columns are modified.
do $$
begin
  if exists (select 1 from pg_constraint where conname = 'payment_provider_settings_unique') then
    alter table payment_provider_settings drop constraint payment_provider_settings_unique;
  end if;

  if exists (select 1 from pg_constraint where conname = 'payment_provider_settings_workspace_provider_key') then
    alter table payment_provider_settings drop constraint payment_provider_settings_workspace_provider_key;
  end if;
end $$;

drop index if exists payment_provider_settings_one_active_idx;
drop index if exists uq_payment_provider_settings_workspace_provider;
drop index if exists payment_provider_settings_unique;

do $$
begin
  if to_regclass('public.qr_order_sessions') is not null then
    execute 'create index if not exists qr_order_sessions_qr_code_idx on qr_order_sessions(qr_code_id)';
    execute 'create index if not exists qr_order_sessions_qr_location_idx on qr_order_sessions(qr_location_id)';
    execute 'create index if not exists qr_order_sessions_qr_code_created_idx on qr_order_sessions(qr_code_id, created_at desc) where qr_code_id is not null';
    execute 'create index if not exists qr_order_sessions_status_expires_idx on qr_order_sessions(session_status, expires_at) where session_status is not null';
  end if;

  if to_regclass('public.orders') is not null then
    if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'orders' and column_name = 'storefront_id') then
      execute 'create index if not exists orders_storefront_idx on orders(storefront_id)';
    end if;

    if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'orders' and column_name = 'qr_location_id') then
      execute 'create index if not exists orders_qr_location_idx on orders(qr_location_id)';
    end if;

    execute 'create index if not exists orders_workspace_created_at_idx on orders(workspace_id, created_at desc)';
    execute 'create index if not exists orders_outlet_created_at_idx on orders(outlet_id, created_at desc)';
    execute 'create index if not exists orders_channel_created_at_idx on orders(workspace_id, channel, created_at desc)';
    execute 'create index if not exists orders_payment_status_created_at_idx on orders(workspace_id, payment_status, created_at desc)';
    execute 'create index if not exists orders_fulfillment_status_created_at_idx on orders(workspace_id, fulfillment_status, created_at desc)';
    execute 'create index if not exists orders_admin_filter_idx on orders(workspace_id, outlet_id, channel, payment_status, fulfillment_status, created_at desc)';

    if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'orders' and column_name = 'public_order_token') then
      execute 'create unique index if not exists orders_public_order_token_unique_idx on orders(public_order_token) where public_order_token is not null';
    end if;

    if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'orders' and column_name = 'order_number') then
      execute 'create unique index if not exists orders_workspace_order_number_unique_idx on orders(workspace_id, order_number) where order_number is not null and order_number <> ''''';
    end if;
  end if;

  if to_regclass('public.order_idempotency_records') is not null then
    if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'order_idempotency_records' and column_name = 'command_type') then
      execute 'create unique index if not exists order_idempotency_records_public_checkout_unique_idx on order_idempotency_records(workspace_id, idempotency_key) where command_type = ''public_checkout''';
    end if;

    if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'order_idempotency_records' and column_name = 'expires_at') then
      execute 'create index if not exists order_idempotency_records_expires_idx on order_idempotency_records(expires_at) where expires_at is not null';
    end if;
  end if;

  if to_regclass('public.product_outlet_availability') is not null then
    execute 'create index if not exists product_outlet_availability_outlet_product_idx on product_outlet_availability(outlet_id, product_id)';
    execute 'create index if not exists product_outlet_availability_outlet_available_idx on product_outlet_availability(outlet_id, is_available)';
  end if;

  if to_regclass('public.payments') is not null then
    execute 'create index if not exists payments_provider_setting_idx on payments(provider_setting_id) where provider_setting_id is not null';
    execute 'create index if not exists payments_status_created_idx on payments(workspace_id, status, created_at desc)';
    execute 'create index if not exists payments_order_id_idx on payments(order_id)';
    execute 'create index if not exists payments_expires_idx on payments(status, expires_at) where expires_at is not null';

    if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'payments' and column_name = 'provider_ref') then
      execute 'create unique index if not exists payments_provider_ref_unique_idx on payments(provider, provider_ref) where provider_ref is not null';
    end if;

    if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'payments' and column_name = 'provider_transaction_id') then
      execute 'create unique index if not exists payments_provider_transaction_unique_idx on payments(provider, provider_transaction_id) where provider_transaction_id is not null';
    end if;

    if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'payments' and column_name = 'merchant_reference') then
      execute 'create unique index if not exists payments_merchant_reference_provider_unique_idx on payments(provider, merchant_reference) where merchant_reference is not null';
    end if;
  end if;

  if to_regclass('public.payment_webhook_events') is not null then
    execute 'create index if not exists payment_webhook_events_signature_idx on payment_webhook_events(provider, signature_valid, created_at)';

    if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'payment_webhook_events' and column_name = 'payload_hash') then
      execute 'create index if not exists payment_webhook_events_payload_hash_idx on payment_webhook_events(payload_hash) where payload_hash is not null';
    end if;

    if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'payment_webhook_events' and column_name = 'processing_status') then
      execute 'create index if not exists payment_webhook_events_processing_created_idx on payment_webhook_events(processing_status, created_at desc)';
    end if;
  end if;

  if to_regclass('public.payment_events') is not null then
    if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'payment_events' and column_name = 'provider_event_id') then
      execute 'create unique index if not exists payment_events_provider_event_unique_idx on payment_events(provider, provider_event_id) where provider_event_id is not null';
    end if;

    if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'payment_events' and column_name = 'raw_payload') then
      execute 'create index if not exists payment_events_raw_payload_hash_idx on payment_events((md5(raw_payload::text))) where raw_payload is not null';
    end if;

    if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'payment_events' and column_name = 'processing_status') then
      execute 'create index if not exists payment_events_processing_created_idx on payment_events(processing_status, created_at desc)';
    end if;
  end if;

  if to_regclass('public.audit_logs') is not null then
    execute 'create index if not exists audit_logs_workspace_created_idx on audit_logs(workspace_id, created_at desc)';
    execute 'create index if not exists audit_logs_resource_idx on audit_logs(resource_type, resource_id, created_at desc) where resource_id is not null';
    execute 'create index if not exists audit_logs_actor_idx on audit_logs(actor_id, created_at desc) where actor_id is not null';
  end if;
end $$;

do $$
begin
  if exists (select 1 from pg_trigger where tgname = 'set_storefronts_updated_at') is false then
    create trigger set_storefronts_updated_at before update on storefronts for each row execute function set_updated_at();
  end if;
  if exists (select 1 from pg_trigger where tgname = 'set_storefront_outlets_updated_at') is false then
    create trigger set_storefront_outlets_updated_at before update on storefront_outlets for each row execute function set_updated_at();
  end if;
  if exists (select 1 from pg_trigger where tgname = 'set_qr_locations_updated_at') is false then
    create trigger set_qr_locations_updated_at before update on qr_locations for each row execute function set_updated_at();
  end if;
  if exists (select 1 from pg_trigger where tgname = 'set_qr_codes_updated_at') is false then
    create trigger set_qr_codes_updated_at before update on qr_codes for each row execute function set_updated_at();
  end if;
  if exists (select 1 from pg_trigger where tgname = 'set_payment_providers_updated_at') is false then
    create trigger set_payment_providers_updated_at before update on payment_providers for each row execute function set_updated_at();
  end if;
  if exists (select 1 from pg_trigger where tgname = 'set_payment_provider_settings_updated_at') is false then
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
alter table security_events enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'storefronts' and policyname = 'storefronts_service_role_all') then
    create policy "storefronts_service_role_all" on storefronts for all to service_role using (true) with check (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'storefront_outlets' and policyname = 'storefront_outlets_service_role_all') then
    create policy "storefront_outlets_service_role_all" on storefront_outlets for all to service_role using (true) with check (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'qr_locations' and policyname = 'qr_locations_service_role_all') then
    create policy "qr_locations_service_role_all" on qr_locations for all to service_role using (true) with check (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'qr_codes' and policyname = 'qr_codes_service_role_all') then
    create policy "qr_codes_service_role_all" on qr_codes for all to service_role using (true) with check (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'payment_providers' and policyname = 'payment_providers_service_role_all') then
    create policy "payment_providers_service_role_all" on payment_providers for all to service_role using (true) with check (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'payment_provider_settings' and policyname = 'payment_provider_settings_service_role_all') then
    create policy "payment_provider_settings_service_role_all" on payment_provider_settings for all to service_role using (true) with check (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'payment_status_history' and policyname = 'payment_status_history_service_role_all') then
    create policy "payment_status_history_service_role_all" on payment_status_history for all to service_role using (true) with check (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'security_events' and policyname = 'security_events_service_role_all') then
    create policy "security_events_service_role_all" on security_events for all to service_role using (true) with check (true);
  end if;
end $$;

do $$
begin
  if to_regclass('public.orders') is not null then
    if not exists (select 1 from pg_constraint where conname = 'orders_payment_status_check') then
      alter table orders add constraint orders_payment_status_check
        check (payment_status in ('unpaid', 'pending', 'processing', 'paid', 'failed', 'expired', 'refunded', 'cancelled', 'manual_review')) not valid;
    end if;

    if not exists (select 1 from pg_constraint where conname = 'orders_fulfillment_status_check') then
      alter table orders add constraint orders_fulfillment_status_check
        check (fulfillment_status in ('not_started', 'awaiting_acceptance', 'accepted', 'preparing', 'ready', 'completed', 'cancelled')) not valid;
    end if;

    if not exists (select 1 from pg_constraint where conname = 'orders_fulfillment_type_check') then
      alter table orders add constraint orders_fulfillment_type_check
        check (fulfillment_type is null or fulfillment_type in ('pickup', 'dine_in', 'takeaway')) not valid;
    end if;

    if not exists (select 1 from pg_constraint where conname = 'orders_channel_check') then
      alter table orders add constraint orders_channel_check
        check (channel is null or channel in ('online_store', 'qr_store', 'telegram', 'whatsapp')) not valid;
    end if;

    if not exists (select 1 from pg_constraint where conname = 'orders_amounts_non_negative_check') then
      alter table orders add constraint orders_amounts_non_negative_check
        check (
          subtotal_amount >= 0
          and discount_amount >= 0
          and total_amount >= 0
          and coalesce(service_fee_amount, 0) >= 0
          and coalesce(tax_amount, 0) >= 0
        ) not valid;
    end if;
  end if;
end $$;

do $$
begin
  if to_regclass('public.payments') is not null then
    if not exists (select 1 from pg_constraint where conname = 'payments_status_check') then
      alter table payments add constraint payments_status_check
        check (status in ('pending', 'processing', 'paid', 'failed', 'expired', 'refunded', 'cancelled', 'manual_review')) not valid;
    end if;

    if not exists (select 1 from pg_constraint where conname = 'payments_amount_non_negative_check') then
      alter table payments add constraint payments_amount_non_negative_check
        check (amount >= 0) not valid;
    end if;
  end if;
end $$;

do $$
begin
  if to_regclass('public.order_items') is not null then
    if not exists (select 1 from pg_constraint where conname = 'order_items_quantity_positive_check') then
      alter table order_items add constraint order_items_quantity_positive_check
        check (quantity > 0) not valid;
    end if;
  end if;
end $$;
