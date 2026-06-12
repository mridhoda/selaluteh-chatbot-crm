<!--
Tech Spec Pack: Telegram-first Marketplace Backend
Project: KALIS.AI / eskala-bot evolution
Target: Chatbot CRM + Telegram Marketplace MVP
Generated: 2026-06-11
-->

# Deployment

## Deployment Goals

- API reachable by dashboard and webhooks.
- Public HTTPS URL for Telegram/Meta/payment webhooks.
- Persistent local uploads storage.
- Safe environment secret handling.
- Separate worker process when queue enabled.

## MVP Deployment Shape

```txt
VPS / Docker host
  ├─ backend-api container
  ├─ backend-worker container
  ├─ web container or static frontend hosting
  ├─ redis container optional
  ├─ uploads persistent volume
  └─ Supabase managed Postgres
```

## Required Public URLs

```txt
PUBLIC_BASE_URL=https://api.yourdomain.com
FRONTEND_URL=https://app.yourdomain.com
```

Webhooks:

```txt
https://api.yourdomain.com/webhook/telegram
https://api.yourdomain.com/webhook/meta
https://api.yourdomain.com/webhook/payments/midtrans
```

## Local Development with Tunnel

For Telegram/Midtrans sandbox webhook testing:

```txt
ngrok / cloudflare tunnel
  -> localhost:5000
```

Set:

```env
PUBLIC_BASE_URL=https://your-tunnel-url
```

Then call Telegram setWebhook endpoint.

## Docker Volumes

Must persist:

```txt
server/uploads
```

Example:

```yaml
volumes:
  - ./server/uploads:/app/server/uploads
```

Never deploy with a process that wipes uploads.

## Environment Per Stage

### Local

- Mongo or Supabase local/staging.
- Payment sandbox.
- Tunnel for webhooks.

### Staging

- Supabase staging project.
- Payment sandbox.
- Test Telegram bot.
- Copied sample uploads.

### Production

- Supabase production.
- Production Telegram bot.
- Payment sandbox first, then production payment only after QA.
- Backups configured.

## Deploy Order

1. Run SQL migrations in staging.
2. Run app against staging.
3. Run smoke tests.
4. Prepare uploads persistent volume.
5. Deploy backend API.
6. Deploy worker.
7. Set webhook URLs.
8. Run Telegram test.
9. Run payment sandbox test.
10. Monitor logs.

## Health Checks

```txt
GET /health
GET /health/deep
```

Container health check should use `/health`.

## Rollback

Rollback plan depends on migration phase.

Before DB cutover:

- revert deployment image
- keep Mongo as source of truth

After DB cutover:

- rollback only if writes were frozen or can be reconciled
- preserve Supabase writes if needed

## Production Readiness Checklist

- [ ] HTTPS public backend URL.
- [ ] Telegram webhook set.
- [ ] Payment webhook set.
- [ ] Service role key only server-side.
- [ ] Uploads persistent volume.
- [ ] DB backup enabled.
- [ ] Uploads backup enabled.
- [ ] Logs available.
- [ ] Worker running.
- [ ] Smoke tests passed.
