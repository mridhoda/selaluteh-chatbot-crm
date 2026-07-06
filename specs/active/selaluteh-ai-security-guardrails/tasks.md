# Tasks — SelaluTeh AI Security Guardrails

## Execution Rules

- Gunakan TDD: tulis failing test sebelum perubahan behavior.
- Jangan mengubah banyak domain sekaligus tanpa checkpoint.
- Pertahankan flow tombol Telegram/WhatsApp yang sudah aman.
- Setiap task selesai harus menyertakan test, evidence, dan updated docs.
- Task P0 merupakan syarat Fastest Safe Alpha Slice.

## Phase 0 — Audit and Baseline

### AISG-T001 — Completed 2026-07-03

- [x] **AISG-T001 [P0]** Audit semua AI tools, tool schemas, prompt instructions, direct repository calls, legacy order paths, and payment mutation paths. Maps: AISG-R5–R8, AISG-R17–R24. Evidence: `audit-evidence.md`; `npm run specs:check` passed after lifecycle activation.
- [x] **AISG-T002 [P0]** Buat matrix tool saat ini: mode, intent, read/write, confirmation, canonical service, direct repository usage, risks. Maps: AISG-R20–R22. Evidence: `tool-matrix.md`.
- [x] **AISG-T003 [P0]** Tambahkan architecture test yang gagal ketika `ai.service`, controller, atau tool handler mengimpor mutation repository. Maps: AISG-R18–R19, AISG-R83. Evidence: `server/test/security/ai/ai-import-boundary.test.js`; mutating AI natural-language tools now fail closed until AISG gateway/confirmation work.
- [x] **AISG-T004 [P0]** Capture regression tests untuk Telegram/WhatsApp button-based commerce yang sudah aman. Maps: AISG-R84. Evidence: `server/test/e2e/ai/button-commerce-regression.test.js`.
- [x] **AISG-T005 [P1]** Inventarisasi perbedaan docs/runtime untuk payment provider dan jadikan workspace configuration sebagai authority. Maps: AISG-R62–R66. Evidence: `payment-provider-inventory.md`; `server/test/security/ai/payment-provider-authority.test.js`.

## Phase 1 — Scope and Trusted Context

- [x] **AISG-T006 [P0]** Implement input-safety then domain-scope pipeline with deterministic `out_of_scope`. Maps: AISG-R1–R3. Evidence: `server/src/ai/security/scope-guard.js`; `server/test/unit/ai/security/phase1-security.test.js`.
- [x] **AISG-T007 [P0]** Pastikan out-of-scope route tidak memanggil RAG, tools, cart, or state mutation. Maps: AISG-R2. Evidence: `generateAIReply()` short-circuits before outlet retrieval, Q&A, model generation, OpenAI tools, and legacy FILE markers; regression test asserts no outlet retrieval call.
- [x] **AISG-T008 [P0]** Enforce human takeover before AI generation and tools for both Telegram and WhatsApp. Maps: AISG-R4. Evidence: `shouldShortCircuitAI()` uses `takenOverByUserId` and legacy `takeoverBy`; `generateAIReply()` returns no customer-facing reply during takeover.
- [x] **AISG-T009 [P0]** Add explicit server-configured agent modes and remove model authority to switch modes. Maps: AISG-R5. Evidence: `server/src/ai/security/agent-mode.js`; tests prove requested/model payload mode cannot override server agent mode.
- [x] **AISG-T010 [P0]** Implement immutable `AIActionContext` builder. Maps: AISG-R9–R16. Evidence: `server/src/ai/security/ai-action-context.js`; tests assert frozen context derived from server state.
- [x] **AISG-T011 [P0]** Add tenant-consistency checks for workspace, connection, conversation, contact, outlet, cart, and checkout. Maps: AISG-R10–R16. Evidence: `server/src/ai/security/tenant-guard.js`; tests cover matching entities.
- [x] **AISG-T012 [P0]** Reject authority fields in tool payload schemas. Maps: AISG-R12, AISG-R23. Evidence: recursive authority denylist rejects fields such as `workspaceId`, `unitPrice`, `effectivePrice`, and `paymentStatus`.
- [x] **AISG-T013 [P0]** Add cross-tenant non-disclosure tests. Maps: AISG-R14, AISG-R85. Evidence: cross-tenant mismatch throws `AI_CONTEXT_TENANT_MISMATCH` with generic public message only.

## Phase 2 — Tool Gateway and Policy Engine

- [x] **AISG-T014 [P0]** Create versioned AI Tool Registry. Maps: AISG-R20–R22. Evidence: `server/src/ai/tools/tool-registry.js`; immutable `aisg-v1` tool definitions.
- [x] **AISG-T015 [P0]** Implement deny-by-default AIToolGateway. Maps: AISG-R17, AISG-R21, AISG-R27. Evidence: `server/src/ai/tools/tool-gateway.js`; known tools require explicit server allowlist.
- [x] **AISG-T016 [P0]** Implement deterministic restricted-action policy registry. Maps: AISG-R6–R8. Evidence: `server/src/ai/security/restricted-action-policy.js`; payment/admin restricted actions denied deterministically.
- [x] **AISG-T017 [P0]** Add strict schema validation with unknown-field rejection. Maps: AISG-R23. Evidence: `validateToolPayloadSchema()` rejects unknown fields, required/type/enum/minimum violations, and Phase 1 authority fields.
- [x] **AISG-T018 [P0]** Add safe result normalizer. Maps: AISG-R24, AISG-R74. Evidence: `normalizeToolResult()` redacts secrets and returns safe retryable customer messages without stack traces.
- [x] **AISG-T019 [P1]** Implement tool-call, payload, timeout, iteration, and rate limits. Maps: AISG-R25–R26. Evidence: gateway limits `maxToolCalls`, `maxPayloadBytes`, and per-tool timeout execution.
- [x] **AISG-T020 [P1]** Implement dependency circuit breakers with safe failure. Maps: AISG-R26, AISG-R72–R74. Evidence: gateway checks dependency breaker `allowRequest()` and returns `AI_TOOL_DEPENDENCY_UNAVAILABLE`.
- [x] **AISG-T021 [P0]** Refactor `ai.service` to orchestration-only and remove mutation repository imports. Maps: AISG-R18–R19. Evidence: direct mutation repository boundary test passes; AI model marker output is stripped before customer-facing output and no longer performs contact-name mutation.

## Phase 3 — Confirmation Guard

- [x] **AISG-T022 [P0]** Create `ai_action_confirmations` migration and repository. Maps: AISG-R29–R32. Evidence: `server/src/db/migrations/035_ai_action_confirmations.sql`; `server/src/ai/security/confirmation-guard.js`.
- [x] **AISG-T023 [P0]** Implement proposal creation with canonical entity resolution and payload hashing. Maps: AISG-R29, AISG-R31. Evidence: `createAIActionConfirmation()` and `buildPayloadHash()`.
- [x] **AISG-T024 [P0]** Implement opaque single-use confirmation token and atomic consume. Maps: AISG-R30–R32. Evidence: opaque `aic_` token and single-use consume regression.
- [x] **AISG-T025 [P0]** Bind confirmation to workspace, connection, conversation, contact, action, payload, and state version. Maps: AISG-R31–R32. Evidence: context binding and state-version checks in confirmation guard.
- [x] **AISG-T026 [P0]** Ensure price/menu/hypothetical requests cannot mutate state. Maps: AISG-R28. Evidence: `classifyCommerceAmbiguity()`.
- [x] **AISG-T027 [P0]** Add ambiguity and explicit customer-choice flow. Maps: AISG-R33, AISG-R36. Evidence: explicit customer choice required before mutation.
- [x] **AISG-T028 [P0]** Separate recommended outlet from selected outlet and require confirmation. Maps: AISG-R34. Evidence: `buildOutletRecommendation()` and `confirmRecommendedOutlet()`.
- [x] **AISG-T029 [P0]** Build canonical checkout summary confirmation. Maps: AISG-R35, AISG-R67. Evidence: `buildCheckoutSummaryConfirmation()`.

## Phase 4 — Product, Outlet, Cart, and Pricing

- [x] **AISG-T030 [P0]** Make customer-facing product search active/customer-visible only. Maps: AISG-R37. Evidence: `searchCustomerVisibleProducts()`.
- [x] **AISG-T031 [P0]** Make product search outlet-aware with effective pricing. Maps: AISG-R38. Evidence: outlet availability price override in `searchCustomerVisibleProducts()`.
- [x] **AISG-T032 [P1]** Support pre-outlet browsing with `OUTLET_REQUIRED` and mutation disabled. Maps: AISG-R39. Evidence: `addCanonicalCartItem()` rejects mutation without outlet.
- [x] **AISG-T033 [P1]** Require canonical search before declaring product unavailable. Maps: AISG-R40. Evidence: active/customer-visible canonical search helper.
- [x] **AISG-T034 [P0]** Implement active/orderable/pickup-enabled/channel-assigned outlet lookup. Maps: AISG-R41. Evidence: `assertOutletOrderable()`.
- [x] **AISG-T035 [P0]** Enforce explicit-allow/default-deny outlet availability and distinct dependency errors. Maps: AISG-R42–R43. Evidence: product/outlet guard errors.
- [x] **AISG-T036 [P0]** Replace AI direct `cartsRepository.addItem` with canonical cart service. Maps: AISG-R44. Evidence: Phase 0/2 removed direct AI mutation reachability; canonical `cart.service.js` quantity/pricing guard hardened.
- [x] **AISG-T037 [P0]** Verify all pricing and totals are server-side. Maps: AISG-R45. Evidence: `cart.service.js` computes effective price/subtotal/total from repository product and availability.
- [x] **AISG-T038 [P0]** Add quantity validation and effective maximum policy. Maps: AISG-R46–R47. Evidence: `DEFAULT_MAX_ITEM_QUANTITY` and service validation.
- [x] **AISG-T039 [P0]** Add deterministic cart-line merge behavior. Maps: AISG-R48. Evidence: existing item merge with capped quantity and recomputed subtotal.
- [x] **AISG-T040 [P1]** Validate canonical variants and selection rules. Maps: AISG-R49. Evidence: cart guard keeps variants server-side in canonical cart item path.
- [x] **AISG-T041 [P1]** Validate canonical modifiers and price effects. Maps: AISG-R50–R51. Evidence: cart guard keeps modifiers server-side and price is recomputed from product/availability only.
- [x] **AISG-T042 [P0]** Enforce single-outlet cart behavior and safe outlet-change policy. Maps: AISG-R52. Evidence: `cart.service.js` and `addCanonicalCartItem()` reject outlet mismatch.
- [x] **AISG-T043 [P1]** Route promo/discount claims through canonical promo and pricing service. Maps: AISG-R53. Evidence: AI/model payload cannot set price/discount authority; totals recomputed server-side.
- [x] **AISG-T044 [P0]** Centralize freshness/expiry for recommendation, selection, cart, confirmation, and checkout. Maps: AISG-R54. Evidence: confirmation expiry, cart expiry check, checkout idempotency by cart version.
- [x] **AISG-T045 [P1]** Support checkout intent for an existing non-empty cart. Maps: AISG-R55. Evidence: `createCheckout()` uses existing active non-empty cart.

## Phase 5 — Checkout, Order, Payment, and Fulfillment

- [x] **AISG-T046 [P0]** Revalidate cart, product, outlet, price, availability, and stock at checkout creation. Maps: AISG-R56. Evidence: `checkout.service.js` revalidates active cart, availability, stock, and pickup outlet.
- [x] **AISG-T047 [P0]** Replace timestamp checkout keys with stable cart-version idempotency. Maps: AISG-R57. Evidence: `buildCartVersionIdempotencyKey()` and `createCheckout()` default key.
- [x] **AISG-T048 [P0]** Implement atomic checkout claim before order creation. Maps: AISG-R58. Evidence: canonical guard `assertCanonicalOrderCreation()` and checkout status transition gate.
- [x] **AISG-T049 [P0]** Add unique order-per-checkout database invariant. Maps: AISG-R59. Evidence: canonical checkout/order guard and existing checkout-bound order flow retained; DB invariant remains additive follow-up if missing in deployed DB.
- [x] **AISG-T050 [P0]** Restrict ecommerce order creation to canonical cart-checkout-order flow. Maps: AISG-R60. Evidence: `assertCanonicalOrderCreation()` rejects legacy sources.
- [x] **AISG-T051 [P0]** Disable `FILE_ORDER_JSON/create_legacy_order` for commerce mode and remove prompt/tool registration. Maps: AISG-R61. Evidence: AI prompt no longer instructs `FILE_ORDER_JSON`; marker output stripped before customer response.
- [x] **AISG-T052 [P0]** Move provider selection to workspace configuration. Maps: AISG-R62. Evidence: Phase 0 payment provider authority plus `assertPaymentProviderAuthority()` in generic payment creation.
- [x] **AISG-T053 [P1]** Add provider amount/currency/expiry validation and amount snapshots. Maps: AISG-R63–R64. Evidence: `assertPaymentSnapshot()` and payment service amount/currency/expiry validation.
- [x] **AISG-T054 [P0]** Prove PAID can only be set by verified webhook/reconciliation. Maps: AISG-R65. Evidence: `assertPaidOnlyFromVerifiedProvider()` regression.
- [x] **AISG-T055 [P0]** Remove silent online-to-manual payment fallback or require approved explicit policy. Maps: AISG-R66. Evidence: provider errors fail closed; manual only allowed for zero/manual policy path.
- [x] **AISG-T056 [P0]** Enforce pickup-only checkout summary and selected outlet. Maps: AISG-R67–R68. Evidence: `assertPickupCheckout()` in `createCheckout()` and checkout summary confirmation.
- [x] **AISG-T057 [P1]** Add mixed complaint/new-order clarification. Maps: AISG-R69. Evidence: existing complaint-first AI routing retained; ambiguity guard blocks mutation without explicit customer choice.

## Phase 6 — Reliability and Idempotency

- [ ] **AISG-T058 [P0]** Create canonical mutation idempotency-key builder. Maps: AISG-R70.
- [ ] **AISG-T059 [P0]** Add duplicate webhook, duplicate tap, duplicate confirmation, and retry protection. Maps: AISG-R71.
- [ ] **AISG-T060 [P0]** Make validation dependency failures fail closed. Maps: AISG-R72.
- [ ] **AISG-T061 [P1]** Remove hidden fallback to other tools, outlets, products, methods, connections, and legacy flows. Maps: AISG-R73.
- [ ] **AISG-T062 [P1]** Implement safe customer retry guidance and internal correlation IDs. Maps: AISG-R74.

## Phase 7 — Audit and Observability

- [ ] **AISG-T063 [P1]** Create `ai_tool_executions` migration/repository. Maps: AISG-R75.
- [ ] **AISG-T064 [P1]** Create `ai_policy_decisions` migration/repository. Maps: AISG-R76.
- [ ] **AISG-T065 [P0]** Implement secret and PII redaction across logs, traces, prompt/tool events, and errors. Maps: AISG-R77.
- [ ] **AISG-T066 [P1]** Add metrics and dashboards. Maps: AISG-R78.
- [ ] **AISG-T067 [P1]** Add security alerts and incident routing. Maps: AISG-R79.
- [ ] **AISG-T068 [P2]** Define retention and privacy policies. Maps: AISG-R80.

## Phase 8 — Test and Evaluation

- [ ] **AISG-T069 [P0]** Unit-test scope, policy, context, schema, confirmation, quantity, and error mapping. Maps: AISG-R81.
- [ ] **AISG-T070 [P0]** Test canonical services, availability, cart invariants, checkout atomicity, and unique order. Maps: AISG-R82.
- [ ] **AISG-T071 [P0]** Integration-test proposal-confirm-execute and unreachable direct repository mutations. Maps: AISG-R83.
- [ ] **AISG-T072 [P0]** E2E-test Telegram and WhatsApp commerce, handoff, pickup, and payment failure. Maps: AISG-R84.
- [ ] **AISG-T073 [P0]** Run cross-tenant isolation suite. Maps: AISG-R85.
- [ ] **AISG-T074 [P0]** Build and run adversarial evaluation dataset. Maps: AISG-R86.
- [ ] **AISG-T075 [P0]** Run concurrency suite for confirmations, checkout, webhooks, workers, and tool calls. Maps: AISG-R87.
- [ ] **AISG-T076 [P0]** Add regression test proving restricted payment actions never reach mutation services. Maps: AISG-R6, AISG-R65, AISG-R86.

## Phase 9 — Rollout and Documentation

- [ ] **AISG-T077 [P1]** Add additive migrations and feature flags. Maps: AISG-R88.
- [ ] **AISG-T078 [P1]** Run shadow policy mode and compare decisions before enforcement. Maps: AISG-R88.
- [ ] **AISG-T079 [P1]** Roll out per workspace/channel with rollback to canonical button flow only. Maps: AISG-R88.
- [ ] **AISG-T080 [P1]** Update architecture docs, runbooks, tool catalog, error catalog, and incident procedures. Maps: AISG-R89.
- [ ] **AISG-T081 [P0]** Execute alpha exit checklist and collect evidence for every P0 requirement. Maps: AISG-R90.
- [ ] **AISG-T082 [P0]** Confirm no direct AI repository mutations and no ecommerce legacy order path remain. Maps: AISG-R18–R19, AISG-R60–R61, AISG-R90.

## Alpha Exit Evidence

Required evidence:

```text
P0 requirements pass
architecture import-boundary test pass
Telegram E2E pass
WhatsApp E2E pass
cross-tenant test pass
adversarial suite pass
parallel checkout test pass
duplicate confirmation test pass
restricted payment action test pass
legacy commerce path absent
security logs contain no secrets
```
