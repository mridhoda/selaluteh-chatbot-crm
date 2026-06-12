# Release Checklist

Checklist sebelum backend MVP dirilis/demo.

## Pre-Release

- [ ] Current branch is clean.
- [ ] Env variables reviewed.
- [ ] Secrets are not committed.
- [ ] Database backup exists.
- [ ] Local uploads backup exists.
- [ ] Migration tested in staging.
- [ ] Payment sandbox tested.
- [ ] Telegram webhook URL confirmed.
- [ ] Admin account ready.
- [ ] Sample products ready.

## Core Smoke Tests

- [ ] Owner can login.
- [ ] Dashboard loads.
- [ ] Platforms page loads.
- [ ] Agents page loads.
- [ ] Inbox loads.
- [ ] Chat messages load.
- [ ] Human takeover works.
- [ ] AI skip works when takeover exists.
- [ ] Product list loads.
- [ ] Product detail loads.
- [ ] Cart works.
- [ ] Checkout creates order.
- [ ] Payment link is generated.
- [ ] Payment webhook updates payment.
- [ ] Telegram receives paid notification.

## Security Checks

- [ ] Orders API requires auth.
- [ ] Complaints API requires auth.
- [ ] Workspace isolation tested.
- [ ] Payment webhook signature verified.
- [ ] Webhook idempotency tested.
- [ ] Service role key not exposed.
- [ ] Public files policy is understood.
- [ ] Diagnostic routes removed/protected.

## Observability

- [ ] Backend logs webhook receipt.
- [ ] Backend logs payment events.
- [ ] Backend logs AI action errors.
- [ ] Error response format is consistent.
- [ ] Manual runbook exists.

## Rollback Plan

- [ ] Rollback steps documented.
- [ ] Previous deployment can be restored.
- [ ] Mongo/Supabase data state understood.
- [ ] Webhook re-pointing process documented.

## Release Decision

Release can proceed only if all P0 checks pass.
