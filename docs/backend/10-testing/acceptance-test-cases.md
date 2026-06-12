# Acceptance Test Cases

## Purpose

Acceptance tests define behavior that must be true from a product/business perspective.

## Auth

| Case | Given | When | Then |
|---|---|---|---|
| Register owner | New email | User registers | Workspace, owner, OTP created |
| Login verified user | User verified | Login with correct password | JWT returned |
| Block unverified login | User not verified | Login | Request rejected |

## Telegram Webhook

| Case | Given | When | Then |
|---|---|---|---|
| First message | Platform exists | Telegram text webhook arrives | Contact, chat, message created |
| Duplicate webhook | Same `platform_message_id` | Payload retried | No duplicate message |
| Human takeover | Chat has `takeover_by` | New user message arrives | AI reply skipped |
| Unknown platform | No matching token/account | Webhook arrives | Event logged and no crash |

## Product Catalog

| Case | Given | When | Then |
|---|---|---|---|
| Active products | Product active | User browses | Product visible |
| Inactive products | Product inactive | User browses | Product hidden |
| Variant unavailable | Variant disabled/out of stock | Add to cart | Rejected |

## Cart and Checkout

| Case | Given | When | Then |
|---|---|---|---|
| Add item | Empty cart | Add product variant | Cart item created |
| Update qty | Existing cart item | Add same variant | Quantity increments |
| Checkout empty cart | Empty cart | Checkout requested | Rejected |
| Checkout snapshot | Cart has items | Checkout | Product price/name snapshotted |

## Orders

| Case | Given | When | Then |
|---|---|---|---|
| Create order | Valid checkout | User confirms | Pending order + items created |
| Cancel pending order | Order pending | User/admin cancels | Status cancelled |
| Complete paid order | Order paid | Admin fulfills | Status completed |

## Payments

| Case | Given | When | Then |
|---|---|---|---|
| Create sandbox payment | Pending order | Payment requested | Payment link stored |
| Valid paid webhook | Payment pending | Provider sends paid event | Payment paid, order paid |
| Invalid signature | Any payment | Webhook invalid | Rejected and logged |
| Duplicate paid webhook | Payment already paid | Same event sent | No duplicate notification |

## AI Actions

| Case | Given | When | Then |
|---|---|---|---|
| Product recommendation | User asks product | AI suggests | Only active products used |
| Add to cart proposal | User asks to buy | AI proposes action | Backend asks confirmation or validates action |
| Payment status change | AI text says paid | Backend receives AI output | No payment/order status changed |

## Files

| Case | Given | When | Then |
|---|---|---|---|
| Upload file | Valid file | Upload | Metadata created and file exists locally |
| Oversized file | Too large | Upload | Rejected |
| Cross workspace file | User A file | User B request | Forbidden if protected endpoint used |
