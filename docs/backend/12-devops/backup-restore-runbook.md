# Backup and Restore Runbook

## Backup Scope

Backup must include:

```txt
database
local uploads
env/config snapshot
migration/import reports
```

## Database Backup

Current possible runtime:

- MongoDB/Mongoose.
- Supabase/Postgres target.

### MongoDB Backup

Example:

```bash
mongodump --uri="$MONGODB_URI" --out="./backups/mongo-$(date +%Y%m%d-%H%M)"
```

### Postgres Backup

Example:

```bash
pg_dump "$DATABASE_URL" > "./backups/postgres-$(date +%Y%m%d-%H%M).sql"
```

For Supabase, use Supabase dashboard/CLI backup strategy.

## Local Uploads Backup

Current/target uploads:

```txt
server/uploads
```

Recommended:

```bash
tar -czf uploads-$(date +%Y%m%d-%H%M).tar.gz server/uploads
```

## Backup Frequency

Minimum recommendation:

| Data | Frequency |
|---|---|
| Production database | Daily |
| Production uploads | Daily |
| Before migration | Immediately before |
| Before high-risk deploy | Immediately before |
| Env/config snapshot | Before env change |

## Restore Test

A backup is not reliable until restore is tested.

Test restore in staging:

- restore database
- restore uploads
- start backend
- load dashboard
- open chat messages
- open files/media
- test Telegram webhook in staging

## Restore Procedure

1. Stop backend writes.
2. Stop webhooks if production.
3. Restore database.
4. Restore uploads.
5. Verify env points to restored system.
6. Start backend.
7. Run smoke tests.
8. Re-enable webhooks.

## Data Consistency Rule

Database backup and uploads backup should come from the same time window.

Otherwise messages/files may point to missing files.
