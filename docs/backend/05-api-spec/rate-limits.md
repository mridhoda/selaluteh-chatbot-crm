# Rate Limits

## Purpose

Protect dashboard, webhook, auth, and payment endpoints from abuse and accidental loops.

## Recommended Limits

| Endpoint Group | Limit | Notes |
|---|---:|---|
| Auth login | 5/min/email/IP | Prevent brute force |
| Register/OTP | 3/min/IP | Prevent spam |
| Password reset | 3/min/email/IP | Prevent email abuse |
| Dashboard API | 300/min/user | Normal app use |
| File upload | 30/min/user | Also enforce size limits |
| Telegram webhook | high + idempotency | Provider retry-safe |
| Meta webhook | high + idempotency | Provider retry-safe |
| Payment webhook | high + signature | Never block legitimate provider retries |
| AI test endpoint | 20/min/user | Cost control |

## Rate Limit Response

```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMITED",
    "message": "Too many requests. Please try again later.",
    "request_id": "req_019..."
  }
}
```

## Headers

Recommended:

```http
X-RateLimit-Limit: 300
X-RateLimit-Remaining: 299
X-RateLimit-Reset: 1718179200
```

## AI Cost Guard

AI endpoints should also use quota rules:

```txt
workspace plan
monthly AI calls
daily AI calls
per-chat burst limit
```

## Webhook Safety

Do not rate-limit verified provider webhook too aggressively. Prefer:

```txt
signature verification
idempotency
queue backpressure
provider-specific allowlist where feasible
```
