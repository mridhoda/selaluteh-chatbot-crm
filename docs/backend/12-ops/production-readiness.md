# Production Readiness

## Required Before Production

### Security

- [ ] Orders routes require auth.
- [ ] Complaints routes require auth.
- [ ] Workspace isolation tested.
- [ ] Diagnostic routes removed/protected.
- [ ] Payment webhook signature verified.
- [ ] Webhook idempotency implemented.
- [ ] Secrets are not committed.
- [ ] Service role key is server-side only.

### Data

- [ ] Database backup process exists.
- [ ] Uploads backup process exists.
- [ ] Restore process tested.
- [ ] Local uploads are mounted as persistent volume.
- [ ] Migration scripts tested in staging.
- [ ] Data validation queries prepared.

### Webhooks

- [ ] Telegram webhook URL uses HTTPS.
- [ ] Meta webhook verification works.
- [ ] Payment webhook endpoint is reachable.
- [ ] Duplicate webhook handling tested.
- [ ] Webhook logs include event ids.

### Payment

- [ ] Sandbox payment flow tested.
- [ ] Payment event logging exists.
- [ ] Payment status transition rules implemented.
- [ ] Paid notification tested.
- [ ] Failed/expired payment handling documented.

### Observability

- [ ] Request logs available.
- [ ] Error logs available.
- [ ] Webhook logs searchable.
- [ ] Payment event logs searchable.
- [ ] AI provider errors visible.
- [ ] Alerting threshold defined.

### Deployment

- [ ] Env variables documented.
- [ ] Build command tested.
- [ ] Start command tested.
- [ ] Rollback plan documented.
- [ ] Smoke tests documented.
- [ ] Maintenance window process documented.

## Production Blockers

Do not go production if any of these are true:

- Payment webhook can be spoofed.
- Orders/complaints are public.
- Local uploads are not persistent.
- There is no database backup.
- Service role key is exposed to frontend.
- Telegram duplicate webhook can create duplicate paid orders.
- No rollback path exists.
