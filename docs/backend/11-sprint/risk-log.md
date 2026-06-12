# Risk Log

## Risk Table

| ID | Risk | Severity | Probability | Impact | Mitigation | Status |
|---|---|---|---|---|---|---|
| R-001 | Orders/complaints routes public | Critical | Medium | Data leak/modification | Add auth + workspace scope | Open |
| R-002 | Duplicate Telegram webhook creates duplicate message/order | High | Medium | Bad UX/data duplication | Add webhook idempotency | Open |
| R-003 | Payment webhook spoofing | Critical | Medium | Fake paid orders | Verify provider signature | Open |
| R-004 | AI creates invalid order | High | Medium | Wrong cart/order/payment | Backend validation + AI actions | Open |
| R-005 | Local uploads lost during deployment | High | Medium | Broken media/payment proofs | Persistent volume + backups | Open |
| R-006 | Supabase service role exposed | Critical | Low | Full data compromise | Server-only env policy | Open |
| R-007 | Cross-workspace data access | Critical | Medium | Tenant data leak | Workspace query helpers + RLS | Open |
| R-008 | Migration loses message order | High | Medium | Broken chat history | Preserve timestamps | Open |
| R-009 | Existing CRM breaks during marketplace work | High | Medium | Product regression | Regression checklist | Open |
| R-010 | Scope creep to multi-seller too early | Medium | High | MVP delay | Explicit out-of-scope list | Open |

## Risk Review Cadence

Review at:

- Start of sprint.
- Before payment work.
- Before production cutover.
- Before MVP demo.
