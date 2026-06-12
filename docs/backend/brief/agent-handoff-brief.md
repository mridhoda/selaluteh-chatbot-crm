# Agent Handoff Brief

Use this brief when handing the project to another AI coding agent.

## Project Summary

This is an existing Chatbot CRM backend being extended into a Telegram-first marketplace MVP.

Do not rebuild from scratch.

## Current System

Existing:

- Express backend.
- React/Vite frontend.
- MongoDB/Mongoose.
- Telegram webhook.
- Meta webhook.
- AI agents.
- Inbox.
- Human takeover.
- Contacts.
- Messages.
- Legacy orders/complaints.
- Local files.

## Target System

Add:

- Product catalog.
- Cart.
- Checkout.
- Order items.
- Payment sandbox.
- Payment webhook.
- Telegram inline commerce.
- Admin product/order operations.
- AI commerce guardrails.
- Supabase/Postgres migration path.

## Most Important Rules

1. Do not break existing CRM.
2. Secure orders and complaints before payment.
3. Backend owns commerce state.
4. AI assists but does not mark payment/order status.
5. Payment webhook must be verified and idempotent.
6. Every tenant-owned query must be workspace-scoped.
7. Local media stays in server storage; DB stores metadata.
8. Prefer small safe changes over big rewrites.

## Best Next Task

Start with:

```txt
Sprint 0 — Stabilization
```

Focus:

- Orders auth.
- Complaints auth.
- Diagnostic routes.
- Settings route.
- Smoke tests.
