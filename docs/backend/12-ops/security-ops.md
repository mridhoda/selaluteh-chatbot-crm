# Security Operations

## Security Operational Tasks

- Rotate secrets.
- Review access logs.
- Audit admin users.
- Verify service role is server-only.
- Check suspicious webhook traffic.
- Review payment signature failures.
- Check dependency vulnerabilities.
- Validate backups are protected.

## Secret Rotation Procedure

1. Generate new secret/key.
2. Update environment secret manager.
3. Restart affected service.
4. Verify functionality.
5. Revoke old key.
6. Monitor logs.

## If Secret Is Leaked

1. Revoke leaked secret immediately.
2. Rotate related keys.
3. Search logs/repo for exposure.
4. Check unauthorized access.
5. Update incident report.

## Security Review Cadence

Recommended:

- weekly during MVP build
- before payment launch
- before production cutover
- after every security incident

## High-Risk Secrets

- payment provider server key
- payment webhook secret
- Supabase service role key
- JWT secret
- Telegram bot token
- OpenAI/Gemini keys
- database URL
