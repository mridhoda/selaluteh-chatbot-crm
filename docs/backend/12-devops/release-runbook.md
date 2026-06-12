# Release Runbook

## Purpose

This runbook is for planned releases.

## Release Types

| Type | Description | Risk |
|---|---|---|
| Patch | Bug fix or docs update | Low |
| Minor | New non-critical feature | Medium |
| Major | Payment/database/webhook/schema change | High |
| Hotfix | Urgent production fix | Medium-High |

## Release Checklist

### Before Release

- [ ] Release scope is clear.
- [ ] Related docs updated.
- [ ] Tests run or documented as not run.
- [ ] Env changes documented.
- [ ] Migration needed? yes/no.
- [ ] Backup needed? yes/no.
- [ ] Rollback plan exists.
- [ ] Owner/admin notified if needed.

### During Release

- [ ] Deploy backend.
- [ ] Deploy frontend if needed.
- [ ] Run DB migration if needed.
- [ ] Restart jobs/workers if needed.
- [ ] Re-enable webhooks if paused.
- [ ] Run smoke tests.

### After Release

- [ ] Monitor logs.
- [ ] Confirm no payment/webhook errors.
- [ ] Confirm dashboard works.
- [ ] Confirm Telegram bot works.
- [ ] Update implementation status.
- [ ] Record release notes.

## High-Risk Release Rule

If release touches:

- payment webhook
- order status
- database migration
- file storage
- Telegram webhook
- auth/workspace access

Then require:

- backup
- staging test
- smoke test
- rollback plan
