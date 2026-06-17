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
- Support Mongo-to-Supabase transition.
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

During transition:

```env
MONGODB_URI=mongodb://localhost:27017/chatbot_crm
DATABASE_PROVIDER=mongo
```

Target:

```env
DATABASE_PROVIDER=supabase
SUPABASE_URL=https://project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<server-only>
SUPABASE_ANON_KEY=<optional-client-safe>
```

Never expose `SUPABASE_SERVICE_ROLE_KEY` to frontend.

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

Midtrans sandbox:

```env
PAYMENT_PROVIDER=midtrans
MIDTRANS_IS_PRODUCTION=false
MIDTRANS_SERVER_KEY=
MIDTRANS_CLIENT_KEY=
MIDTRANS_MERCHANT_ID=
MIDTRANS_WEBHOOK_SECRET=
```

Xendit optional:

```env
XENDIT_SECRET_KEY=
XENDIT_WEBHOOK_TOKEN=
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
