# Migration Test Plan

## Goal

Verify MongoDB/Mongoose to Supabase/Postgres migration correctness.

## Dry Run Tests

- Connect to MongoDB.
- Connect to Supabase test project.
- Read all source collections.
- Generate ID map.
- Validate references.
- Check local file existence.
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
complaints
files metadata
```

## Required Reference Validation

Expected zero:

```sql
select count(*) from messages where chat_id is null;
select count(*) from chats where workspace_id is null;
select count(*) from contacts where platform_account_id is null or platform_account_id = '';
select count(*) from orders where workspace_id is null;
select count(*) from complaints where workspace_id is null;
```

## Timestamp Tests

- `createdAt` -> `created_at` preserved.
- `updatedAt` -> `updated_at` preserved.
- `lastMessageAt` -> `last_message_at` preserved.
- Message order remains stable.

## File Tests

- Every migrated attachment with local file has `files` row.
- `messages.attachment_file_id` points to existing file row.
- Legacy `messages.attachment` kept during transition.
- Local file path uses relative path, not absolute path.

## Post-Migration Smoke

- Login.
- Inbox loads.
- Chat messages order correct.
- Human takeover works.
- Telegram webhook works.
- Orders/complaints load.
