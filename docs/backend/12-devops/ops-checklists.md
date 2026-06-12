# Ops Checklists

## Daily Checklist

- [ ] Backend running.
- [ ] No critical errors.
- [ ] Telegram webhook healthy.
- [ ] Payment webhook healthy.
- [ ] Disk usage normal.
- [ ] Backup succeeded.
- [ ] No invalid payment signature spike.

## Weekly Checklist

- [ ] Review logs.
- [ ] Review failed webhooks.
- [ ] Review failed payments.
- [ ] Review AI provider errors.
- [ ] Review storage growth.
- [ ] Review admin users.
- [ ] Test backup restore in staging if possible.

## Pre-Deploy Checklist

- [ ] Scope understood.
- [ ] Backup taken if needed.
- [ ] Env changes reviewed.
- [ ] Rollback plan ready.
- [ ] Smoke tests ready.
- [ ] Maintenance planned if high risk.

## Post-Deploy Checklist

- [ ] Login works.
- [ ] Dashboard works.
- [ ] Inbox works.
- [ ] Telegram works.
- [ ] Payment works if touched.
- [ ] Logs clean.
- [ ] Deployment logged.

## Incident Checklist

- [ ] Severity assigned.
- [ ] Impact assessed.
- [ ] Containment done.
- [ ] Fix applied.
- [ ] Smoke test run.
- [ ] Postmortem written.
