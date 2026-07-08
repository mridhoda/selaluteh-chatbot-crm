# API Security

## Principles

- Validate every request body, query, and path param.
- Enforce auth before business logic.
- Enforce workspace scoping in repository queries.
- Do not expose secrets, tokens, internal ids, stack traces, or provider raw errors.
- Make webhook endpoints idempotent.
- Use consistent error format.

## Input Validation

Every endpoint should validate:

```txt
path params
query params
JSON body
file upload metadata
content type
payload size
```

Recommended libraries:

```txt
zod
joi
yup
express-validator
```

## Response Sanitization

Never return raw fields:

```txt
password_hash
reset_token
otp_code
platform.token
platform.app_secret
  payment_provider_secret
  secret_key
  webhook_secret
  raw auth headers
  raw provider payloads
  audit logs/events
  SUPABASE_SERVICE_ROLE_KEY
OPENAI_API_KEY
GOOGLE_API_KEY
```

For platform tokens return:

```json
{
  "token_status": "configured",
  "token_preview": "1234...abcd"
}
```

## CORS

Production CORS must allow only official frontend domains.

```txt
Allowed:
  https://admin.yourdomain.com
  https://app.yourdomain.com

Not allowed:
  *
```

## HTTP Security Headers

Use helmet or equivalent:

```txt
Content-Security-Policy
X-Content-Type-Options
X-Frame-Options
Referrer-Policy
Strict-Transport-Security
```

## Pagination Limits

APIs that list data must use limits.

Recommended limits:

| Resource | Default | Max |
|---|---:|---:|
| chats | 50 | 200 |
| messages | 100 | 500 |
| orders | 50 | 200 |
| products | 50 | 200 |
| contacts | 50 | 200 |

## Error Handling

Do not leak stack traces in production.

Safe error response:

```json
{
  "error": {
    "code": "ORDER_NOT_FOUND",
    "message": "Order not found",
    "request_id": "req_..."
  }
}
```

## File Upload API Security

- Require auth for admin uploads.
- Validate MIME type and extension.
- Limit max size by type.
- Store with generated filename.
- Do not trust original filename.
- Scan or quarantine risky file types if possible.
- Prevent path traversal.

## Public API vs Internal Bot API

Telegram bot actions should use internal service calls, not expose unauthenticated product/cart/order APIs directly to the public web.

```txt
Telegram webhook -> backend service -> repository
```

not:

```txt
Telegram user -> public /cart endpoint without session validation
```

## Public QR Store Security

- Public order lookup uses an opaque `public_order_token`, not internal order IDs.
- Public order responses expose public-safe amount fields only: `subtotal_amount`, `discount_amount`, `service_fee_amount`, `tax_amount`, `total_amount`, and `currency`.
- Public order responses must not include internal order IDs, raw provider payloads, audit logs, internal notes, raw totals objects, or unmasked phone numbers.
- Customer phone numbers are masked before response serialization.
- Random/unknown public order tokens return a safe not-found response.

## Public Rate Limiting

Current public route limits are implemented with in-memory buckets:

| Endpoint family | Limit |
|---|---:|
| QR lookup | 60/min/IP |
| Cart validation | 30/min/IP |
| Checkout | 10/min/IP |
| Payment polling | 30/min/IP/payment |
| Public order lookup | 60/min/IP/token |

The in-memory limiter is alpha-grade and single-instance only. Production multi-instance deployments should use edge/WAF route-level limiting as the primary distributed strategy. Add Redis-backed app-level throttling only when the application needs identity-aware or token-aware limits that cannot be expressed at the edge.

## Audit Logs And Security Events

Use `audit_logs` for business/admin mutations and `security_events` for suspicious public/security failures.

Audited actions:

- `order.created`
- `order.accepted`
- `order.preparing`
- `order.ready`
- `order.completed`
- `order.cancelled`
- `payment.created`
- `payment.webhook_received`
- `payment.paid`
- `payment.manual_review`
- `settings.payment_provider_changed`

Security events:

- `qr.invalid_attempt` for invalid, expired, revoked, unavailable, or mismatched public QR attempts.
- `payment.webhook_verification_failed` for provider webhook signature/verification failures.
- `checkout.idempotency_conflict` for same public checkout idempotency key with different request hash.

Audit and security event metadata is redacted before persistence. Secret keys, webhook secrets, raw authorization headers, bearer tokens, cookies/signatures, and unsafe raw provider payload/response fields must not be stored in plaintext.
