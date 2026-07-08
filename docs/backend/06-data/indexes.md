# Indexes

Recommended indexes:

```sql
-- Identity & Membership
create index idx_workspaces_status_name on workspaces(status, name);
create unique index idx_user_workspace_memberships_user_ws on user_workspace_memberships(user_id, workspace_id);
create index idx_user_workspace_memberships_workspace_role on user_workspace_memberships(workspace_id, role);
create index idx_user_workspace_memberships_status_user on user_workspace_memberships(status, user_id);

-- Outlets
create index idx_outlets_workspace_id on outlets(workspace_id);
create index idx_outlets_workspace_status on outlets(workspace_id, status);
create unique index uq_outlets_workspace_code_present on outlets(workspace_id, code) where code is not null and code <> '';

-- User Outlet Access
create unique index idx_user_outlet_access_ws_user_outlet on user_outlet_access(workspace_id, user_id, outlet_id);

-- Platforms
create index idx_platforms_workspace_created on platforms(workspace_id, created_at desc);

-- Contacts
create index idx_contacts_workspace_platform_external on contacts(workspace_id, platform_id, external_id);
create index idx_contacts_workspace_last_outlet on contacts(workspace_id, last_outlet_id);
create index idx_contacts_workspace_search on contacts(workspace_id, name, handle);

-- Chats
create index idx_chats_workspace_contact_status on chats(workspace_id, contact_id, status);
create index idx_chats_workspace_outlet_status on chats(workspace_id, current_outlet_id, status);
create index idx_chats_last_message_at on chats(workspace_id, last_message_at desc);

-- Chat Messages
create index idx_chat_messages_chat_created on chat_messages(chat_id, created_at desc);
create index idx_chat_messages_platform_message_id on chat_messages(platform_message_id) where platform_message_id is not null;

-- Webhook Events
create unique index uq_webhook_events_provider_platform_external
  on webhook_events(provider, coalesce(platform_id, '00000000-0000-0000-0000-000000000000'::uuid), external_event_id);

-- Products
create index idx_products_workspace_status on products(workspace_id, is_active);
create index idx_products_workspace_sku on products(workspace_id, sku);
create unique index uq_products_workspace_slug_present on products(workspace_id, slug) where slug is not null and slug <> '';
create unique index uq_products_workspace_sku_present on products(workspace_id, sku) where sku is not null and sku <> '';

-- Product Outlet Availability
create index idx_poa_workspace_outlet on product_outlet_availability(workspace_id, outlet_id);
create index idx_poa_product_outlet on product_outlet_availability(product_id, outlet_id);
create unique index uq_poa_scope on product_outlet_availability(
  workspace_id,
  product_id,
  coalesce(variant_id, '00000000-0000-0000-0000-000000000000'::uuid),
  outlet_id
);

-- Carts
create index idx_carts_workspace_contact_status_outlet on carts(workspace_id, contact_id, status, outlet_id);
create index idx_carts_workspace_chat_status on carts(workspace_id, chat_id, status);
create index idx_carts_expires_at on carts(expires_at);

-- Checkouts
create unique index uq_checkouts_workspace_idempotency_present on checkouts(workspace_id, idempotency_key) where idempotency_key is not null and idempotency_key <> '';
create index idx_checkouts_cart_status on checkouts(cart_id, status);
create index idx_checkouts_expires on checkouts(expires_at);
create index idx_checkout_items_checkout on checkout_items(checkout_id);

-- Orders
create index idx_orders_workspace_outlet_created on orders(workspace_id, outlet_id, created_at desc);
create index idx_orders_workspace_status_created on orders(workspace_id, status, created_at desc);
create index idx_orders_workspace_payment_status_created on orders(workspace_id, payment_status, created_at desc);
create unique index uq_orders_workspace_order_number_present on orders(workspace_id, order_number) where order_number is not null and order_number <> '';
create index idx_order_items_order on order_items(order_id);

-- Payments
create index idx_payments_workspace_created on payments(workspace_id, created_at desc);
create index idx_payments_workspace_outlet_created on payments(workspace_id, outlet_id, created_at desc);
create index idx_payments_order_attempt on payments(order_id, attempt_number desc);
create unique index uq_payments_provider_transaction_present on payments(provider_transaction_id) where provider_transaction_id is not null and provider_transaction_id <> '';
create unique index uq_payments_merchant_reference_present on payments(merchant_reference) where merchant_reference is not null and merchant_reference <> '';
create index idx_payments_reconciliation on payments(reconciliation_status);
-- Optional hardening for Xendit idempotency if expression indexes are approved:
-- create unique index uq_payments_workspace_order_idempotency_present
--   on payments(workspace_id, order_id, (metadata->>'idempotency_key'))
--   where metadata ? 'idempotency_key' and metadata->>'idempotency_key' <> '';

-- Payment Events
create unique index uq_payment_events_provider_event_present on payment_events(coalesce(provider, ''), provider_event_id) where provider_event_id is not null and provider_event_id <> '';
create index idx_payment_events_payment_received on payment_events(payment_id, received_at desc);
create index idx_payment_events_order_received on payment_events(order_id, received_at desc);
create index idx_payment_events_processing on payment_events(processing_status);

-- Phase 3 Online/QR Store
create unique index storefront_outlets_one_default_idx on storefront_outlets(storefront_id) where is_default = true and status = 'active';
create unique index qr_locations_outlet_code_key on qr_locations(outlet_id, code) where code is not null;
create unique index payment_provider_settings_one_active_per_mode_idx on payment_provider_settings(workspace_id, mode) where is_active = true;
create unique index payment_provider_settings_workspace_provider_mode_unique_idx on payment_provider_settings(workspace_id, provider_code, mode);
create index storefronts_workspace_status_idx on storefronts(workspace_id, status);
create index storefronts_slug_status_idx on storefronts(slug, status);
create index qr_codes_workspace_outlet_idx on qr_codes(workspace_id, outlet_id, status);
create index qr_order_sessions_qr_code_idx on qr_order_sessions(qr_code_id);
create index qr_order_sessions_qr_location_idx on qr_order_sessions(qr_location_id);
create index qr_locations_outlet_sort_idx on qr_locations(outlet_id, status, sort_order);
create index qr_codes_public_code_status_idx on qr_codes(public_code, status);
create index qr_codes_token_hash_status_idx on qr_codes(qr_token_hash, status);
create index qr_order_sessions_status_expires_idx on qr_order_sessions(session_status, expires_at) where session_status is not null;
create index storefront_outlets_visible_sort_idx on storefront_outlets(storefront_id, is_visible, status, sort_order);
create index payment_provider_settings_active_mode_idx on payment_provider_settings(workspace_id, mode) where is_active = true;
create index payments_provider_setting_idx on payments(provider_setting_id) where provider_setting_id is not null;
create unique index payments_provider_ref_unique_idx on payments(provider, provider_ref) where provider_ref is not null;
create index security_events_workspace_created_idx on security_events(workspace_id, created_at desc);

-- Phase 3.3 integrity hardening
create index orders_admin_filter_idx on orders(workspace_id, outlet_id, channel, payment_status, fulfillment_status, created_at desc);
create index orders_outlet_created_at_idx on orders(outlet_id, created_at desc);
create index orders_payment_status_created_at_idx on orders(workspace_id, payment_status, created_at desc);
create unique index orders_public_order_token_unique_idx on orders(public_order_token) where public_order_token is not null;
create unique index orders_workspace_order_number_unique_idx on orders(workspace_id, order_number) where order_number is not null and order_number <> '';
create unique index order_idempotency_records_public_checkout_unique_idx on order_idempotency_records(workspace_id, idempotency_key) where command_type = 'public_checkout';
create index qr_order_sessions_qr_code_created_idx on qr_order_sessions(qr_code_id, created_at desc) where qr_code_id is not null;
create index product_outlet_availability_outlet_product_idx on product_outlet_availability(outlet_id, product_id);
create index payments_order_id_idx on payments(order_id);
create unique index payments_provider_transaction_unique_idx on payments(provider, provider_transaction_id) where provider_transaction_id is not null;
create unique index payments_merchant_reference_provider_unique_idx on payments(provider, merchant_reference) where merchant_reference is not null;
create unique index payment_provider_settings_one_active_per_mode_idx on payment_provider_settings(workspace_id, mode) where is_active = true;
create unique index payment_events_provider_event_unique_idx on payment_events(provider, provider_event_id) where provider_event_id is not null;
create index payment_events_raw_payload_hash_idx on payment_events((md5(raw_payload::text))) where raw_payload is not null;
create index payment_events_processing_created_idx on payment_events(processing_status, created_at desc);

-- AI Actions
create index idx_ai_actions_workspace_chat_created on ai_actions(workspace_id, chat_id, created_at desc);
create index idx_ai_actions_workspace_action_status on ai_actions(workspace_id, action_type, status);
```

Notes:

```txt
- Use workspace-prefixed indexes for all dashboard list pages.
- Use partial unique indexes for one active cart when supported:
  unique(workspace_id, outlet_id, contact_id, platform_id) where status = 'active'
- Runtime Mongo cart/checkout/order items are embedded, but the Postgres migration normalizes them into `cart_items`, `checkout_items`, and `order_items`.
- WebhookEvent uses provider + platform_id + external_event_id uniqueness, with null platform ids normalized by `coalesce`.
- Mongo sparse unique indexes become Postgres partial unique indexes, especially product slug/SKU, outlet code, checkout idempotency key, order number, payment provider transaction id, merchant reference, and payment provider event id.
- Xendit `payment_session_id` is stored in `payments.provider_transaction_id`; Xendit `reference_id` is stored in `payments.merchant_reference`.
- Phase 3.2 detail-schema indexes are additive and use existing runtime tables. They do not introduce duplicate `qr_sessions`, `product_availability`, `checkout_sessions`, or `idempotency_keys` tables.
- Phase 3.3 indexes use existing runtime table names for greenfield concepts, especially `qr_order_sessions`, `product_outlet_availability`, and `order_idempotency_records`.
- Phase 3.3 follow-up replaces the older one-active-provider-per-workspace index with one-active-provider-per-workspace/mode and indexes runtime `payment_events` because webhook processing writes there.
```
