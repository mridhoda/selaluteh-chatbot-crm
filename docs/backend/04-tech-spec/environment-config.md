<!--
Tech Spec Pack: Telegram-first Marketplace Backend
Project: KALIS.AI / eskala-bot evolution
Target: Chatbot CRM + Telegram Marketplace MVP
Generated: 2026-06-11
-->

# Environment Config

## Goals

- Keep secrets out of source code.
- Make local/staging/production explicit.
- Support Supabase/Postgres runtime.
- Support Telegram, AI, payment gateway, local storage.

## Backend Required Env

```env
NODE_ENV=development
PORT=5000
CORS_ORIGIN=http://localhost:5173
PUBLIC_BASE_URL=http://localhost:5000
JWT_SECRET=change-me-dev-only
```

## Database Env

Supabase/Postgres is the backend runtime target:

```env
DATA_SOURCE=supabase
SUPABASE_URL=https://hxeljduldgynligjioff.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<server-only-service-role-key>
SUPABASE_DATABASE_URL=<server-only-postgres-connection-string>
SUPABASE_ANON_KEY=<optional-client-safe>
```

Never expose `SUPABASE_SERVICE_ROLE_KEY` or `SUPABASE_DATABASE_URL` to frontend, Git, logs, screenshots, or generated docs with real secret values.

## AI Env

```env
OPENAI_API_KEY=<openai-api-key>
OPENAI_MODEL=gpt-4o-mini
GOOGLE_API_KEY=<google-api-key>
GEMINI_MODEL=gemini-2.5-flash
AI_PRIMARY_PROVIDER=openai
AI_SECONDARY_PROVIDER=gemini
AI_REPLY_TIMEOUT_MS=30000
```

## Telegram Env

Most Telegram tokens are stored in `platforms.token`, but environment can include defaults:

```env
TELEGRAM_WEBHOOK_SECRET=
TELEGRAM_DEFAULT_BOT_TOKEN=
```

Recommended:

- keep bot token encrypted at rest later
- use webhook secret/secret token where possible

## Meta Env

```env
META_VERIFY_TOKEN=
META_APP_SECRET=
```

## Payment Env

Xendit Test Mode Payment Session:

```env
PAYMENT_PROVIDER=xendit
XENDIT_MODE=test
XENDIT_API_BASE_URL=https://api.xendit.co
XENDIT_SECRET_API_KEY=
XENDIT_WEBHOOK_VERIFICATION_TOKEN=
XENDIT_PAYMENT_COUNTRY=ID
XENDIT_PAYMENT_CURRENCY=IDR
XENDIT_PAYMENT_SESSION_MODE=PAYMENT_LINK
XENDIT_PAYMENT_CAPTURE_METHOD=AUTOMATIC
XENDIT_PAYMENT_SESSION_TTL_MINUTES=30
```

Midtrans remains a possible future/sandbox provider path:

```env
MIDTRANS_IS_PRODUCTION=false
MIDTRANS_SERVER_KEY=
MIDTRANS_CLIENT_KEY=
MIDTRANS_MERCHANT_ID=
MIDTRANS_WEBHOOK_SECRET=
```

Manual fallback:

```env
MANUAL_PAYMENT_ENABLED=true
```

## Storage Env

```env
LOCAL_UPLOAD_ROOT=server/uploads
PUBLIC_FILES_BASE_URL=http://localhost:5000/files
MAX_UPLOAD_MB=25
ALLOWED_UPLOAD_MIME_TYPES=image/jpeg,image/png,application/pdf,audio/ogg,audio/mpeg,video/mp4
```

## Queue Env

If using Redis:

```env
REDIS_URL=redis://localhost:6379
QUEUE_PREFIX=kalis
WORKER_CONCURRENCY=5
```

If not using queue yet:

```env
QUEUE_DRIVER=in-process
```

## Email Env

```env
SMTP_URL=
SMTP_FROM="KALIS.AI <no-reply@example.com>"
```

## Frontend Env

```env
VITE_API_BASE=http://localhost:5000
VITE_APP_NAME=KALIS.AI
```

Do not use `REACT_APP_*` in Vite code.

## Environment Validation

Create `config/env.js` that validates env at startup.

Critical missing env should crash startup:

- `JWT_SECRET`
- database config based on provider
- `PUBLIC_BASE_URL` in production

Provider-specific env should be required only when enabled.

When `PAYMENT_PROVIDER=xendit`, backend startup must fail if `XENDIT_SECRET_API_KEY` is missing or if `XENDIT_MODE` is not `test`.
