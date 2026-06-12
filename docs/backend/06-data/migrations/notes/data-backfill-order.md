# Data Backfill Order — v2

Import order matters because of foreign keys and workspace isolation.

## Phase A — Prepare ID Mapping

1. Read all Mongo collections.
2. Build UUID map for every `_id` in every collection.
3. Build workspace UUID map from distinct Mongo `workspaceId` values.
4. Validate all references before writing.

## Phase B — Core CRM Import

1. Insert `workspaces` from distinct Mongo `workspaceId`.
2. Insert `users`.
3. Update `workspaces.owner_user_id`.
4. Insert `settings`.
5. Insert `platforms`.
6. Insert `agents`.
7. Insert agent child tables:
   - `agent_knowledge`
   - `agent_followups`
   - `agent_database_files`
   - `agent_complaint_fields`
   - `agent_outlets`
   - `agent_products`
   - `agent_sales_forms`
   - `agent_sales_form_fields`
   - `agent_sales_form_products`
8. Insert `contacts`.
9. Insert `chats`.
10. Verify/copy local files and insert `files` metadata.
11. Patch `agent_database_files.file_id`.
12. Insert `messages`.
13. Insert legacy `orders`.
14. Insert `complaints`.
15. Insert `knowledge_files`.

## Phase C — Marketplace Bootstrap

After CRM import is stable:

1. Create product categories if needed.
2. Migrate selected `agent_products` / `agent_sales_form_products` to `products`.
3. Create `product_variants` only when variants are meaningful.
4. Insert `product_images` for local/public product images.
5. Do not backfill old carts; carts are new runtime data.
6. Do not backfill payments unless old manual proofs need audit records.

## Phase D — Runtime Tables

Runtime-only tables usually start empty:

```txt
carts
cart_items
checkouts
payments
payment_events
webhook_events
ai_actions
```

Exception: `webhook_events` can be seeded with recent processed external message ids if you need duplicate protection during cutover.

## Backfill Validations

After import, required-reference counts must be zero:

```sql
select count(*) from messages where chat_id is null;
select count(*) from chats where workspace_id is null;
select count(*) from contacts where platform_account_id = '';
select count(*) from orders where workspace_id is null;
select count(*) from complaints where workspace_id is null;
```

Cross-workspace mismatches must return zero rows:

```sql
select *
from messages m
join chats c on c.id = m.chat_id
where m.workspace_id <> c.workspace_id;
```

## Timestamp Preservation

Always preserve:

```txt
createdAt -> created_at
updatedAt -> updated_at
lastMessageAt -> last_message_at
```

Message ordering and inbox sorting depend on timestamps.
