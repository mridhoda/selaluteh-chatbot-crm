# Business Decision Log

Use this file to record business decisions.

## Format

```md
## YYYY-MM-DD — Decision Title

### Decision
...

### Context
...

### Options Considered
1. ...
2. ...

### Reason
...

### Impact
...

### Revisit When
...
```

## Initial Decisions

### Decision — Telegram First

Decision:

```txt
Build MVP on Telegram first.
```

Reason:

- Existing backend already supports Telegram webhook.
- Telegram inline buttons are good for deterministic commerce flow.
- Faster MVP testing than WhatsApp payment/commerce complexity.

Impact:

- WhatsApp commerce is deferred.
- MVP validation must account for Telegram adoption risk.

### Decision — Single Merchant First

Decision:

```txt
MVP is single-merchant, not multi-seller.
```

Reason:

- Multi-seller introduces payout, commission, seller dashboard, and dispute complexity.

Impact:

- Faster MVP.
- Marketplace expansion moved to later roadmap.

### Decision — AI as Assistant

Decision:

```txt
AI assists but backend owns transaction state.
```

Reason:

- Payment/order state must be deterministic and secure.

Impact:

- Need AI action guardrails.
- Cart/checkout/payment must be backend-driven.
