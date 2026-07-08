import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const migration = readFileSync(resolve(__dirname, '../../../src/db/migrations/038_online_qr_store_schema_phase3.sql'), 'utf8');
const hardeningMigration = readFileSync(resolve(__dirname, '../../../src/db/migrations/039_online_qr_store_phase31_hardening.sql'), 'utf8');
const detailMigration = readFileSync(resolve(__dirname, '../../../src/db/migrations/040_online_qr_store_phase32_detail_schema.sql'), 'utf8');
const integrityMigration = readFileSync(resolve(__dirname, '../../../src/db/migrations/041_online_qr_store_phase33_integrity.sql'), 'utf8');
const targetReconciliationMigration = readFileSync(resolve(__dirname, '../../../src/db/migrations/042_online_qr_store_target_reconciliation.sql'), 'utf8');
const universalQrScopeMigration = readFileSync(resolve(__dirname, '../../../src/db/migrations/043_universal_qr_scope.sql'), 'utf8');

describe('phase 3 online QR store schema migration', () => {
  it('creates additive storefront and QR tables without replacing runtime names', () => {
    assert.match(migration, /create table if not exists storefronts/i);
    assert.match(migration, /create table if not exists storefront_outlets/i);
    assert.match(migration, /create table if not exists qr_locations/i);
    assert.match(migration, /create table if not exists qr_codes/i);
    assert.match(migration, /alter table if exists qr_order_sessions/i);
    assert.doesNotMatch(migration, /create table if not exists qr_sessions\b/i);
    assert.doesNotMatch(migration, /create table if not exists product_availability\b/i);
    assert.doesNotMatch(migration, /create table if not exists idempotency_keys\b/i);
  });

  it('keeps payment provider schema provider-agnostic and secret-safe', () => {
    assert.match(migration, /create table if not exists payment_providers/i);
    assert.match(migration, /create table if not exists payment_provider_settings/i);
    assert.match(migration, /secret_key_ciphertext/i);
    assert.match(migration, /webhook_secret_ciphertext/i);
    assert.doesNotMatch(migration, /xendit_invoice_id/i);
    assert.doesNotMatch(migration, /secret_key text\b/i);
    assert.doesNotMatch(migration, /webhook_secret text\b/i);
  });

  it('enables RLS and service-role policies for new tenant tables', () => {
    for (const table of ['storefronts', 'storefront_outlets', 'qr_locations', 'qr_codes', 'payment_provider_settings', 'payment_status_history']) {
      assert.match(migration, new RegExp(`alter table ${table} enable row level security`, 'i'));
      assert.match(migration, new RegExp(`${table}_service_role_all`, 'i'));
    }
  });

  it('hardens Phase 3.1 schema additively without duplicate runtime tables', () => {
    assert.match(hardeningMigration, /add column if not exists sort_order integer not null default 0/i);
    assert.match(hardeningMigration, /add column if not exists outlet_locked boolean not null default true/i);
    assert.match(hardeningMigration, /add column if not exists revoked_reason text null/i);
    assert.match(hardeningMigration, /qr_codes_public_code_status_idx/i);
    assert.match(hardeningMigration, /qr_order_sessions_status_expires_idx/i);
    assert.match(hardeningMigration, /qr_locations_location_type_check/i);
    assert.match(hardeningMigration, /qr_order_sessions_session_status_check/i);
    assert.doesNotMatch(hardeningMigration, /create table if not exists qr_sessions\b/i);
    assert.doesNotMatch(hardeningMigration, /create table if not exists product_availability\b/i);
    assert.doesNotMatch(hardeningMigration, /create table if not exists idempotency_keys\b/i);
    assert.doesNotMatch(hardeningMigration, /qr_token text\b/i);
  });

  it('reconciles Phase 3.2 detail schema additively without greenfield duplicates', () => {
    assert.match(detailMigration, /alter table if exists storefronts/i);
    assert.match(detailMigration, /add column if not exists theme_json jsonb/i);
    assert.match(detailMigration, /add column if not exists logo_url text null/i);
    assert.match(detailMigration, /add column if not exists is_visible boolean not null default true/i);
    assert.match(detailMigration, /add column if not exists payment_expiry_minutes integer not null default 15/i);
    assert.match(detailMigration, /add column if not exists provider_setting_id uuid null references payment_provider_settings\(id\)/i);
    assert.match(detailMigration, /create table if not exists security_events/i);
    assert.match(detailMigration, /alter table security_events enable row level security/i);
    assert.doesNotMatch(detailMigration, /create table if not exists qr_sessions\b/i);
    assert.doesNotMatch(detailMigration, /create table if not exists product_availability\b/i);
    assert.doesNotMatch(detailMigration, /create table if not exists checkout_sessions\b/i);
    assert.doesNotMatch(detailMigration, /create table if not exists idempotency_keys\b/i);
    assert.doesNotMatch(detailMigration, /create table if not exists admin_users\b/i);
    assert.doesNotMatch(detailMigration, /secret_key text\b/i);
    assert.doesNotMatch(detailMigration, /webhook_secret text\b/i);
  });

  it('adds Phase 3.3 indexes and guarded constraints on canonical runtime tables', () => {
    assert.match(integrityMigration, /orders_admin_filter_idx/i);
    assert.match(integrityMigration, /orders_outlet_created_at_idx/i);
    assert.match(integrityMigration, /orders_payment_status_created_at_idx/i);
    assert.match(integrityMigration, /orders_public_order_token_unique_idx/i);
    assert.match(integrityMigration, /order_idempotency_records_public_checkout_unique_idx/i);
    assert.match(integrityMigration, /qr_order_sessions_qr_code_created_idx/i);
    assert.match(integrityMigration, /product_outlet_availability_outlet_product_idx/i);
    assert.match(integrityMigration, /payments_provider_transaction_unique_idx/i);
    assert.match(integrityMigration, /payments_order_id_idx/i);
    assert.match(integrityMigration, /payment_provider_settings_one_active_per_mode_idx/i);
    assert.match(integrityMigration, /drop index if exists payment_provider_settings_one_active_idx/i);
    assert.match(integrityMigration, /payment_provider_settings_workspace_provider_mode_unique_idx/i);
    assert.match(integrityMigration, /payment_webhook_events_payload_hash_idx/i);
    assert.match(integrityMigration, /payment_events_provider_event_unique_idx/i);
    assert.match(integrityMigration, /payment_events_raw_payload_hash_idx/i);
    assert.match(integrityMigration, /audit_logs_workspace_created_idx/i);
    assert.match(integrityMigration, /orders_payment_status_check/i);
    assert.match(integrityMigration, /manual_review/i);
    assert.match(integrityMigration, /orders_amounts_non_negative_check/i);
    assert.match(integrityMigration, /payments_status_check/i);
    assert.match(integrityMigration, /order_items_quantity_positive_check/i);
    assert.match(integrityMigration, /not valid/i);
    assert.match(integrityMigration, /to_regclass\('public\.audit_logs'\)/i);
    assert.doesNotMatch(integrityMigration, /create table if not exists qr_sessions\b/i);
    assert.doesNotMatch(integrityMigration, /create table if not exists product_availability\b/i);
    assert.doesNotMatch(integrityMigration, /create table if not exists checkout_sessions\b/i);
    assert.doesNotMatch(integrityMigration, /create table if not exists idempotency_keys\b/i);
  });

  it('reconciles target schema drift using provider without greenfield duplicates', () => {
    assert.match(targetReconciliationMigration, /create table if not exists payment_provider_settings[\s\S]*provider text not null/i);
    assert.match(targetReconciliationMigration, /payment_provider_settings_workspace_provider_mode_unique_idx[\s\S]*\(workspace_id, provider, mode\)/i);
    assert.match(targetReconciliationMigration, /payment_provider_settings_one_active_per_mode_idx[\s\S]*\(workspace_id, mode\)/i);
    assert.doesNotMatch(targetReconciliationMigration, /provider_code/i);
    assert.doesNotMatch(targetReconciliationMigration, /secret_key text\b/i);
    assert.doesNotMatch(targetReconciliationMigration, /webhook_secret text\b/i);
    assert.doesNotMatch(targetReconciliationMigration, /create table if not exists qr_sessions\b/i);
    assert.doesNotMatch(targetReconciliationMigration, /create table if not exists product_availability\b/i);
    assert.doesNotMatch(targetReconciliationMigration, /create table if not exists checkout_sessions\b/i);
    assert.doesNotMatch(targetReconciliationMigration, /create table if not exists idempotency_keys\b/i);
    assert.doesNotMatch(targetReconciliationMigration, /create table if not exists admin_users\b/i);
  });

  it('guards old uniqueness removal and keeps NOT VALID integrity constraints', () => {
    assert.match(targetReconciliationMigration, /Non-destructive structural reconciliation/i);
    assert.match(targetReconciliationMigration, /if exists \(select 1 from pg_constraint where conname = 'payment_provider_settings_unique'\)/i);
    assert.match(targetReconciliationMigration, /alter table payment_provider_settings drop constraint payment_provider_settings_unique/i);
    assert.match(targetReconciliationMigration, /drop index if exists uq_payment_provider_settings_workspace_provider/i);
    assert.match(targetReconciliationMigration, /drop index if exists payment_provider_settings_unique/i);
    assert.match(targetReconciliationMigration, /to_regclass\('public\.orders'\)/i);
    assert.match(targetReconciliationMigration, /orders_payment_status_check[\s\S]*not valid/i);
    assert.match(targetReconciliationMigration, /orders_fulfillment_status_check[\s\S]*not valid/i);
    assert.match(targetReconciliationMigration, /orders_fulfillment_type_check[\s\S]*not valid/i);
    assert.match(targetReconciliationMigration, /orders_channel_check[\s\S]*not valid/i);
    assert.match(targetReconciliationMigration, /orders_amounts_non_negative_check[\s\S]*not valid/i);
    assert.match(targetReconciliationMigration, /payments_status_check[\s\S]*not valid/i);
    assert.match(targetReconciliationMigration, /payments_amount_non_negative_check[\s\S]*not valid/i);
    assert.match(targetReconciliationMigration, /order_items_quantity_positive_check[\s\S]*not valid/i);
  });

  it('adds Universal QR scope schema additively without plaintext tokens or duplicate tables', () => {
    assert.match(universalQrScopeMigration, /alter table if exists qr_codes[\s\S]*alter column outlet_id drop not null/i);
    assert.match(universalQrScopeMigration, /add column if not exists scope text not null default 'outlet'/i);
    assert.match(universalQrScopeMigration, /add column if not exists qr_type text not null default 'outlet'/i);
    assert.match(universalQrScopeMigration, /qr_codes_scope_check[\s\S]*universal[\s\S]*outlet[\s\S]*location[\s\S]*not valid/i);
    assert.match(universalQrScopeMigration, /qr_codes_qr_type_check[\s\S]*universal[\s\S]*outlet[\s\S]*location[\s\S]*not valid/i);
    assert.match(universalQrScopeMigration, /qr_codes_scope_qr_type_match_check[\s\S]*scope = qr_type[\s\S]*not valid/i);
    assert.match(universalQrScopeMigration, /qr_codes_scope_target_consistency_check[\s\S]*universal[\s\S]*outlet_id is null[\s\S]*qr_location_id is null[\s\S]*outlet[\s\S]*outlet_id is not null[\s\S]*location[\s\S]*qr_location_id is not null[\s\S]*not valid/i);
    assert.match(universalQrScopeMigration, /qr_codes_workspace_scope_status_idx/i);
    assert.match(universalQrScopeMigration, /qr_codes_workspace_qr_type_status_idx/i);
    assert.match(universalQrScopeMigration, /alter table qr_order_sessions alter column outlet_id drop not null/i);
    assert.match(universalQrScopeMigration, /add column if not exists selected_outlet_id uuid null references outlets\(id\)/i);
    assert.match(universalQrScopeMigration, /add column if not exists locked_outlet_id uuid null references outlets\(id\)/i);
    assert.match(universalQrScopeMigration, /add column if not exists locked_location_id uuid null references qr_locations\(id\)/i);
    assert.match(universalQrScopeMigration, /add column if not exists customer_context jsonb not null default '\{\}'::jsonb/i);
    assert.doesNotMatch(universalQrScopeMigration, /create table if not exists qr_sessions\b/i);
    assert.doesNotMatch(universalQrScopeMigration, /create table if not exists product_availability\b/i);
    assert.doesNotMatch(universalQrScopeMigration, /create table if not exists checkout_sessions\b/i);
    assert.doesNotMatch(universalQrScopeMigration, /create table if not exists idempotency_keys\b/i);
    assert.doesNotMatch(universalQrScopeMigration, /qr_token text\b/i);
  });
});
