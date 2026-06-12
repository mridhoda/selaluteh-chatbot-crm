# Business Risks

## Risk Categories

- Market risk.
- Adoption risk.
- Pricing risk.
- Operational risk.
- Competitive risk.
- Legal/compliance risk.
- Technical-business risk.

## Risk Register

| ID | Risk | Severity | Probability | Mitigation |
|---|---|---|---|---|
| B-001 | Merchants do not want Telegram-first commerce | High | Medium | Validate with interviews/demo |
| B-002 | Merchants prefer WhatsApp over Telegram | High | High | Start Telegram MVP but plan WhatsApp flow |
| B-003 | Merchants unwilling to pay monthly | High | Medium | Test setup fee and tiered pricing |
| B-004 | Setup/onboarding too manual | Medium | High | Create onboarding templates/import tools |
| B-005 | AI costs reduce margin | Medium | Medium | Add quotas, deterministic flow |
| B-006 | Competitors add similar checkout features | Medium | Medium | Focus on workflow depth and local fit |
| B-007 | Payment provider setup blocks merchant | Medium | Medium | Support manual/sandbox mode first |
| B-008 | Customer distrusts payment link | Medium | Medium | Use clear branding and provider link |
| B-009 | Scope creep delays MVP | High | High | Keep multi-seller out of MVP |
| B-010 | Support workload too high | Medium | Medium | Improve docs and self-serve setup |

## Major Business Risk

The biggest business risk:

```txt
The product solves a real workflow problem, but the first channel choice may not match merchant habits.
```

If merchants heavily prefer WhatsApp, Telegram MVP should still be used for fast technical validation, but roadmap should include WhatsApp commerce soon after.

## Risk Mitigation Strategy

1. Validate with real merchants early.
2. Do not overbuild multi-seller.
3. Keep setup simple.
4. Track conversion funnel.
5. Keep AI costs controlled.
6. Build admin workflow around real merchant feedback.
