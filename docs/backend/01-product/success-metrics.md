# Success Metrics

## MVP Success Definition

MVP sukses jika customer bisa menyelesaikan transaksi dari Telegram sampai payment success, dan admin bisa mengelola order dari dashboard.

## North Star Metric

```txt
Paid Telegram Orders per Workspace
```

Kenapa:

- mencerminkan chat berhasil menjadi transaksi,
- relevan dengan marketplace MVP,
- mudah dipahami owner/admin.

## Funnel Metrics

| Funnel Step | Metric |
|---|---|
| Bot started | Telegram `/start` count |
| Product discovered | Product list/detail views |
| Cart created | Active carts created |
| Cart intent | Cart items added |
| Checkout intent | Checkout sessions created |
| Payment intent | Payment links generated |
| Payment success | Paid orders |
| Fulfillment | Completed orders |

## Conversion Metrics

```txt
Product detail view → Add to cart
Add to cart → Checkout
Checkout → Payment link opened/created
Payment link → Paid order
Paid order → Completed order
```

## CRM Metrics

| Metric | Purpose |
|---|---|
| New chats | Demand/traffic |
| Unread chats | Admin workload |
| Escalated chats | AI limitation signal |
| Human takeover count | CS workload |
| Resolved chats | Operations throughput |
| Average response time | Service quality |

## AI Metrics

| Metric | Purpose |
|---|---|
| AI replies sent | AI usage volume |
| AI action proposals | Commerce assistance usage |
| AI action failures | Guardrail/debug signal |
| Escalation rate | AI confidence/coverage |
| Human takeover after AI | AI handoff quality |

## Payment Metrics

| Metric | Purpose |
|---|---|
| Payment link generated | Payment intent |
| Payment pending | In-progress orders |
| Payment success | Revenue proxy |
| Payment expired | Checkout friction |
| Payment failed | Provider/user issue |
| Webhook duplicate ignored | Idempotency health |

## Admin Product Metrics

| Metric | Purpose |
|---|---|
| Active products | Catalog readiness |
| Products with images | Catalog quality |
| Products out of stock | Fulfillment risk |
| Top viewed products | Demand signal |
| Top sold products | Revenue signal |

## MVP Target Example

For first validation:

```txt
- 1 connected Telegram bot
- 10 active products
- 20 successful test checkouts
- 10 sandbox paid orders
- 0 duplicate payment/order from webhook retry
- 0 cross-workspace data leak in tests
```

## Analytics Implementation Notes

Metrics should be derived from:

- `messages`,
- `chats`,
- `products`,
- `carts`,
- `checkouts`,
- `orders`,
- `order_items`,
- `payments`,
- `payment_events`,
- `webhook_events`,
- `ai_actions`.
