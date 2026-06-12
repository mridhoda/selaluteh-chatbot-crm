-- 001_extensions_and_enums.sql
-- Base extensions, enum types, and shared trigger helpers for the updated
-- Chatbot CRM + Telegram-first Marketplace MVP Supabase/Postgres schema.
--
-- Design goals:
-- - Preserve existing CRM/chatbot behavior migrated from MongoDB/Mongoose.
-- - Add deterministic commerce primitives: product catalog, cart, checkout,
--   normalized order_items, payments, payment_events, and webhook idempotency.
-- - Keep large media binaries on the local application server; Postgres stores metadata only.

create extension if not exists "pgcrypto";
create extension if not exists "citext";
create extension if not exists "pg_trgm";

-- Identity / billing
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

-- CRM / messaging
do $$ begin
  create type chat_status as enum ('open', 'resolved');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type message_sender as enum ('user', 'ai', 'human', 'system');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type message_kind as enum ('text', 'image', 'video', 'audio', 'voice', 'document', 'sticker', 'callback', 'system');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type knowledge_kind as enum ('url', 'pdf', 'text', 'file', 'qna');
exception when duplicate_object then null;
end $$;

-- Operations
do $$ begin
  create type complaint_status as enum ('open', 'resolved', 'dismissed');
exception when duplicate_object then null;
end $$;

-- Marketplace catalog
do $$ begin
  create type product_status as enum ('draft', 'active', 'archived', 'out_of_stock');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type product_type as enum ('physical', 'digital', 'service', 'bundle');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type inventory_policy as enum ('track', 'do_not_track');
exception when duplicate_object then null;
end $$;

-- Cart / checkout / order
do $$ begin
  create type cart_status as enum ('active', 'checked_out', 'abandoned', 'expired');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type checkout_status as enum ('draft', 'awaiting_confirmation', 'confirmed', 'cancelled', 'expired');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type order_status as enum (
    'draft',
    'new',                 -- legacy AI form order status compatibility
    'pending_payment',
    'paid',
    'processing',
    'processed',           -- legacy order status compatibility
    'completed',
    'cancelled',
    'expired',
    'failed',
    'refunded'
  );
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
  create type payment_status as enum (
    'pending',
    'paid',
    'settlement',
    'capture',
    'deny',
    'cancel',
    'expire',
    'failure',
    'refund',
    'partial_refund',
    'chargeback'
  );
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
  create type ai_action_status as enum ('proposed', 'confirmed', 'executed', 'cancelled', 'failed');
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

-- Generates readable order numbers per workspace in application code preferred.
-- This helper is intentionally simple and safe for dev, but production can replace
-- it with a stronger sequence strategy if required.
create or replace function generate_order_number(prefix text default 'ORD')
returns text
language sql
as $$
  select upper(prefix) || '-' || to_char(now(), 'YYYYMMDD') || '-' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 8)
$$;
