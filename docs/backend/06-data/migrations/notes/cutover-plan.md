# Cutover Plan — v2

## Goal

Switch production backend reads/writes from MongoDB to Supabase/Postgres with minimal data loss risk while preparing the app for Telegram marketplace MVP.

## Recommended Cutover

1. Announce maintenance window.
2. Stop webhook ingestion or point Telegram/Meta webhooks to a maintenance endpoint.
3. Stop backend worker/follow-up scheduler.
4. Disable AI auto-side-effects temporarily if still using `FILE_ORDER_JSON` flow.
5. Run final Mongo export.
6. Ensure local `uploads` are present on target server.
7. Run import into Supabase/Postgres.
8. Run validation queries from `sql/009_migration_validation_queries.sql`.
9. Switch backend env to Supabase.
10. Start backend.
11. Re-enable webhooks.
12. Run smoke tests.
13. Re-enable AI and follow-up scheduler.
14. Enable Telegram marketplace flow only after CRM smoke tests pass.

## Smoke Tests — Existing CRM

- Login owner.
- Load `/billing`.
- Load `/platforms`.
- Load `/agents`.
- Load `/chats`.
- Open chat messages.
- Send human reply in test chat.
- Receive Telegram test webhook.
- Verify duplicate Telegram update does not duplicate message.
- Verify AI skip when `takeover_by` exists.
- Create/update legacy order.
- Create/update complaint.
- Confirm local file URLs still resolve.

## Smoke Tests — New Marketplace MVP

- Admin creates category.
- Admin creates product.
- Telegram `/start` shows menu.
- User opens product list.
- User adds product to cart.
- User views cart.
- User confirms checkout.
- Backend creates pending order with order items.
- Payment sandbox link is created.
- Payment webhook updates payment and order status.
- Telegram user receives paid confirmation.

## Rollback

Rollback is only safe if:

- Mongo writes were frozen during cutover.
- Local uploads were not modified or lost during cutover.
- Webhooks were not writing to Supabase only.
- No new production data must be preserved from Supabase.

If rollback is needed:

1. Disable webhooks again.
2. Stop backend.
3. Restore Mongo env.
4. Start old backend.
5. Re-enable webhooks to old backend.
6. Keep Supabase copy for postmortem.

## No-Rollback Zone

Once live Telegram marketplace orders/payments are written only to Supabase, rollback to Mongo requires data reconciliation.

Before entering no-rollback zone, ensure:

- Supabase backup is enabled.
- Uploads backup is enabled.
- Payment webhook logs are stored.
- Order/payment reconciliation query is ready.
