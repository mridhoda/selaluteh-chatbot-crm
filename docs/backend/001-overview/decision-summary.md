# Decision Summary

This document summarizes current major decisions.

## Decision 1 — Continue Existing Project

Decision:

```txt
Do not rebuild from scratch.
```

Reason:

Existing CRM already has Telegram webhook, AI agents, inbox, contacts, messages, human takeover, dashboard, and legacy orders/complaints.

## Decision 2 — Telegram First

Decision:

```txt
Build marketplace MVP on Telegram first.
```

Reason:

Telegram bot flow is easier to test with inline buttons and existing integration.

## Decision 3 — Single Merchant MVP

Decision:

```txt
Do not build multi-seller in MVP.
```

Reason:

Multi-seller introduces payout, commission, seller dashboard, dispute, and complex rules.

## Decision 4 — Backend Owns Commerce State

Decision:

```txt
Backend is source of truth for product, cart, order, and payment.
```

Reason:

AI output is not reliable enough for critical state.

## Decision 5 — Payment Link + Webhook

Decision:

```txt
Use external payment link from payment gateway sandbox.
```

Reason:

Simpler and realistic for Indonesia payment gateway flow.

## Decision 6 — Supabase/Postgres Target

Decision:

```txt
Migrate structured data to Supabase/Postgres.
```

Reason:

Marketplace/order/payment data benefits from relational consistency.

## Decision 7 — Local Storage for Media

Decision:

```txt
Keep large media in local server storage.
```

Reason:

Lower cost and existing app already uses local uploads.

## Decision 8 — Keep AI as Assistant

Decision:

```txt
AI helps users but cannot mark payment/order final states.
```

Reason:

Payment and order state must be validated by backend and provider webhook.
