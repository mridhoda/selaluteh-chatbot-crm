# Generation Rules

## Purpose

Defines rules for generated content from AI, reports, exports, and system-generated messages.

## Generated Content Types

System may generate:

- AI chat replies
- AI suggested actions
- order/payment system notifications
- export files
- AI summaries
- admin reports
- product recommendation text

## AI Reply Rule

AI reply must not include:

- internal stack traces
- raw database IDs unless customer-facing code
- secrets/tokens
- unverified payment status
- invented product/price/promo

## System Message Rule

System-generated customer messages should be clear and based on DB state.

Examples:

```txt
Pembayaran berhasil ✅
Pesanan kamu sedang diproses.
```

not:

```txt
Sepertinya sudah bayar.
```

unless payment is actually verified.

## Generated Order Summary

Order summary must be generated from backend order/cart data.

AI may format text, but values come from backend.

## Generated Export Rule

Generated export files must:

- be workspace-scoped
- respect filters
- be stored as file metadata if persisted
- have expiry if sensitive

## Prompt Output Markers

Legacy markers like:

```txt
FILE_ORDER_JSON
FILE_COMPLAINT_JSON
ESCALATE_TO_HUMAN
```

may exist for compatibility, but new commerce flows should prefer explicit AI actions validated by backend.

## Product Recommendation Rule

AI may recommend only products returned by backend catalog/search.

If no matching product exists:

```txt
AI should say product not found or offer alternatives from DB.
```

## Human Review Rule

Generated content requiring human review:

- refund promise
- payment dispute
- legal/abuse complaint
- order cancellation after paid
- policy exception

## Language Rule

AI should follow user's language when obvious.

For Indonesian users, use natural Indonesian unless workspace config says otherwise.
