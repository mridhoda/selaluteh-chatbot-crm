-- 001_extensions_and_enums.sql
-- Base extensions, enum types, and shared trigger helpers for the canonical
-- Chatbot CRM + Telegram-first Marketplace MVP Supabase/Postgres schema.

create extension if not exists "pgcrypto";
create extension if not exists "citext";
create extension if not exists "pg_trgm";

-- Identity
do $$ begin
  create type user_role as enum ('owner', 'super', 'agent');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type user_status as enum ('online', 'offline');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type plan_type as enum ('free', 'pro', 'pro-banget');
exception when duplicate_object then null;
end $$;

-- Integrations
do $$ begin
  create type platform_type as enum ('whatsapp', 'telegram', 'instagram', 'facebook', 'custom');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type platform_status as enum ('connected', 'disabled', 'pending_setup', 'needs_attention', 'disconnected');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type platform_health as enum ('healthy', 'no_recent_events', 'verification_failed', 'delivery_errors', 'not_configured');
exception when duplicate_object then null;
end $$;

-- CRM / messaging
do $$ begin
  create type chat_status as enum ('open', 'resolved');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type chat_message_sender as enum ('customer', 'ai', 'admin', 'system');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type chat_message_direction as enum ('inbound', 'outbound');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type chat_message_type as enum ('text', 'image', 'file', 'audio', 'system');
exception when duplicate_object then null;
end $$;

-- Agents
do $$ begin
  create type agent_status as enum ('active', 'inactive');
exception when duplicate_object then null;
end $$;

-- Operations
do $$ begin
  create type complaint_status as enum ('open', 'resolved', 'dismissed');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type complaint_priority as enum ('low', 'medium', 'high', 'urgent');
exception when duplicate_object then null;
end $$;

-- Marketplace catalog
do $$ begin
  create type product_category_status as enum ('active', 'inactive');
exception when duplicate_object then null;
end $$;

-- Cart / checkout / order
do $$ begin
  create type cart_status as enum ('active', 'converted', 'expired', 'cancelled');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type checkout_status as enum ('pending', 'confirmed', 'converted', 'failed', 'expired');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type order_status as enum (
    'new',
    'accepted',
    'preparing',
    'ready',
    'completed',
    'cancelled'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type order_payment_status as enum ('unpaid', 'pending', 'paid', 'failed', 'expired', 'refunded');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type fulfillment_status as enum ('unfulfilled', 'preparing', 'ready', 'fulfilled', 'cancelled');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type order_source as enum ('telegram', 'whatsapp', 'instagram', 'facebook', 'crm_admin', 'ai_form', 'custom');
exception when duplicate_object then null;
end $$;

-- Payments
do $$ begin
  create type payment_provider as enum ('midtrans', 'xendit', 'manual', 'other');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type payment_provider_environment as enum ('sandbox', 'production');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type payment_record_status as enum ('pending', 'paid', 'failed', 'expired', 'cancelled', 'refunded');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type reconciliation_status as enum ('pending', 'matched', 'missing_webhook', 'unmatched', 'amount_mismatch', 'duplicate', 'provider_paid_order_pending');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type payment_event_processing_status as enum ('received', 'verified', 'processed', 'rejected', 'failed');
exception when duplicate_object then null;
end $$;

-- Files / storage
do $$ begin
  create type file_source as enum (
    'platform_inbound',
    'crm_upload',
    'agent_database',
    'payment_proof',
    'product_image',
    'category_image',
    'public_asset',
    'ai_generated',
    'external_download',
    'migration_backfill'
  );
exception when duplicate_object then null;
end $$;

-- Webhooks / AI actions
do $$ begin
  create type webhook_event_status as enum ('received', 'processing', 'processed', 'ignored_duplicate', 'failed');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type ai_action_status as enum ('proposed', 'validated', 'executed', 'rejected', 'cancelled', 'failed');
exception when duplicate_object then null;
end $$;

create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function generate_order_number(prefix text default 'ORD')
returns text
language sql
as $$
  select upper(prefix) || '-' || to_char(now(), 'YYYYMMDD') || '-' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 8)
$$;

create table if not exists mongo_id_map (
  source_collection text not null,
  source_object_id text not null,
  target_table text not null,
  target_uuid uuid null,
  workspace_id uuid null,
  created_at timestamptz not null default now(),
  primary key (source_collection, source_object_id)
);
