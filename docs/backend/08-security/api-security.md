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
