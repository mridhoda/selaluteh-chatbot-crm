# Migration Operations

## Scope

This document covers operational steps for MongoDB/Mongoose to Supabase/Postgres migration.

Current rule: preparation and staging validation only. Do not perform Supabase MCP writes or production cutover until the pre-migration checklist is complete.

## Migration Rule

Do not perform production cutover without:

- Mongo backup.
- Uploads backup.
- Import dry run.
- Validation report.
- Secret migration or rotation decision.
- Auth phase-1 decision: custom backend auth with service-role Supabase access.
- Rollback plan.
- Maintenance window.

## Pre-Migration

- [ ] Freeze or pause writes if doing final cutover.
- [ ] Stop webhooks or point to maintenance endpoint.
- [ ] Stop background jobs.
- [ ] Backup Mongo.
- [ ] Backup uploads.
- [ ] Confirm Supabase migrations applied.
- [ ] Confirm service role key server-side only.
- [ ] Confirm Supabase Auth is deferred unless separately approved.
- [ ] Confirm platform tokens/secrets will be encrypted before import or rotated after import.
- [ ] Run import dry run.

## Migration

1. Build `mongo_id_map`.
2. Insert workspaces.
3. Insert users.
4. Insert memberships and outlet access.
5. Insert settings/platforms/agents.
6. Insert contacts/chats.
7. Insert file metadata.
8. Insert messages.
9. Insert products and outlet availability.
10. Insert carts/cart_items and checkouts/checkout_items.
11. Insert orders/order_items/order_events.
12. Insert payments/payment_attempts/payment_events and webhook_events.
13. Insert complaints and active auth transient rows if required.
14. Run validation queries.

## Post-Migration

- [ ] Start backend on Supabase env.
- [ ] Keep frontend direct table reads disabled unless explicitly approved.
- [ ] Run smoke tests.
- [ ] Re-enable webhooks.
- [ ] Monitor logs.
- [ ] Keep Mongo backup until confidence period ends.

## Validation Gates

- `sql/009_migration_validation_queries.sql` returns no orphan/cross-workspace rows.
- Duplicate checks return no rows for webhook events, payment events, checkout idempotency keys, and order numbers.
- `mongo_id_map.target_uuid` is populated for every imported source id.
- Payment sandbox webhook proves `orders.payment_status` and `payment_events.processing_status` updates work.

## Rollback

Rollback only if:

- writes were frozen
- old Mongo remains valid
- uploads backup remains valid
- new Supabase-only writes can be discarded or reconciled
