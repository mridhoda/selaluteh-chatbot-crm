# Troubleshooting

## Backend Won't Start

Check:

- env variables
- database connection
- port conflict
- dependency install
- syntax/runtime error
- build step

## Dashboard Cannot Login

Check:

- backend auth route
- JWT secret
- database user exists
- verified flag
- CORS origin
- frontend API base URL

## Telegram Bot Not Replying

Check:

- Telegram webhook set
- public URL reachable
- bot token correct
- platform lookup works
- backend logs
- AI provider fallback
- human takeover state

## Payment Link Not Generated

Check:

- payment provider env
- order exists
- checkout valid
- amount valid
- provider API response
- payment row creation

## Payment Webhook Not Updating Order

Check:

- webhook endpoint reachable
- signature valid
- provider reference id
- payment row exists
- duplicate event handling
- status mapping
- order update transaction

## Files Not Loading

Check:

- `LOCAL_UPLOAD_ROOT`
- file exists on disk
- public path matches
- static `/files` route
- permissions
- Docker volume mount

## Cross-Workspace Data Appears

Treat as SEV-1.

Action:

1. Disable affected route if needed.
2. Check workspace filters.
3. Check auth middleware.
4. Check RLS/service role logic.
5. Review logs.
6. Patch immediately.
