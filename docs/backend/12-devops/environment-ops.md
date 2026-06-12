# Environment Operations

## Environment Types

Recommended environments:

```txt
local
staging
production
```

## Env File Rules

- Never commit real `.env`.
- Keep `.env.example`.
- Keep production secrets in platform secret manager.
- Rotate exposed keys immediately.
- Service role key must stay server-side only.

## Critical Env Variables

Common variables:

```txt
MONGODB_URI
DATABASE_URL
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
SUPABASE_ANON_KEY
JWT_SECRET
PUBLIC_BASE_URL
CORS_ORIGIN
LOCAL_UPLOAD_ROOT
PUBLIC_FILES_BASE_URL
TELEGRAM_BOT_TOKEN
OPENAI_API_KEY
GOOGLE_API_KEY
PAYMENT_PROVIDER
PAYMENT_SERVER_KEY
PAYMENT_WEBHOOK_SECRET
```

Actual names may differ by implementation.

## Env Change Checklist

Before changing env:

- [ ] Understand affected service.
- [ ] Backup old value securely.
- [ ] Apply change in staging first if possible.
- [ ] Restart affected service.
- [ ] Run smoke test.
- [ ] Monitor logs.

## Production Env Red Flags

- `NODE_ENV` not production.
- Missing `JWT_SECRET`.
- Public frontend has service role key.
- Payment sandbox key used in production unintentionally.
- Production payment key used in local accidentally.
- `PUBLIC_BASE_URL` points to old webhook backend.
