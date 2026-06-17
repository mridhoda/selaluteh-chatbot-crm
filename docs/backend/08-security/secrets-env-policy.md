# Secrets & Environment Policy

## Secret Handling Rules

Never commit real secrets to git.

Do not expose these to frontend:

```txt
SUPABASE_SERVICE_ROLE_KEY
MONGODB_URI
DATABASE_URL with password
JWT_SECRET
TELEGRAM_BOT_TOKEN
META_ACCESS_TOKEN
META_APP_SECRET
MIDTRANS_SERVER_KEY
XENDIT_SECRET_KEY
OPENAI_API_KEY
GOOGLE_API_KEY
SMTP_URL with password
```

Frontend may only receive public safe keys:

```txt
VITE_API_BASE
VITE_APP_NAME
SUPABASE_ANON_KEY only if RLS is configured and intended
```

## Recommended Env Groups

### App

```txt
NODE_ENV
PORT
PUBLIC_BASE_URL
CORS_ORIGIN
JWT_SECRET
```

### Database

```txt
MONGODB_URI # during migration/legacy
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
SUPABASE_ANON_KEY
```

### Storage

```txt
LOCAL_UPLOAD_ROOT
PUBLIC_FILES_BASE_URL
```

### AI

```txt
OPENAI_API_KEY
GOOGLE_API_KEY
```

### Telegram/Meta

```txt
TELEGRAM_BOT_TOKEN # if using global/dev bot token
META_VERIFY_TOKEN
META_APP_SECRET
META_ACCESS_TOKEN
```

### Payment

```txt
PAYMENT_PROVIDER=midtrans|xendit|manual
MIDTRANS_ENV=sandbox|production
MIDTRANS_SERVER_KEY
MIDTRANS_CLIENT_KEY
XENDIT_SECRET_KEY
PAYMENT_WEBHOOK_SECRET
```

## Secret Rotation

Rotate immediately if:

- key appears in git history;
- key appears in screenshot/log;
- employee/developer access changes;
- suspected unauthorized API usage;
- provider dashboard indicates abnormal activity.

## Platform Tokens in Database

Current app stores platform tokens in DB. Recommended improvements:

1. Encrypt tokens before storing.
2. Store only token status/preview in frontend API.
3. Restrict token reads to backend service.
4. Audit token updates.

## `.env.example`

Every required env should appear in `.env.example` with placeholder only.

Good:

```env
JWT_SECRET=change-me
MIDTRANS_SERVER_KEY=<sandbox-server-key>
```

Bad:

```env
JWT_SECRET=<do-not-commit-real-secret>
```
