# Backend UI Contract

## Purpose

This document defines what the UI must expose so backend features can be operated safely.

This is not a visual design document. It is a contract between:

```txt
backend capability
↔ dashboard page
↔ UI component
↔ user action
↔ API call
↔ backend state
```

## Core Principle

Every backend state-changing action must have a clear UI representation.

Examples:

| Backend Capability | Required UI |
|---|---|
| Create product | Product form + Save button |
| Archive product | Archive button + confirm dialog |
| View order | Order detail drawer/page |
| Update order status | Status dropdown/button |
| Payment webhook received | Payment event timeline |
| Human takeover | Take Over / Release buttons |
| AI enabled/disabled | Toggle switch |
| Platform webhook setup | Set Webhook button |
| Duplicate webhook ignored | Webhook log status badge |

## MVP UI Priority

### P0 Required

- Login/register.
- Dashboard shell.
- Inbox/chat page.
- Chat detail panel.
- Human takeover button.
- Platforms page.
- Agents page.
- Products page.
- Product form.
- Orders page.
- Order detail.
- Payment status section.
- Settings/API keys section.
- Error/loading/empty states.

### P1 Useful

- Payment events page.
- Webhook logs page.
- Cart/session inspector.
- AI action logs.
- Analytics dashboard.
- Bulk product import.
- File/media manager.

### P2 Later

- Seller dashboard.
- Multi-seller management.
- Voucher management.
- Logistics panel.
- Refund management.
- Review/rating moderation.

## Backend State Visibility Rule

If backend stores important state, admin should be able to inspect it.

Important states:

- chat.status
- chat.takeover_by
- chat.is_escalated
- order.status
- payment.status
- product.status
- platform.enabled
- agent.enabled
- webhook_event.status
- ai_action.status

## Confirmation Rule

Dangerous actions require confirmation:

- delete product
- archive product
- cancel order
- mark order completed manually
- remove platform
- rotate token
- delete chat
- clear cart/session
- disable AI agent
- run migration/import
