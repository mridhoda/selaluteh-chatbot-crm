---
schema_version: 2
document_type: active-task-pointer
status: idle
updated_at: 2026-07-03
---

# Current Task

## SelaluTeh AI Security Guardrails

Status: idle after completing Phase 5 (`AISG-T022` through `AISG-T057`).

Completed in the latest session:

- Activated `selaluteh-ai-security-guardrails` through the specs lifecycle.
- Moved the spec to `specs/active/selaluteh-ai-security-guardrails/` via `npm run specs:sync`.
- Completed `AISG-T001` audit evidence in `specs/active/selaluteh-ai-security-guardrails/audit-evidence.md`.
- Completed `AISG-T002` tool matrix in `specs/active/selaluteh-ai-security-guardrails/tool-matrix.md`.
- Completed `AISG-T003` architecture import-boundary security test and Phase 0 fail-closed mitigation for AI mutation tools.
- Completed `AISG-T004` Telegram/WhatsApp button-commerce regression baseline.
- Completed `AISG-T005` payment provider authority inventory and generic workspace-config provider selection update.
- Updated `tasks.md`, `implementation-status.md`, and `progress-log.md`.
- Validation: AI unit/security/E2E, payment targeted, Telegram marketplace smoke, and `npm run specs:check` passed.
- Completed Phase 1 scope/trusted-context guardrails: deterministic input/domain scope guard, out-of-scope short-circuit before retrieval/model/tools, human takeover short-circuit, server-owned agent modes, immutable `AIActionContext`, tenant consistency guard, authority-field rejection, and cross-tenant non-disclosure tests.
- Phase 1 validation: focused AISG Phase 1 tests passed (24 pass, 0 fail); `npm run test:ai:security` passed (7 pass, 0 fail); `npm run test:ai:unit` passed (246 pass, 0 fail).
- Completed Phase 2 tool gateway and policy engine: versioned immutable tool registry, deny-by-default gateway, deterministic restricted-action policy, strict schema validation with unknown-field rejection, safe result normalizer, tool/payload/timeout/call limits, dependency breaker safe failure, and `ai.service` marker sanitization/no contact-name mutation.
- Phase 2 validation: focused Phase 2 gateway tests passed (35 pass, 0 fail); `npm run test:ai:security` passed (7 pass, 0 fail); `npm run test:ai:unit` passed (254 pass, 0 fail).
- Completed Phase 3 confirmation guard: additive `ai_action_confirmations` migration, payload hashing, opaque single-use token consume, context/state binding, ambiguity guard, outlet recommendation confirmation, and canonical checkout summary confirmation.
- Completed Phase 4 product/outlet/cart/pricing guardrails: active/customer-visible product search, outlet-aware effective pricing, outlet-required mutation guard, orderable outlet guard, canonical cart quantity/merge/single-outlet/server-price guards, freshness/idempotency helpers, and existing-cart checkout intent.
- Completed Phase 5 checkout/order/payment guardrails: checkout revalidation, cart-version idempotency, canonical order/payment guard helpers, FILE_ORDER_JSON prompt removal/sanitization, workspace provider authority, payment snapshot validation, PAID authority proof, no silent provider fallback, and pickup-only checkout enforcement.
- Phase 3-5 validation: `phase3-5-guardrails.test.js` passed (8 pass, 0 fail); `npm run test:ai:unit` passed (262 pass, 0 fail); `npm run test:ai:security` passed (7 pass, 0 fail); `npm run test:ai:e2e` passed (4 pass, 0 fail); payment targeted tests passed (9 pass, 0 fail).

Key findings:

- `ai.service.js` has active inline OpenAI tools that directly mutate cart/chat repositories.
- Gemini fallback still supports `FILE_ORDER_JSON/create_legacy_order`.
- AI orchestrator contains a direct commerce tool switch that can mutate cart/checkout/order/payment state if wired.
- Existing tool gateway and confirmation service are present but do not satisfy AISG target boundaries.
- Button-based Telegram commerce is safer and should be preserved while AI paths are constrained.
- After Phase 0 mitigation, AI natural-language mutation tools fail closed until AISG gateway/confirmation implementation is completed.
- After Phase 1, `generateAIReply()` now short-circuits out-of-scope and human-takeover turns before outlet retrieval, Q&A lookup, provider calls, OpenAI tools, Gemini generation, and legacy FILE marker handling.

Pending next task selection:

- Recommended next task: `AISG-T058` reliability and idempotency hardening for Phase 6.
- Do not continue automatically until the next task is explicitly selected.
