# Cutover Plan — Supabase Fresh Start

## Goal

Switch backend reads/writes from legacy MongoDB/Mongoose to Supabase/Postgres domain-by-domain while preparing the app for Telegram marketplace MVP.

## Approved Mode

```txt
Full Supabase end-state
Staged domain-by-domain cutover
Start fresh from Supabase
No Mongo backfill
No dual-write
No legacy data reconciliation
Custom backend auth remains
Supabase Auth deferred
```

## Domain Order

1. Supabase foundation.
2. Workspaces, users, memberships.
3. Outlets and user outlet access.
4. Platforms, integrations, webhook events.
5. Contacts, chats, messages.
6. Products and outlet availability.
7. Carts and checkout sessions.
8. Orders and order items.
9. Payments and payment events.
10. Complaints, files, settings.
11. Agents, AI actions, knowledge.
12. Remove MongoDB and Mongoose.

## Per-Domain Cutover Steps

1. Freeze repository contract and current behavior expectations.
2. Implement Supabase repository and mapping.
3. Add Supabase repository tests.
4. Add integration tests for route/service paths.
5. Add security/isolation tests for workspace and outlet scope.
6. Switch service/route path to Supabase-backed repository.
7. Remove direct Mongoose access for that domain.
8. Run domain smoke tests.
9. Monitor logs and error rates.

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
- Verify AI skip when `taken_over_by_user_id` exists.
- Create/update order.
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
- Payment webhook updates payment and order payment status.
- Telegram user receives paid confirmation.

## Final Mongo Removal

Only after every runtime domain is Supabase-backed and full regression/security tests pass:

1. Remove Mongo connection/bootstrap code.
2. Remove Mongoose models.
3. Remove Mongoose dependency and lockfile entries.
4. Remove MongoMemoryServer and Mongo-specific test setup.
5. Remove `DATA_SOURCE=mongo` fallback.
6. Remove obsolete Mongo environment variables.
7. Update affected docs/specs and regenerate generated bundles.

## Rollback/Stop Plan

During staged cutover, stop or revert only the current unreleased domain path. Do not use dual-write as rollback. After final Mongo removal, rollback is normal app/database restore around Supabase backups and deployment artifacts.
