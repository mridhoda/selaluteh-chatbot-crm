# Monitoring and Alerting

## What to Monitor

### Backend Health

- uptime
- request error rate
- response latency
- memory usage
- CPU usage
- process restarts

### Webhooks

- Telegram webhook received count
- Telegram webhook error count
- Meta webhook received/error
- Payment webhook received/error
- Duplicate webhook count
- Webhook processing duration

### Payment

- payment created count
- payment paid count
- payment failed/expired count
- invalid signature count
- duplicate event count
- order/payment mismatch count

### AI

- AI request count
- AI error count
- AI fallback count
- AI latency
- token/cost estimate
- escalation count

### Database

- connection errors
- slow queries
- migration errors
- storage usage
- table growth

### Local Storage

- disk usage
- upload failures
- missing files
- backup success/failure

## Suggested Alerts

| Alert | Severity |
|---|---|
| Backend down | SEV-1 |
| Payment webhook signature failures spike | SEV-1/2 |
| Payment webhook error rate high | SEV-1/2 |
| Telegram webhook failing | SEV-2 |
| Database connection failure | SEV-1 |
| Disk usage > 85% | SEV-2 |
| AI provider failing | SEV-3 |
| Backup failed | SEV-2 |
| Cross-workspace access error | SEV-1 |

## Logging Requirements

Every webhook log should include:

- provider
- event id
- workspace id if known
- platform id if known
- processing status
- error message if failed

Payment logs should include:

- payment id
- provider reference
- order id
- event id
- signature valid
- status transition
