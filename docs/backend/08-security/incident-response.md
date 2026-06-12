# Incident Response

## Incident Types

| Incident | Severity |
|---|---|
| Service role key exposed | Critical |
| Payment webhook spoofing found | Critical |
| Cross-workspace data leak | Critical |
| Platform token leaked | High/Critical |
| AI sends unsafe business action | High |
| Unauthorized admin access | High |
| Local uploads wiped/lost | High |
| Spam/abuse flood | Medium/High |

## Response Phases

```txt
Detect
Contain
Eradicate
Recover
Review
Prevent recurrence
```

## Critical Incident Playbook: Secret Leak

1. Disable exposed secret immediately.
2. Rotate affected key:
   - JWT secret if token signing leaked;
   - Supabase service role key;
   - Telegram bot token;
   - Meta access token/app secret;
   - payment provider keys;
   - AI provider keys.
3. Invalidate active sessions if JWT secret leaked.
4. Search logs/repository for exposure.
5. Audit suspicious activity.
6. Deploy new env.
7. Document timeline and blast radius.

## Critical Incident Playbook: Fake Payment

1. Disable payment webhook processing temporarily if active fraud is happening.
2. Review `payment_events` raw payloads.
3. Reconcile with provider dashboard/API.
4. Revert invalid order status updates.
5. Rotate payment webhook secrets if needed.
6. Patch signature verification.
7. Notify affected admins/customers if needed.

## Critical Incident Playbook: Cross-Tenant Leak

1. Disable affected endpoint.
2. Identify incorrect query/workspace filter.
3. Review access logs and request ids.
4. Patch repository/query layer.
5. Add regression tests.
6. Notify affected parties if data was accessed.

## Minimum Logs Needed

```txt
request_id
user_id
workspace_id
route
method
status_code
ip_hash
user_agent
payment_event_id
webhook_event_id
chat_id/order_id when relevant
```

Never log raw secrets.

## Post-Incident Review Template

```md
# Incident Review

## Summary
## Timeline
## Impact
## Root Cause
## What Worked
## What Failed
## Corrective Actions
## Owner
## Due Date
```
