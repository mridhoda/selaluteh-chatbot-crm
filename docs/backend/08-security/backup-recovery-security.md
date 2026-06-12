# Backup & Recovery Security

## Backup Scope

Must include:

```txt
Supabase/Postgres database
local uploads directory
.env/secrets backup in secure secret manager
migration id maps during cutover
```

## Backup Consistency

Database and uploads backup must be from same time window.

Important because rows may point to local files:

```txt
files.relative_path -> local uploads file
messages.attachment_file_id -> files.id
orders.payment_proof_file_id -> files.id
```

## Restore Test

At least before production launch:

1. Restore database to staging.
2. Restore uploads to staging.
3. Run app smoke tests.
4. Open chat attachments.
5. Open product images.
6. Verify order/payment rows.

## Security of Backups

- Encrypt backups.
- Restrict access.
- Do not store backups in public buckets.
- Rotate credentials for backup systems.
- Do not include plaintext `.env` in casual zip exports.

## Recovery Priority

1. Auth/users/workspaces.
2. Platforms/agents.
3. Chats/messages/contacts.
4. Orders/payments.
5. Files/uploads.
6. Analytics/logs.

## RPO/RTO Suggested MVP

```txt
RPO: max 24 hours data loss during early MVP
RTO: restore within same day
```

For paid production marketplace, improve these targets.
