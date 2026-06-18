# Risk Log

## Risk Table

 | ID | Risk | Severity | Probability | Impact | Mitigation | Status |
|---|---|---|---|---|---|---|---|
| R-001 | Orders/complaints routes public | Critical | Low | Data leak/modification | Auth + workspace scope + outlet access middleware implemented | Closed |
| R-002 | Duplicate Telegram webhook creates duplicate message/order | High | Medium | Bad UX/data duplication | Webhook idempotency (providerEventId + begin/complete) implemented and tested | Closed |
| R-003 | Payment webhook spoofing | Critical | Low | Fake paid orders | Provider signature verification + amount/currency validation + atomic status update | Mitigated |
| R-004 | AI creates invalid order | High | Low | Wrong cart/order/payment | AI action guardrails + backend validation + restricted action list implemented and tested | Closed |
| R-005 | Local uploads lost during deployment | High | Medium | Broken media/payment proofs | Persistent volume + backups | Open |
| R-006 | Supabase service role exposed | Critical | Low | Full data compromise | Server-only env policy | Open |
| R-007 | Cross-workspace data access | Critical | Low | Tenant data leak | Workspace query helpers + outlet access middleware + isolation tests (126 pass) | Closed |
| R-008 | Migration loses message order | High | Low | Broken chat history | Preserve timestamps | Open |
| R-009 | Existing CRM breaks during marketplace work | High | Medium | Product regression | Regression checklist + 135 automated tests (all pass) | Mitigated |
| R-010 | Scope creep to multi-seller too early | Medium | Low | MVP delay | Explicit out-of-scope list in spec.yaml | Closed |
| R-011 | Concurrent payment webhook double-paid | Critical | Low | Double-payment credit | AtomicStatusUpdate with expectedState check + idempotent event dedup | Closed |

## Risk Review Cadence

Review at:

- Start of sprint.
- Before payment work.
- Before production cutover.
- Before MVP demo.
