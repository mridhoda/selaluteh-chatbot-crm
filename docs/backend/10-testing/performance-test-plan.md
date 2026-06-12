# Performance Test Plan

## Goal

Validate backend remains responsive under realistic CRM + marketplace load.

## Key Metrics

| Area | Target |
|---|---|
| Webhook ACK | Fast, ideally under 1s before background processing |
| Inbox query | Under 500ms for typical workspace |
| Messages query | Under 500ms for 500 messages |
| Product list | Under 300ms for active catalog |
| Checkout creation | Under 1s excluding provider latency |
| Payment webhook | Under 1s excluding notification retry |

## Test Scenarios

### Inbox Load

- 1 workspace, 1k chats, 50k messages.
- Query sorted by `last_message_at desc`.
- Filter by unread, status, tags.

### Telegram Burst

- Simulate 100 incoming webhook events/minute.
- Ensure no duplicate and no crash.

### Payment Webhook Burst

- Simulate repeated duplicate paid event.
- Ensure idempotency and low DB load.

### Product Catalog

- 1k products, 3 variants each.
- Search/list active products.

## Observability

Log/test:

- p95 route latency.
- DB query count.
- webhook event processing time.
- provider call duration.
- failed job count.

## Acceptance

- No obvious N+1 query for inbox/product list.
- Indexes support core queries.
- Webhook route does not block on slow AI call if queue exists.
