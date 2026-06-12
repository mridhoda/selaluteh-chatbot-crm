# Audit Logging Security

## Why Audit Logs Matter

Marketplace features require traceability for:

- payment status changes;
- order status changes;
- admin updates;
- platform token changes;
- human takeover;
- AI actions;
- file access and upload.

## Events to Log

| Event | Required Fields |
|---|---|
| Login success/failure | user/email, ip hash, timestamp |
| User created/deleted | actor, target user, workspace |
| Platform token updated | actor, platform id, no raw token |
| Product created/updated/deleted | actor, product id |
| Order status changed | actor/source, old/new status |
| Payment status changed | source, old/new status, provider event id |
| Human takeover | user, chat id |
| AI action proposed/executed/rejected | action type, chat id, reason |
| File uploaded/accessed | file id, user/source |

## Log Safety

Do not log:

```txt
raw passwords
OTP code
reset token
JWT token
provider secrets
full payment keys
full platform tokens
```

## Suggested Audit Table

```txt
audit_logs
  id
  workspace_id
  actor_type user|system|webhook|ai
  actor_user_id nullable
  action
  resource_type
  resource_id
  old_value jsonb nullable
  new_value jsonb nullable
  metadata jsonb
  ip_hash nullable
  user_agent nullable
  created_at
```

## Retention

Suggested:

```txt
security/payment audit logs: 1-2 years
normal operational logs: 30-90 days
```
