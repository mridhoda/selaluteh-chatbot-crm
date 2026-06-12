# 08 Security — Backend Security Docs

Folder ini berisi security documentation untuk backend **SelaluTeh Chatbot CRM / Telegram-first Marketplace MVP**.

Dokumen ini fokus pada keamanan sistem yang sudah ada dan sistem target terbaru:

```txt
Existing: Chatbot CRM + Telegram/WhatsApp/Instagram webhook + AI agents + dashboard + human takeover
Target: Telegram-first marketplace MVP + product/cart/checkout/order/payment + Supabase/Postgres + local file storage
```

## Scope

Security docs ini mencakup:

- Authentication dan authorization.
- Workspace multi-tenant isolation.
- API security.
- Telegram/Meta/payment webhook security.
- AI prompt-injection dan AI action guardrails.
- Payment gateway sandbox/production security.
- Secrets dan environment policy.
- File/media access policy.
- Data protection dan privacy.
- Rate limit dan abuse prevention.
- Incident response.
- Audit logging.
- Backup/recovery security.
- Dependency/supply-chain risk.

## Recommended Reading Order

```txt
README.md
threat-model.md
auth-authz.md
workspace-tenant-security.md
api-security.md
webhook-security.md
payment-security.md
ai-prompt-security.md
ai-action-security.md
data-protection.md
asset-access-security.md
secrets-env-policy.md
rate-limit-abuse.md
audit-logging-security.md
incident-response.md
security-checklist.md
```

## Security Principle

Security decision utama:

```txt
Never trust external input.
Never trust AI output as final truth.
Never trust workspace_id from client payload.
Never expose service-role secret to frontend.
Never mark payment as paid without verified provider webhook.
```

## Folder Boundary

- API endpoint details belong in `05-api-spec`.
- Database schema/RLS details belong in `06-data`.
- Business permission rules belong in `03-business-rules`.
- This folder defines security requirements, risks, checks, and implementation constraints.
