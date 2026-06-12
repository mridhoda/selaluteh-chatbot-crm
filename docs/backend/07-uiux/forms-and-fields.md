# Forms and Fields

## Purpose

This document defines key admin forms and fields required for backend features.

## Product Form

Required fields:

| Field | Type | Required | Notes |
|---|---|---:|---|
| name | text | Yes | Product display name |
| slug | text | Auto/optional | Unique per workspace |
| description | textarea | No | Used by AI/product detail |
| category_id | select | No | Product category |
| status | select | Yes | draft/active/archived |
| base_price | money | Yes | Minor unit in backend |
| currency | select | Yes | Default IDR |
| image | upload | No | File metadata |
| telegram_visible | switch | Yes | Whether product appears in Telegram |
| sort_order | number | No | Display ordering |

## Variant Form

| Field | Type | Required |
|---|---|---:|
| name | text | Yes |
| sku | text | No |
| price | money | Yes |
| stock_quantity | number | Optional for MVP |
| status | select | Yes |
| attributes | key-value/json | No |

## Platform Form

| Field | Type | Required | Notes |
|---|---|---:|---|
| type | select | Yes | telegram/whatsapp/instagram |
| label | text | Yes | Admin label |
| token | masked secret input | Depends | Telegram token |
| account_id | text | Depends | Meta account id |
| phone_number_id | text | Depends | WhatsApp |
| app_secret | masked secret input | No | Meta security |
| webhook_secret | masked secret input | No | Future webhook security |
| enabled | switch | Yes | Enable/disable platform |

## Agent Form

| Field | Type | Required |
|---|---|---:|
| name | text | Yes |
| platform_id | select | No |
| welcome_message | textarea | No |
| prompt | textarea/code editor | Yes |
| behavior | textarea | No |
| ai_enabled | switch | Yes |
| knowledge files | upload/list | No |
| follow_up rules | repeatable group | No |
| payment instruction | textarea | No for gateway mode |

## Order Status Form

Fields:

- status select
- notes textarea
- notify_customer switch
- reason textarea for cancellation
- confirm checkbox for terminal state

## Payment Manual Action Form

Use only for admin override.

Fields:

- action type
- reason
- proof/reference
- confirm checkbox
- admin password or re-auth for high-risk action

## Validation Rule

Frontend forms should validate basic shape, but backend must always validate again.
