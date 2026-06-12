# Security Brief

## Security Priority

Security must be handled before payment and marketplace launch.

## P0 Security Issues to Fix

- Orders routes must require auth.
- Complaints routes must require auth.
- Workspace isolation must be enforced.
- Diagnostic user routes must be removed/protected.
- Webhook idempotency must be implemented.
- Payment webhook signature must be verified.
- Service role key must never reach frontend.
- Secrets must not be committed.

## Workspace Isolation

Every tenant-owned query must be scoped by:

```txt
workspace_id
```

Cross-workspace data access should return safe errors.

## Webhook Security

For Telegram:

- Validate platform/token mapping.
- Store webhook event id.
- Skip duplicate events.

For payment:

- Verify signature.
- Store raw event.
- Process idempotently.

For Meta:

- Verify webhook setup token.
- Plan POST signature validation.

## AI Security

AI must not:

- execute critical state changes directly
- access unauthorized data
- trust user-provided payment status
- reveal internal prompts/secrets

## File Security

Current local files may be public through `/files`.

MVP may accept public files for simplicity, but future protected endpoint should:

- authenticate user
- check workspace
- stream file from local disk

## Secret Policy

Never expose:

- JWT_SECRET
- Telegram bot token
- payment provider keys
- Supabase service role key
- OpenAI/Gemini API keys
