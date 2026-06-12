# Risks Overview

## Highest Risks

| Risk | Severity | Why It Matters | Mitigation |
|---|---|---|---|
| Payment spoofing | Critical | Fake paid orders | Verify payment webhook signature |
| Public orders/complaints | Critical | Data leak/modification | Add auth + workspace scope |
| Duplicate webhook | High | Duplicate message/order/payment | Add webhook_events/idempotency |
| AI creates invalid order | High | Wrong order/payment state | Backend validation + AI action guardrails |
| Local uploads lost | High | Broken media/payment proofs | Persistent volume + backup |
| Cross-workspace access | Critical | Tenant data leak | Workspace scope + RLS |
| Scope creep | Medium | MVP delay | Keep multi-seller out of MVP |
| Migration data loss | High | Broken production history | Dry run + validation + cutover plan |

## Product Risks

- User may not understand Telegram bot purchase flow.
- Payment link may reduce conversion if UX is unclear.
- Admin may need order fulfillment tools earlier than expected.
- AI may answer beyond available product data if guardrails are weak.

## Technical Risks

- Existing CRM regression.
- Mongo to Supabase migration complexity.
- Inconsistent workspace ownership.
- Long webhook processing without queue.
- Payment provider callback differences.

## Operational Risks

- Webhook public URL not stable.
- Server upload folder not persistent.
- Secrets accidentally exposed.
- Insufficient logging for payment/webhook failures.

## Risk Strategy

MVP should follow this priority:

```txt
security → deterministic commerce → payment → AI enhancement
```
