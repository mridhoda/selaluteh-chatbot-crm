# Edge Cases

Dokumen ini mengumpulkan edge cases lintas flow untuk backend Telegram-first Marketplace MVP.

## Auth Edge Cases

| Case | Expected Behavior |
|---|---|
| User login before verified | Return verification required |
| Expired OTP | Ask user to request new OTP |
| Reset token reused | Reject token |
| JWT valid but user deleted | Reject and force logout |
| Agent role accesses another workspace | Deny |

## Webhook Edge Cases

| Case | Expected Behavior |
|---|---|
| Duplicate Telegram update | Do not create duplicate message/order/payment |
| Platform token not found | Log and return safe response |
| Agent missing for platform | Use workspace fallback agent or send admin fallback |
| Contact upsert race | Unique constraint prevents duplicate contact |
| Chat upsert race | Unique constraint or transaction prevents duplicate chat |
| Provider retries webhook after timeout | Idempotency handles safe retry |

## Telegram Commerce Edge Cases

| Case | Expected Behavior |
|---|---|
| User clicks old product button | Reload product; if inactive, show unavailable |
| User clicks old checkout button | If expired, ask to recreate checkout |
| User has multiple active carts | Use latest active cart or enforce one active cart per contact/workspace |
| Callback data malformed | Reject safely and show menu |
| Product variant required but missing | Ask user to select variant |

## Cart and Checkout Edge Cases

| Case | Expected Behavior |
|---|---|
| Cart empty | Block checkout |
| Product inactive | Block checkout and ask remove item |
| Price changed | Recalculate and show updated total |
| Stock insufficient | Block or reduce quantity with confirmation |
| Checkout double confirm | Return existing order/payment if already converted |
| Payment link creation fails | Keep order pending and allow retry |

## Payment Edge Cases

| Case | Expected Behavior |
|---|---|
| Invalid webhook signature | Reject and log security event |
| Duplicate paid webhook | Do not double notify or double update |
| Paid webhook after order cancelled | Flag for admin review |
| Unknown provider reference | Save unmatched event and alert admin |
| Payment expired but user pays late | Follow provider source of truth and admin review |
| Manual payment proof uploaded | Store file, require admin verification |

## AI Edge Cases

| Case | Expected Behavior |
|---|---|
| AI hallucinated product | Do not show unavailable product as purchasable |
| AI proposes add-to-cart without product id | Ask clarification |
| AI tries to mark paid | Reject; payment status only from provider/admin |
| AI responds during human takeover | Prevent by checking takeover before send |
| AI provider timeout | Send fallback and/or escalate to human |
| Prompt injection from user | AI tools limited by backend validation |

## Human Takeover Edge Cases

| Case | Expected Behavior |
|---|---|
| Two admins takeover same chat | Use transaction/update guard or latest owner policy |
| User sends many messages during takeover | Save messages, update unread, no AI reply |
| Admin sends but provider fails | Save failed status or show retry |
| Resolved chat receives new message | Reopen chat or create new session based on product rule |

## File Edge Cases

| Case | Expected Behavior |
|---|---|
| File missing from local disk | Show broken file indicator; include in health check |
| File too large | Reject with clear error |
| Unsupported mime type | Reject or store generic based on policy |
| Public file contains sensitive data | Move to protected media endpoint plan |

## Migration/Deployment Edge Cases

| Case | Expected Behavior |
|---|---|
| Webhook active during cutover | Risk duplicate/lost data; stop ingestion first |
| Uploads not copied | Files metadata will point to missing files |
| RLS bypass by service role | Backend must still validate workspace ownership |
| Old Mongo ObjectId not mapped | Record failed row and do not orphan data |
