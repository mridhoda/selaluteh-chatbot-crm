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

-- Payment Events
create unique index uq_payment_events_provider_event_present on payment_events(coalesce(provider, ''), provider_event_id) where provider_event_id is not null and provider_event_id <> '';
create index idx_payment_events_payment_received on payment_events(payment_id, received_at desc);
create index idx_payment_events_order_received on payment_events(order_id, received_at desc);
create index idx_payment_events_processing on payment_events(processing_status);

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
```
