# Migration Operations

## Scope

This document covers operational steps for MongoDB/Mongoose to Supabase/Postgres migration.

## Migration Rule

Do not perform production cutover without:

- Mongo backup.
- Uploads backup.
- Import dry run.
- Validation report.
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
- [ ] Run import dry run.

## Migration

1. Build ID map.
2. Insert workspaces.
3. Insert users.
4. Insert settings/platforms/agents.
5. Insert contacts/chats.
6. Insert file metadata.
7. Insert messages.
8. Insert orders/complaints.
9. Insert marketplace tables if needed.
10. Run validation queries.

## Post-Migration

- [ ] Start backend on Supabase env.
- [ ] Run smoke tests.
- [ ] Re-enable webhooks.
- [ ] Monitor logs.
- [ ] Keep Mongo backup until confidence period ends.

## Rollback

Rollback only if:

- writes were frozen
- old Mongo remains valid
- uploads backup remains valid
- new Supabase-only writes can be discarded or reconciled
