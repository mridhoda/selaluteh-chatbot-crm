# Health Checks

## Health Endpoint

Recommended endpoint:

```txt
GET /health
```

Response example:

```json
{
  "status": "ok",
  "timestamp": "2026-01-01T00:00:00.000Z",
  "version": "commit-or-build-id"
}
```

## Deep Health Endpoint

Recommended internal endpoint:

```txt
GET /health/deep
```

Checks:

- database connection
- upload directory writable
- AI provider config presence
- Telegram platform config presence
- payment provider config presence
- queue/worker status if available

Do not expose sensitive details publicly.

## Manual Health Checklist

- [ ] Backend process running.
- [ ] Frontend loads.
- [ ] Database reachable.
- [ ] Upload directory writable.
- [ ] Telegram webhook reachable.
- [ ] Payment webhook reachable.
- [ ] AI provider reachable.
- [ ] Logs are being written.

## Webhook Health

Telegram:

```txt
Send test message to bot and verify backend receives update.
```

Payment:

```txt
Send sandbox webhook or provider test event.
```

## Health Status Meaning

| Status | Meaning |
|---|---|
| ok | Service operational |
| degraded | Partial issue but core works |
| fail | Critical dependency broken |
