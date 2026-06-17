# Data Backfill Order — v2

Import order matters because of foreign keys and workspace isolation.

Canonical target schema: `database-schema.md` + `migrations/sql/001..005`.

## Phase A — Prepare ID Mapping

1. Read all Mongo collections.
2. Build UUID map for every `_id` in every collection.
3. Build workspace UUID map from distinct Mongo `workspaceId` values.
4. Validate all references before writing.

## Phase B — Core CRM Import

1. Insert `workspaces` from distinct Mongo `workspaceId`.
2. Insert `users`.
3. Update `workspaces.owner_user_id`.
4. Insert `outlets` (create default outlet per workspace if missing).
5. Insert `workspace_settings`.
6. Insert `user_workspace_memberships` and optional `user_outlet_access`.
7. Insert `platforms`.
8. Insert `agents` with embedded JSON config.
9. Insert `agent_outlets` by matching legacy outlet names/codes to `outlets.id`.
10. Insert `contacts`.
11. Insert `chats`.
12. Verify/copy local files and insert `files` metadata.
13. Insert `chat_messages`.
14. Insert legacy `orders`.
15. Insert `complaints`.

## Phase C — Marketplace Bootstrap

After CRM import is stable:

1. Create product categories if needed.
2. Migrate selected legacy agent sales-form products into `products`.
3. Create `product_variants` only when variants are meaningful.
4. Insert `product_outlet_availability`.
5. Do not backfill old carts; carts are new runtime data.
6. Do not backfill payments unless old manual proofs need audit records.

## Phase D — Runtime Tables

Do not seed historical rows for:

```txt
carts
cart_items
checkouts
payments
payment_attempts
payment_events
order_events
webhook_events
ai_actions
```

Exception: `webhook_events` can be seeded with recent processed external message ids if you need duplicate protection during cutover.

## Validation Queries

Run `sql/009_migration_validation_queries.sql` after import.

Expected:

```txt
chat_messages without chat = 0
orders without workspace = 0
complaints without workspace = 0
cross-workspace mismatches = 0
```
