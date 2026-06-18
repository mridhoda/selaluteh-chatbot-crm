# Supabase Seed Data Order

This document replaces the old Mongo backfill order for the approved cutover mode.

## Approved Mode

```txt
Start fresh from Supabase.
No Mongo backfill.
No dual-write.
No legacy data reconciliation.
MongoDB/Mongoose remains only as temporary legacy regression coverage until removed.
```

## Phase A — Supabase Foundation

1. Apply SQL migrations to Supabase local or a dedicated Supabase test project.
2. Verify extensions, tables, indexes, triggers, and functions.
3. Configure backend-only environment values with placeholders in examples only.
4. Confirm `SUPABASE_SERVICE_ROLE_KEY` and `SUPABASE_DATABASE_URL` are not exposed to frontend, Git, logs, or generated docs with real values.

## Phase B — Core Dev/Test Seed

Seed deterministic records in this order:

1. `workspaces`.
2. `users` with custom backend auth password hashes.
3. `user_workspace_memberships`.
4. `outlets`.
5. `user_outlet_access`.
6. `workspace_settings`.
7. `platforms` with fake/sandbox credentials only.
8. `webhook_events` only when needed for idempotency test fixtures.

## Phase C — Marketplace Seed

After core seed is stable:

1. `product_categories`.
2. `products`.
3. `product_variants` where needed.
4. `product_outlet_availability`.
5. Payment sandbox settings or provider mock configuration.

## Phase D — Runtime Fixture Rows

Only seed runtime rows when a test specifically requires them:

```txt
contacts
chats
chat_messages
carts
cart_items
checkouts
checkout_items
orders
order_items
order_events
payments
payment_events
complaints
files
ai_actions
```

Tests should prefer creating these rows through repositories/services so contracts are exercised.

## Validation Queries

Run `sql/009_migration_validation_queries.sql` after migrations and seed data.

Expected:

```txt
chat_messages without chat = 0
orders without workspace = 0
complaints without workspace = 0
cross-workspace mismatches = 0
```

Legacy `mongo_id_map` checks are informational only for this fresh-start cutover.
