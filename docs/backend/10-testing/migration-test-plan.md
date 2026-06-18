# Supabase Cutover Test Plan

## Goal

Verify Supabase/Postgres cutover correctness for a fresh-start backend runtime.

This cutover does not import Mongo data. Do not run automated tests against the production Supabase project.

## Approved Cutover Mode

```txt
Start fresh from Supabase.
No Mongo backfill.
No dual-write.
No legacy data reconciliation.
Keep custom backend auth.
Use Supabase local or a dedicated Supabase test project.
```

## Schema and Seed Tests

- Apply SQL migrations to an empty Supabase test database.
- Verify required extensions, tables, indexes, triggers, and functions exist.
- Seed development/testing workspace, owner/admin user, memberships, outlets, outlet access, settings, platforms, products, and payment sandbox settings.
- Verify seed data uses fake provider credentials and no real service secrets.
- Verify `SUPABASE_SERVICE_ROLE_KEY` and `SUPABASE_DATABASE_URL` are only provided through secure backend/test environment variables.

## Domain Repository Tests

Each completed cutover domain must include Supabase repository tests for:

```txt
workspace isolation
outlet isolation where relevant
not found behavior
duplicate prevention
idempotency
transaction consistency
camelCase/snake_case mapping
database error mapping
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

Run `docs/backend/06-data/migrations/sql/009_migration_validation_queries.sql` after migrations and seed data. Legacy import-specific checks such as `mongo_id_map` are informational only for this fresh-start cutover.

## Runtime Tests

- Login uses custom backend auth with Supabase-backed user persistence.
- Inbox loads from Supabase and messages are ordered correctly.
- Human takeover works.
- Telegram webhook creates/updates contacts, chats, messages, and webhook events through Supabase.
- Products, carts, checkout, orders, payments, complaints, files, settings, and AI actions work through Supabase-backed repositories after their domain is cut over.
- Payment webhook updates `orders.payment_status` without conflating order lifecycle `status`.

## File Tests

- Every uploaded attachment with local file has a `files` row.
- `messages.attachment_file_id` points to existing file row when attachment metadata is normalized.
- Local file path uses relative path, not absolute path.
- Binary files remain in local storage; Postgres stores metadata only.

## Payment/Event Tests

- Payment creation stores provider reference and amount snapshot.
- Provider webhook verifies signature before state mutation.
- `processing_status`, `verification_result`, amount fields, payment method, and raw payload are preserved.
- Duplicate provider events are rejected by unique constraints/idempotency checks.
- Order lifecycle `status` remains separate from `payment_status`.

## Legacy Regression Tests

- MongoMemory tests may remain temporarily only for legacy domains that have not been moved.
- Do not add new Mongo tests.
- After all domains are Supabase-backed, remove MongoMemoryServer and Mongo-specific test setup.

## Post-Cutover Smoke

- Login.
- Inbox loads.
- Chat messages order correct.
- Human takeover works.
- Telegram webhook works.
- Orders/complaints load.
- Payment webhook works in sandbox and updates `orders.payment_status` without conflating order lifecycle `status`.
