# Security Rules for AI

Dokumen ini berisi aturan keamanan yang wajib diikuti AI coding agent.

## Never Expose Secrets

Jangan tampilkan atau commit:

- Telegram bot token,
- Meta access token,
- OpenAI/Gemini key,
- Supabase service role key,
- payment provider secret,
- JWT secret,
- database URL dengan password.

Supabase service role key and `SUPABASE_DATABASE_URL` are backend-only. They must not appear in frontend code, generated bundles, logs, committed docs, screenshots, or test fixtures with real values.

## Workspace Isolation

Every tenant-owned operation must validate:

```txt
row.workspace_id == current_user.workspace_id
```

Webhook writes must derive workspace from verified platform lookup.

## Public Webhooks

Webhook routes are public by necessity, but must validate:

- platform token/account,
- provider signature where available,
- event idempotency,
- payload shape.

## AI Prompt Security

AI must not receive:

- secret env,
- service role key,
- full database dump,
- other workspace/customer data,
- raw webhook headers containing secrets unless sanitized.

## Payment Security

- Never trust frontend amount.
- Always verify webhook signature.
- Compare provider amount with order amount.
- Store raw event for audit, but avoid logging secrets.
- AI cannot mark payment as paid.

## File Security

- Validate MIME and extension.
- Limit file size.
- Store under controlled upload root.
- Avoid path traversal.
- Consider protected media endpoint for private files.

## Admin Safety

AI agent must not create admin bypass, debug public routes, or hardcoded super user unless explicitly requested for local dev and documented.
