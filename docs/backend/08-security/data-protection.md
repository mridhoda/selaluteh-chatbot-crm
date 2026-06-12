# Data Protection

## Sensitive Data Categories

System may store:

- user/admin account data;
- customer chat history;
- phone numbers / Telegram ids / handles;
- payment transaction references;
- delivery/pickup information;
- uploaded media/documents;
- AI-generated summaries/actions;
- platform tokens and app secrets.

## Data Minimization

Only store what is required for product functionality.

Do not store:

- raw payment card data;
- customer password from external chat;
- unnecessary personal documents;
- secrets in message logs;
- unredacted provider keys in logs.

## Encryption

Recommended:

| Data | Protection |
|---|---|
| Passwords | bcrypt/argon2 hash |
| JWT secret | env secret |
| Platform tokens | encrypt-at-rest or secrets manager |
| Payment provider secrets | env/secrets manager only |
| Database connection | TLS when remote |
| Backups | encrypted storage |

## Chat and AI Data

Chat content may be sent to AI provider.

Rules:

1. Minimize context sent to AI.
2. Do not send platform tokens or payment secrets.
3. Redact sensitive values when not needed.
4. Keep AI prompt/system context separate from user input.
5. Log AI requests carefully; avoid storing full sensitive prompt in production unless required.

## Workspace Isolation

Every tenant-owned data query must filter by `workspace_id`:

```txt
users
platforms
agents
contacts
chats
messages
orders
complaints
products
carts
payments
files
```

## Retention Policy

Suggested defaults:

| Data | Retention |
|---|---|
| Webhook raw payloads | 30-90 days |
| Payment raw events | 1-2 years or legal requirement |
| Chat history | Product/business decision |
| Logs | 14-90 days |
| Temporary downloads | Delete within 24 hours |
| OTP/password reset | Expire quickly, auto-clean |

## Deletion Rules

For production, prefer soft deletion for:

```txt
orders
payments
customer chats
files metadata
```

Hard deletion requires careful cascade and audit trail.
