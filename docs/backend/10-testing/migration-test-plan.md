# Migration Test Plan

## Goal

Verify MongoDB/Mongoose to Supabase/Postgres migration correctness.

This is a pre-MCP readiness plan. Do not write to the real Supabase project until dry-run output, schema review, secret strategy, and rollback plan are approved.

## Dry Run Tests

- Connect to MongoDB.
- Connect to Supabase test project.
- Read all source collections.
- Generate ID map.
- Generate deterministic `mongo_id_map` rows for every source collection.
- Validate references.
- Check local file existence.
- Normalize embedded cart, checkout, order, and payment event arrays into target rows.
- Verify Mongo sparse unique indexes are represented by Postgres partial unique indexes.
- Produce migration report without writing target rows.

## Data Count Tests

Compare counts for:

```txt
users
platforms
agents
contacts
chats
messages
orders
order_items
order_events
payments
payment_events
cart_items
checkout_items
complaints
files metadata
```

## Required Reference Validation

Expected zero:

```sql
select count(*) from chat_messages where chat_id is null;
select count(*) from chats where workspace_id is null;
select count(*) from contacts where external_id is null or external_id = '';
select count(*) from orders where workspace_id is null;
select count(*) from complaints where workspace_id is null;
```

Run `docs/backend/06-data/migrations/sql/009_migration_validation_queries.sql` after every staging import. Expected results are zero for orphan, cross-workspace mismatch, duplicate, and unmapped-ID checks.

## Timestamp Tests

- `createdAt` -> `created_at` preserved.
- `updatedAt` -> `updated_at` preserved.
- `lastMessageAt` -> `last_message_at` preserved.
- Message order remains stable.
- `PaymentEvent.receivedAt` -> `payment_events.received_at` preserved.
- `payments.events[].createdAt` is preserved as `payment_events.created_at` when embedded events are migrated.

## File Tests

- Every migrated attachment with local file has `files` row.
- `messages.attachment_file_id` points to existing file row.
- Legacy `messages.attachment` kept during transition.
- Local file path uses relative path, not absolute path.

## Payment/Event Tests

- `providerTransactionId` migrates to `payments.provider_transaction_id`.
- `merchantReference` migrates to `payments.merchant_reference`.
- `attemptNumber` migrates to `payments.attempt_number` and optional `payment_attempts` rows.
- Standalone `PaymentEvent` rows and embedded `payments.events[]` rows dedupe by provider/provider event id.
- `processingStatus`, `verificationResult`, amount fields, payment method, and raw payload are preserved.
- Duplicate provider events are rejected by the partial unique index.

## Post-Migration Smoke

- Login.
- Inbox loads.
- Chat messages order correct.
- Human takeover works.
- Telegram webhook works.
- Orders/complaints load.
- Payment webhook works in sandbox and updates `orders.payment_status` without conflating order lifecycle `status`.
