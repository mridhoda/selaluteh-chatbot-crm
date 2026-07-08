-- 040_online_qr_store_phase32_detail_schema.sql
-- Phase 3.2 detail-schema reconciliation for Online Store + QR Store.
-- Additive only: existing runtime tables remain canonical physical tables.

alter table if exists storefronts
  add column if not exists theme_json jsonb not null default '{}'::jsonb,
  add column if not exists logo_url text null,
  add column if not exists brand_id uuid null;

alter table if exists storefront_outlets
  add column if not exists is_visible boolean not null default true;

alter table if exists payment_provider_settings
  add column if not exists display_name text null,
  add column if not exists payment_expiry_minutes integer not null default 15,
  add column if not exists created_by uuid null references users(id) on delete set null,
  add column if not exists updated_by uuid null references users(id) on delete set null;

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

create index if not exists storefronts_brand_idx
  on storefronts(brand_id)
  where brand_id is not null;

create index if not exists storefront_outlets_visible_sort_idx
  on storefront_outlets(storefront_id, is_visible, status, sort_order);

create index if not exists payment_provider_settings_active_mode_idx
  on payment_provider_settings(workspace_id, mode)
  where is_active = true;

create index if not exists payments_provider_setting_idx
  on payments(provider_setting_id)
  where provider_setting_id is not null;

create unique index if not exists payments_provider_ref_unique_idx
  on payments(provider, provider_ref)
  where provider_ref is not null;

create index if not exists payment_webhook_events_signature_idx
  on payment_webhook_events(provider, signature_valid, created_at);

create index if not exists payment_status_history_provider_event_idx
  on payment_status_history(provider_event_id)
  where provider_event_id is not null;

create index if not exists security_events_workspace_created_idx
  on security_events(workspace_id, created_at desc);

create index if not exists security_events_type_severity_idx
  on security_events(event_type, severity, created_at desc);

alter table security_events enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'security_events' and policyname = 'security_events_service_role_all') then
    create policy "security_events_service_role_all" on security_events for all to service_role using (true) with check (true);
  end if;
end $$;
