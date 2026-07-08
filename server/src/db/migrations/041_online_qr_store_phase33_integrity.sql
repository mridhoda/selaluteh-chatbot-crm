-- 041_online_qr_store_phase33_integrity.sql
-- Phase 3.3 additive indexes, constraints, and integrity rules.
-- Runtime table names remain canonical; no greenfield duplicate tables are introduced.

create index if not exists orders_workspace_created_at_idx
  on orders(workspace_id, created_at desc);

create index if not exists orders_outlet_created_at_idx
  on orders(outlet_id, created_at desc);

create index if not exists orders_channel_created_at_idx
  on orders(workspace_id, channel, created_at desc);

create index if not exists orders_payment_status_created_at_idx
  on orders(workspace_id, payment_status, created_at desc);

create index if not exists orders_fulfillment_status_created_at_idx
  on orders(workspace_id, fulfillment_status, created_at desc);

create index if not exists orders_admin_filter_idx
  on orders(workspace_id, outlet_id, channel, payment_status, fulfillment_status, created_at desc);

create unique index if not exists orders_public_order_token_unique_idx
  on orders(public_order_token)
  where public_order_token is not null;

create unique index if not exists orders_workspace_order_number_unique_idx
  on orders(workspace_id, order_number)
  where order_number is not null and order_number <> '';

create unique index if not exists order_idempotency_records_public_checkout_unique_idx
  on order_idempotency_records(workspace_id, idempotency_key)
  where command_type = 'public_checkout';

create index if not exists order_idempotency_records_expires_idx
  on order_idempotency_records(expires_at)
  where expires_at is not null;

create index if not exists qr_codes_outlet_status_idx
  on qr_codes(outlet_id, status);

create index if not exists qr_order_sessions_qr_code_created_idx
  on qr_order_sessions(qr_code_id, created_at desc)
  where qr_code_id is not null;

create index if not exists product_outlet_availability_outlet_product_idx
  on product_outlet_availability(outlet_id, product_id);

create index if not exists product_outlet_availability_outlet_available_idx
  on product_outlet_availability(outlet_id, is_available);

create index if not exists payments_status_created_idx
  on payments(workspace_id, status, created_at desc);

create index if not exists payments_order_id_idx
  on payments(order_id);

create index if not exists payments_expires_idx
  on payments(status, expires_at)
  where expires_at is not null;

create unique index if not exists payments_provider_transaction_unique_idx
  on payments(provider, provider_transaction_id)
  where provider_transaction_id is not null;

create unique index if not exists payments_merchant_reference_provider_unique_idx
  on payments(provider, merchant_reference)
  where merchant_reference is not null;

create unique index if not exists payment_provider_settings_one_active_per_mode_idx
  on payment_provider_settings(workspace_id, mode)
  where is_active = true;

drop index if exists payment_provider_settings_one_active_idx;

do $$
begin
  if exists (select 1 from pg_constraint where conname = 'payment_provider_settings_workspace_provider_key') then
    alter table payment_provider_settings drop constraint payment_provider_settings_workspace_provider_key;
  end if;
end $$;

create unique index if not exists payment_provider_settings_workspace_provider_mode_unique_idx
  on payment_provider_settings(workspace_id, provider_code, mode);

create index if not exists payment_status_history_payment_created_idx
  on payment_status_history(payment_id, created_at desc);

create index if not exists payment_status_history_order_created_idx
  on payment_status_history(order_id, created_at desc)
  where order_id is not null;

do $$
begin
  if to_regclass('public.payment_webhook_events') is not null then
    execute 'create index if not exists payment_webhook_events_payload_hash_idx on payment_webhook_events(payload_hash) where payload_hash is not null';
    execute 'create index if not exists payment_webhook_events_processing_created_idx on payment_webhook_events(processing_status, created_at desc)';
  end if;

  if to_regclass('public.payment_events') is not null then
    execute 'create unique index if not exists payment_events_provider_event_unique_idx on payment_events(provider, provider_event_id) where provider_event_id is not null';
    execute 'create index if not exists payment_events_raw_payload_hash_idx on payment_events((md5(raw_payload::text))) where raw_payload is not null';
    execute 'create index if not exists payment_events_processing_created_idx on payment_events(processing_status, created_at desc)';
  end if;

  if to_regclass('public.audit_logs') is not null then
    execute 'create index if not exists audit_logs_workspace_created_idx on audit_logs(workspace_id, created_at desc)';
    execute 'create index if not exists audit_logs_resource_idx on audit_logs(resource_type, resource_id, created_at desc) where resource_id is not null';
    execute 'create index if not exists audit_logs_actor_idx on audit_logs(actor_id, created_at desc) where actor_id is not null';
  end if;
end $$;

do $$
begin
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
end $$;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'payments_status_check') then
    alter table payments add constraint payments_status_check
      check (status in ('pending', 'processing', 'paid', 'failed', 'expired', 'refunded', 'cancelled', 'manual_review')) not valid;
  end if;

  if not exists (select 1 from pg_constraint where conname = 'payments_amount_non_negative_check') then
    alter table payments add constraint payments_amount_non_negative_check
      check (amount >= 0) not valid;
  end if;
end $$;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'order_items_quantity_positive_check') then
    alter table order_items add constraint order_items_quantity_positive_check
      check (quantity > 0) not valid;
  end if;
end $$;
