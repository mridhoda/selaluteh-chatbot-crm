# Rollback Runbook

## Goal

Restore previous working version when deployment causes critical issue.

## When to Rollback

Rollback if:

- Login broken.
- Dashboard inaccessible.
- Telegram webhook broken.
- Payment webhook broken.
- Orders cannot be created/updated.
- Data corruption detected.
- Cross-workspace leak detected.
- Severe error rate spike.
- Local files inaccessible after deploy.

## Rollback Types

### Code Rollback

Use when new code breaks behavior but data is still valid.

Steps:

1. Stop backend or put maintenance mode.
2. Deploy previous commit/image.
3. Restart backend.
4. Run smoke tests.
5. Monitor logs.

### Database Rollback

Use only when migration caused damage.

Warning:

```txt
Database rollback is dangerous if new writes happened after migration.
```

Steps:

1. Stop webhooks.
2. Stop backend writes.
3. Restore database backup.
4. Restore compatible code version.
5. Re-enable webhooks.
6. Validate data.

### Webhook Rollback

Use when webhook URL or handler breaks.

Steps:

1. Point webhook to previous backend URL.
2. Or temporarily disable webhook.
3. Deploy fix.
4. Re-enable webhook.
5. Process any recoverable missed events if provider supports.

## Rollback Checklist

- [ ] Incident documented.
- [ ] Impact assessed.
- [ ] Webhooks paused if needed.
- [ ] Previous version identified.
- [ ] Backup available if data rollback needed.
- [ ] Smoke tests passed after rollback.
- [ ] Users/admin notified if needed.

## Post-Rollback

- Identify root cause.
- Add test/checklist to prevent recurrence.
- Update risk log.
- Do not redeploy same change without fix.
