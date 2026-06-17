-- 006_indexes.sql
-- Query indexes aligned to database-schema.md and query-contracts.md.

-- Identity / access
create unique index if not exists users_email_unique on users (email);
create index if not exists users_workspace_id_idx on users (workspace_id);
create index if not exists users_auth_user_id_idx on users (auth_user_id);
create index if not exists idx_outlets_workspace_id on outlets (workspace_id);
create index if not exists idx_outlets_workspace_status on outlets (workspace_id, status);
create unique index if not exists uq_outlets_workspace_code_present on outlets (workspace_id, code) where code is not null and code <> '';
create index if not exists idx_user_workspace_memberships_user on user_workspace_memberships (user_id);
create index if not exists idx_user_workspace_memberships_workspace on user_workspace_memberships (workspace_id);
create index if not exists idx_user_outlet_access_user_workspace on user_outlet_access (user_id, workspace_id);
create index if not exists idx_user_outlet_access_outlet on user_outlet_access (outlet_id);
create unique index if not exists uq_workspace_settings_workspace on workspace_settings (workspace_id);

-- Platforms / agents
create index if not exists idx_platforms_workspace_type_status on platforms (workspace_id, type, status);
create index if not exists idx_platforms_account_lookup on platforms (type, account_id) where account_id is not null;
create index if not exists idx_agents_workspace_id on agents (workspace_id);
create index if not exists idx_agents_platform_id on agents (platform_id);
create index if not exists idx_agent_outlets_agent on agent_outlets (agent_id);
create index if not exists idx_agent_outlets_outlet on agent_outlets (outlet_id);

-- CRM
create index if not exists idx_contacts_workspace_platform_external on contacts (workspace_id, platform_id, external_id);
create index if not exists idx_contacts_workspace_last_outlet on contacts (workspace_id, last_outlet_id);
create index if not exists idx_contacts_tags_gin on contacts using gin (tags);
create index if not exists idx_chats_workspace_platform_status on chats (workspace_id, platform_id, status);
create index if not exists idx_chats_workspace_outlet_status on chats (workspace_id, current_outlet_id, status);
create index if not exists idx_chats_last_message_at on chats (workspace_id, last_message_at desc nulls last);
create index if not exists idx_chats_takeover_by on chats (workspace_id, taken_over_by_user_id);
create index if not exists idx_chats_escalated on chats (workspace_id, is_escalated);
create index if not exists idx_chat_messages_chat_created on chat_messages (chat_id, created_at desc);
create index if not exists idx_chat_messages_platform_message_id on chat_messages (platform_message_id) where platform_message_id is not null;

-- Webhooks / AI audit
create index if not exists idx_webhook_events_workspace on webhook_events (workspace_id, received_at desc);
create index if not exists idx_webhook_events_status on webhook_events (status, received_at desc);
create unique index if not exists uq_webhook_events_provider_platform_external
  on webhook_events (provider, coalesce(platform_id, '00000000-0000-0000-0000-000000000000'::uuid), external_event_id);
create index if not exists idx_ai_actions_workspace_chat on ai_actions (workspace_id, chat_id, created_at desc);

-- Files / catalog
create index if not exists idx_files_workspace_source on files (workspace_id, source);
create index if not exists idx_product_categories_workspace_status on product_categories (workspace_id, status, sort_order);
create index if not exists idx_products_workspace_status on products (workspace_id, is_active);
create index if not exists idx_products_workspace_category on products (workspace_id, category_id);
create unique index if not exists uq_products_workspace_slug_present on products (workspace_id, slug) where slug is not null and slug <> '';
create unique index if not exists uq_products_workspace_sku_present on products (workspace_id, sku) where sku is not null and sku <> '';
create index if not exists idx_product_variants_product on product_variants (product_id, is_active, sort_order);
create unique index if not exists uq_product_variants_workspace_sku_present on product_variants (workspace_id, sku) where sku is not null and sku <> '';
create index if not exists idx_product_outlet_availability_workspace_outlet on product_outlet_availability (workspace_id, outlet_id);
create index if not exists idx_product_outlet_availability_product on product_outlet_availability (product_id);
create index if not exists idx_product_outlet_availability_product_outlet on product_outlet_availability (product_id, outlet_id);
create unique index if not exists uq_product_outlet_availability_scope
  on product_outlet_availability (workspace_id, product_id, coalesce(variant_id, '00000000-0000-0000-0000-000000000000'::uuid), outlet_id);

-- Cart / checkout
create index if not exists idx_carts_workspace_contact_platform_outlet_status on carts (workspace_id, contact_id, platform_id, outlet_id, status);
create index if not exists idx_carts_workspace_chat_status on carts (workspace_id, chat_id, status);
create index if not exists idx_carts_expires_at on carts (expires_at) where expires_at is not null;
create index if not exists idx_cart_items_cart on cart_items (cart_id);
create unique index if not exists uq_cart_items_cart_product_variant
  on cart_items (cart_id, product_id, coalesce(variant_id, '00000000-0000-0000-0000-000000000000'::uuid));
create index if not exists idx_checkouts_cart on checkouts (cart_id);
create index if not exists idx_checkouts_status on checkouts (workspace_id, status, created_at desc);
create index if not exists idx_checkouts_cart_status on checkouts (cart_id, status);
create index if not exists idx_checkouts_expires_at on checkouts (expires_at) where expires_at is not null;
create unique index if not exists uq_checkouts_workspace_idempotency_present
  on checkouts (workspace_id, idempotency_key) where idempotency_key is not null and idempotency_key <> '';
create index if not exists idx_checkout_items_checkout on checkout_items (checkout_id);

-- Orders / payments / complaints
create index if not exists idx_orders_workspace_outlet_created on orders (workspace_id, outlet_id, created_at desc);
create index if not exists idx_orders_workspace_status_created on orders (workspace_id, status, created_at desc);
create index if not exists idx_orders_workspace_payment_status_created on orders (workspace_id, payment_status, created_at desc);
create index if not exists idx_orders_contact_created on orders (contact_id, created_at desc);
create unique index if not exists uq_orders_workspace_order_number_present
  on orders (workspace_id, order_number) where order_number is not null and order_number <> '';
create index if not exists idx_order_items_order on order_items (order_id);
create index if not exists idx_order_items_product on order_items (product_id);
create index if not exists idx_order_events_order_created on order_events (order_id, created_at desc);
create unique index if not exists uq_payment_provider_settings_workspace_provider on payment_provider_settings (workspace_id, provider);
create index if not exists idx_payments_workspace_outlet_created on payments (workspace_id, outlet_id, created_at desc);
create index if not exists idx_payments_workspace_status_created on payments (workspace_id, status, created_at desc);
create index if not exists idx_payments_order on payments (order_id);
create index if not exists idx_payments_order_attempt on payments (order_id, attempt_number desc);
create index if not exists idx_payments_reconciliation on payments (reconciliation_status);
create index if not exists idx_payments_provider_ref on payments (provider, provider_ref) where provider_ref is not null;
create unique index if not exists uq_payments_provider_transaction_present
  on payments (provider_transaction_id) where provider_transaction_id is not null and provider_transaction_id <> '';
create unique index if not exists uq_payments_merchant_reference_present
  on payments (merchant_reference) where merchant_reference is not null and merchant_reference <> '';
create index if not exists idx_payment_attempts_payment_created on payment_attempts (payment_id, created_at desc);
create unique index if not exists uq_payment_attempts_payment_attempt_number on payment_attempts (payment_id, attempt_number);
create index if not exists idx_payment_events_payment_created on payment_events (payment_id, received_at desc);
create index if not exists idx_payment_events_order_received on payment_events (order_id, received_at desc);
create index if not exists idx_payment_events_processing on payment_events (processing_status, received_at desc);
create unique index if not exists uq_payment_events_provider_event_present
  on payment_events (coalesce(provider, ''), provider_event_id) where provider_event_id is not null and provider_event_id <> '';
create index if not exists idx_complaints_workspace_status_created on complaints (workspace_id, status, created_at desc);
create index if not exists idx_complaints_outlet on complaints (workspace_id, outlet_id, status);

-- Recommended partial unique index for one active cart per contact/outlet/platform:
-- create unique index uq_carts_active_contact_outlet_platform
-- on carts (workspace_id, outlet_id, contact_id, platform_id)
-- where status = 'active';
