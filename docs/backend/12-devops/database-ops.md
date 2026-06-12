# Database Operations

## Supported Runtime States

The project may operate in one of these states:

1. MongoDB/Mongoose current runtime.
2. Supabase/Postgres target runtime.
3. Temporary migration transition.

## Database Operational Rules

- Always backup before migration.
- Never run destructive migration without backup.
- Preserve message timestamps.
- Preserve workspace ownership.
- Validate record counts after import.
- Do not reuse Mongo ObjectId as UUID.
- Use ID mapping during migration.

## Common Checks

### Mongo

- connection status
- collection counts
- indexes
- orphan messages
- orphan chats
- missing workspace ids

### Postgres/Supabase

- migration status
- table counts
- FK violations
- RLS enabled
- index existence
- slow queries
- storage usage

## Post-Migration Validation

Run checks for:

```sql
select count(*) from messages where chat_id is null;
select count(*) from chats where workspace_id is null;
select count(*) from orders where workspace_id is null;
select count(*) from complaints where workspace_id is null;
```

Expected:

```txt
0 for required references
```

## Emergency DB Procedure

If suspicious data corruption happens:

1. Stop writes.
2. Pause webhooks.
3. Snapshot current DB.
4. Identify affected records.
5. Restore or patch carefully.
6. Run validation.
7. Re-enable writes.
