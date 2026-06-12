# Maintenance Window

## When Maintenance Is Needed

Use maintenance window for:

- database cutover
- high-risk schema migration
- payment webhook refactor
- local storage migration
- production secret rotation
- major deployment

## Maintenance Plan Template

```md
# Maintenance Plan

Date:
Start time:
Expected duration:
Owner:
Affected services:

## Scope

## Pre-checks

## Steps

## Validation

## Rollback

## Communication
```

## Maintenance Steps

1. Announce maintenance.
2. Disable or pause webhooks.
3. Stop jobs/workers.
4. Backup database/uploads.
5. Apply changes.
6. Run validation.
7. Start services.
8. Re-enable webhooks.
9. Run smoke tests.
10. Monitor.

## Communication Message Example

```txt
Kami sedang melakukan maintenance singkat untuk meningkatkan stabilitas sistem. Pesan/order mungkin tertunda sementara. Terima kasih 🙏
```
