# Implementation Checklist

Checklist praktis untuk mengubah current Chatbot CRM menjadi Telegram-first Marketplace MVP dengan Supabase/Postgres.

## Phase 0 — Safety Fixes

- [ ] Secure `/orders` route with auth.
- [ ] Add workspace filter to all order queries.
- [ ] Secure `/complaints` route with auth.
- [ ] Add workspace filter to all complaint queries.
- [ ] Remove/protect diagnostic user routes.
- [ ] Mount `/settings` route or remove settings UI dependency.
- [ ] Fix frontend Vite env usage replacing `REACT_APP_*`.
- [ ] Confirm `.env` ignored.
- [ ] Rotate exposed secrets if any.
- [ ] Add Telegram webhook idempotency.
- [ ] Add duplicate message guard by `platform_message_id`.

## Phase 1 — Repository Layer

- [ ] Create repositories folder.
- [ ] Add users/platforms/agents repositories.
- [ ] Add contacts/chats/chat_messages repositories.
- [ ] Add files/orders/complaints repositories.
- [ ] Add products/carts/payments repositories.
- [ ] Refactor routes to call repositories/services.
- [ ] Keep behavior unchanged.

## Phase 2 — Supabase Schema

- [ ] Create Supabase project.
- [ ] Enable `pgcrypto`, `citext`, `pg_trgm`.
- [ ] Create enums.
- [ ] Create identity tables.
- [ ] Create integration tables.
- [ ] Create files table.
- [ ] Create agents table with embedded JSON.
- [ ] Create agent_outlets mapping table.
- [ ] Create CRM tables.
- [ ] Create operations tables.
- [ ] Create marketplace tables.
- [ ] Create payment tables.
- [ ] Create indexes/triggers/RLS.

## Phase 3 — Supabase Foundation and Seed Data

- [ ] Implement Supabase service role connection.
- [ ] Validate `DATA_SOURCE=supabase`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, and `SUPABASE_DATABASE_URL`.
- [ ] Add camelCase/snake_case mapping helpers.
- [ ] Add repository conventions and error mapping.
- [ ] Add transaction conventions.
- [ ] Add workspace/outlet scoping conventions.
- [ ] Add Supabase local or dedicated test project setup.
- [ ] Seed workspaces/users/workspace_settings/outlets/platforms with fake credentials.
- [ ] Seed products and outlet availability for dev/test.
- [ ] Do not implement Mongo backfill, dual-write, or legacy reconciliation.

## Phase 4 — Supabase Runtime Switch

- [ ] Add `DATA_SOURCE=supabase`.
- [ ] Add Supabase client.
- [ ] Switch auth/platform/agent repositories.
- [ ] Switch contact/chat/message repositories.
- [ ] Switch products/outlet availability repositories.
- [ ] Switch carts/checkout repositories.
- [ ] Switch orders/payments repositories.
- [ ] Switch complaints/files/settings repositories.
- [ ] Verify Telegram webhook.
- [ ] Verify dashboard inbox.
- [ ] Verify human takeover.
- [ ] Verify AI reply.

## Phase 4.5 — Remove MongoDB and Mongoose

- [ ] Remove Mongo connection/bootstrap code.
- [ ] Remove Mongoose models.
- [ ] Remove Mongoose dependency.
- [ ] Remove MongoMemoryServer and Mongo-specific test setup.
- [ ] Remove `DATA_SOURCE=mongo` fallback.
- [ ] Remove obsolete Mongo environment variables.
- [ ] Run full regression/security tests.
- [ ] Update affected docs/specs and regenerate generated bundles.

## Phase 5 — Product Catalog

- [ ] Add Product API.
- [ ] Add Category API.
- [ ] Add Variant API.
- [ ] Add product image upload.
- [ ] Add admin products page.
- [ ] Add active/inactive toggle.
- [ ] Add product search.

## Phase 6 — Cart

- [ ] Add cart service.
- [ ] Find/create active cart by contact/platform.
- [ ] Add item/update quantity/remove item.
- [ ] Clear cart.
- [ ] Recalculate totals.
- [ ] Cart workspace validation tests.

## Phase 7 — Telegram Commerce

- [ ] Add inline keyboard helpers.
- [ ] Implement `/start` marketplace menu.
- [ ] Browse products callback.
- [ ] Product detail callback.
- [ ] Add to cart callback.
- [ ] View cart callback.
- [ ] Checkout callback.
- [ ] Order status callback.
- [ ] Talk to admin callback.
- [ ] Callback query answer/error handling.

## Phase 8 — Checkout

- [ ] Create checkout service.
- [ ] Validate active cart.
- [ ] Validate item availability.
- [ ] Ask delivery/customer data if required.
- [ ] Store temporary checkout state in `chats.state`.
- [ ] Show final confirmation.
- [ ] Create order/order_items.
- [ ] Mark cart ordered.
- [ ] Generate order number.
- [ ] Prevent duplicate checkout.

## Phase 9 — Payment Sandbox

- [ ] Choose provider, recommended Midtrans.
- [ ] Add env keys.
- [ ] Add payment provider client.
- [ ] Add create payment link service.
- [ ] Add payment webhook route.
- [ ] Insert payment events.
- [ ] Verify signature.
- [ ] Map provider status.
- [ ] Update payments/orders.
- [ ] Send Telegram notification.
- [ ] Test success/failed/expired/duplicate webhook.

## Phase 10 — AI Guardrails

- [ ] Update AI system prompt.
- [ ] Add read-only product context.
- [ ] Add read-only cart context.
- [ ] Add current-contact order status context.
- [ ] Prevent AI from marking paid.
- [ ] Prevent AI from creating final marketplace order directly.
- [ ] Move legacy order marker into service.
- [ ] Add human escalation rules.

## Phase 11 — Admin MVP

- [ ] Products page.
- [ ] Product detail/edit page.
- [ ] Orders page with order_items.
- [ ] Order detail page.
- [ ] Payment status display.
- [ ] Manual fulfillment status update.
- [ ] Chat/order link in dashboard.
- [ ] Product image preview.

## Final MVP Acceptance

Telegram user can:

- [ ] start bot
- [ ] see menu
- [ ] browse products
- [ ] view product detail
- [ ] add to cart
- [ ] view cart
- [ ] checkout
- [ ] receive payment link
- [ ] complete sandbox payment
- [ ] receive paid notification
- [ ] check order status

Admin can:

- [ ] login
- [ ] create product
- [ ] view customer chat
- [ ] takeover chat
- [ ] view order
- [ ] view payment status
- [ ] update fulfillment status

System can:

- [ ] prevent duplicate Telegram events
- [ ] prevent duplicate payment webhook side effects
- [ ] keep workspace isolation
- [ ] preserve local file references
- [ ] keep CRM behavior working
