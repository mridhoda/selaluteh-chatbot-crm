# Admin Actions Matrix

## Purpose

This document maps admin buttons/actions to backend operations.

## Chat/Inbox Actions

| UI Action | Backend Action | Confirmation? | Notes |
|---|---|---:|---|
| Send Reply | `POST /chats/:id/send` | No | Sends human message |
| Take Over | `POST /chats/:id/takeover` | No | AI stops replying |
| Release Takeover | future endpoint | Yes | AI may resume |
| Resolve Chat | `POST /chats/:id/resolve` | No | Mark as resolved |
| Reopen Chat | future endpoint | No | Set status open |
| Delete Chat | `DELETE /chats/:id` | Yes | Dangerous |
| Add Tag | `PUT /contacts/:id` | No | Updates contact |
| Add Note | `PUT /contacts/:id` | No | Updates contact |
| Escalate to Human | update chat escalation | No | Manual escalation |

## Platform Actions

| UI Action | Backend Action | Confirmation? |
|---|---|---:|
| Add Platform | `POST /platforms` | No |
| Update Platform | `PUT /platforms/:id` | No |
| Disable Platform | `PUT /platforms/:id` | Yes |
| Delete Platform | `DELETE /platforms/:id` | Yes |
| Set Telegram Webhook | `POST /integrations/telegram/:id/setWebhook` | Yes |
| Send Test Message | integration/test endpoint | No |
| Verify Webhook | integration/webhook-info endpoint | No |

## Agent Actions

| UI Action | Backend Action | Confirmation? |
|---|---|---:|
| Create Agent | `POST /agents` | No |
| Update Agent | `PUT /agents/:id` | No |
| Delete Agent | `DELETE /agents/:id` | Yes |
| Test Agent | `POST /agents/:id/test` | No |
| Upload Knowledge File | `POST /agents/upload` | No |
| Enable/Disable AI | update agent/platform setting | Yes |

## Product Actions

| UI Action | Backend Action | Confirmation? |
|---|---|---:|
| Create Product | `POST /products` | No |
| Update Product | `PUT /products/:id` | No |
| Publish Product | `PATCH /products/:id/status` | No |
| Archive Product | `PATCH /products/:id/status` | Yes |
| Delete Product | `DELETE /products/:id` | Yes |
| Add Variant | `POST /products/:id/variants` | No |
| Update Variant | `PUT /variants/:id` | No |
| Upload Product Image | `POST /files` or product image endpoint | No |

## Order Actions

| UI Action | Backend Action | Confirmation? |
|---|---|---:|
| View Order | `GET /orders/:id` | No |
| Update Status | `PATCH /orders/:id/status` | Yes if terminal |
| Cancel Order | `POST /orders/:id/cancel` | Yes |
| Mark Completed | `PATCH /orders/:id/status` | Yes |
| Send Order Update | notification endpoint | No |
| Open Related Chat | navigate to chat | No |

## Payment Actions

| UI Action | Backend Action | Confirmation? |
|---|---|---:|
| Create Payment Link | `POST /payments` | No |
| Copy Payment Link | client-side | No |
| Refresh Payment Status | `GET /payments/:id` | No |
| View Events | `GET /payments/:id/events` | No |
| Manual Mark Paid | admin manual endpoint | Yes, high risk |
| Cancel Payment | provider/backend endpoint | Yes |

## Rule

Every destructive or payment-sensitive action must use confirmation modal and show impact summary.
