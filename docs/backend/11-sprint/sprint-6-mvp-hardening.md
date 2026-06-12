# Sprint 6 — MVP Hardening

## Objective

Prepare end-to-end Telegram marketplace MVP for demo/release.

## Scope

- Regression.
- Security review.
- Observability.
- Release checklist.

## Tasks

- [ ] Run smoke tests.
- [ ] Run webhook tests.
- [ ] Run payment tests.
- [ ] Run security checklist.
- [ ] Review logs.
- [ ] Review env/secrets.
- [ ] Document rollback.
- [ ] Finalize MVP demo script.

## Acceptance Criteria

End-to-end flow works:

```txt
Telegram user
→ product list
→ add to cart
→ checkout
→ payment link
→ sandbox paid webhook
→ Telegram paid notification
→ admin sees order
```
