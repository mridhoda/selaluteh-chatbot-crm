# Feature List

## Feature Status Legend

| Status | Meaning |
|---|---|
| Existing | Already exists in current CRM app |
| Improve | Exists but needs hardening/refactor |
| New MVP | Must be built for MVP |
| Later | Not in MVP |

## CRM & Messaging

| Feature | Status | Notes |
|---|---|---|
| Telegram webhook | Existing | Main MVP channel |
| WhatsApp webhook | Existing | Keep, not primary MVP commerce channel |
| Instagram webhook | Existing | Keep as CRM feature |
| Contact creation | Existing | Must remain workspace-scoped |
| Chat creation | Existing | Add marketplace state support |
| Message storage | Existing | Add idempotency |
| Human takeover | Existing | Critical feature |
| Resolve chat | Existing | Keep |
| Reply-to support | Existing | Keep |
| File/media message | Existing | Local storage metadata should be normalized |

## AI Assistant

| Feature | Status | Notes |
|---|---|---|
| AI reply | Existing | OpenAI/Gemini |
| Knowledge/Q&A | Existing | Improve gradually |
| Voice transcription | Existing | Keep optional |
| AI escalation | Existing/Improve | Should use validated actions |
| AI order marker | Improve | Keep legacy, but do not use for marketplace source of truth |
| AI product recommendation | New MVP | Should call/search product data |
| AI action logging | New MVP | Store proposed/executed action |

## Product Catalog

| Feature | Status | Notes |
|---|---|---|
| Product model | New MVP | Standalone product table/model |
| Product category | New MVP | Optional but useful |
| Product image | New MVP | Local file metadata |
| Product variants | New MVP | Basic variant support |
| Product status active/inactive | New MVP | Needed for Telegram browsing |
| Product inventory | Later/MVP minimal | MVP can use simple stock quantity or unlimited flag |

## Cart & Checkout

| Feature | Status | Notes |
|---|---|---|
| Cart | New MVP | Active cart per contact/chat |
| Cart item | New MVP | Product/variant/quantity |
| View cart | New MVP | Telegram menu |
| Update quantity | New MVP | Button or command |
| Checkout session | New MVP | Convert cart to order |
| Checkout expiration | New MVP | Prevent stale checkout |
| Duplicate checkout prevention | New MVP | Important idempotency |

## Orders

| Feature | Status | Notes |
|---|---|---|
| Legacy order capture | Existing | Based on AI form marker |
| Marketplace order | New MVP | Source = telegram/marketplace |
| Order items | New MVP | Normalized |
| Order status lifecycle | Improve | Need paid/fulfillment lifecycle |
| Admin order list | Existing/Improve | Needs item/payment visibility |
| Customer order status | New MVP | Telegram command/button |

## Payments

| Feature | Status | Notes |
|---|---|---|
| Manual payment instruction | Existing | Keep as fallback |
| Payment gateway sandbox | New MVP | Midtrans/Xendit sandbox |
| Payment link creation | New MVP | Sent to Telegram |
| Payment webhook | New MVP | Required for paid order |
| Payment event log | New MVP | Audit/retry/debug |
| Signature verification | New MVP | Mandatory |

## Admin Dashboard

| Feature | Status | Notes |
|---|---|---|
| Inbox | Existing | Keep |
| Contacts | Existing | Keep |
| Agents | Existing | Keep |
| Platforms | Existing | Keep |
| Orders | Existing/Improve | Add marketplace details |
| Product management | New MVP | Required |
| Payment dashboard | New MVP | Helpful for debugging |
| Analytics | Existing/Improve | Add commerce metrics later |

## Security & Operations

| Feature | Status | Notes |
|---|---|---|
| Auth | Existing | Improve route coverage |
| Workspace scoping | Improve | Mandatory everywhere |
| RLS design | New MVP/Migration | For Supabase |
| Webhook idempotency | New MVP | Required |
| File metadata | Improve | Normalize files table |
| Observability logs | Improve | Payment/webhook debug |
