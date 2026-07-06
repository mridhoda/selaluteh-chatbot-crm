# AISG-T001 Audit Evidence — AI Security Guardrails

Date: 2026-07-03
Spec: `selaluteh-ai-security-guardrails`
Task: `AISG-T001 [P0]`

## Scope

Audit all AI tools, tool schemas, prompt instructions, direct repository calls, legacy order paths, and payment mutation paths. This task is audit-only; it documents current runtime risks and maps follow-up work to later AISG tasks.

## Documents And Code Inspected

Documents:

- `.agents/agents.md`
- `docs/backend/READING-ORDER.md`
- `specs/specs.config.yaml`
- `docs/backend/09-ai-context/current-task.md`
- `specs/active/selaluteh-ai-security-guardrails/spec.yaml`
- `specs/active/selaluteh-ai-security-guardrails/requirements.md`
- `specs/active/selaluteh-ai-security-guardrails/design.md`
- `specs/active/selaluteh-ai-security-guardrails/tasks.md`
- `docs/backend/09-ai-context/do-not-break.md`
- `docs/backend/09-ai-context/backend-boundaries.md`
- `docs/backend/09-ai-context/security-rules-for-ai.md`
- `docs/backend/09-ai-context/testing-expectations.md`
- `docs/backend/11-sprint/definition-of-done.md`

Runtime files:

- `server/src/services/ai.service.js`
- `server/src/services/ai-actions.service.js`
- `server/src/services/ai-context.service.js`
- `server/src/services/human-takeover.service.js`
- `server/src/ai/tools/domain-tools.js`
- `server/src/ai/tools/tool-gateway.js`
- `server/src/ai/tools/confirmation-service.js`
- `server/src/ai/tools/memory-tools.js`
- `server/src/ai/orchestration/orchestrator.js`
- `server/src/ai/orchestration/langchain-adapter.js`
- `server/src/ai/orchestration/specialist-router.js`
- `server/src/ai/agents/agent-schema.js`
- `server/src/ai/commerce/cart-flow.js`
- `server/src/ai/commerce/outlet-flow.js`
- `server/src/ai/commerce/order-flow.js`
- `server/src/ai/commerce/payment-flow.js`
- `server/src/ai/inbound/inbound-orchestrator.js`
- `server/src/routes/webhooks/telegram.js`
- `server/src/routes/webhooks/meta.js`
- `server/src/services/telegram-commerce.service.js`
- `server/src/services/cart.service.js`
- `server/src/services/checkout.service.js`
- `server/src/services/order.service.js`
- `server/src/services/payment.service.js`
- `server/src/services/payment-webhook.service.js`
- `server/src/services/payment-reconciliation.service.js`
- `server/src/workers/payment-reconciliation.worker.js`
- `server/src/db/repositories/index.js`

Tests inspected:

- `server/test/integration/commerce/cart-service.integration.test.js`
- `server/test/integration/chat/human-takeover.integration.test.js`
- `server/test/e2e/telegram-marketplace.e2e.test.js`

## Current AI Runtime Entry Points

| Entry point | Runtime status | Notes | Risk |
|---|---:|---|---|
| `server/src/routes/webhooks/telegram.js` -> `generateAIReply()` | Active | Telegram v1 route checks takeover before AI reply, then delegates to legacy `ai.service.js`. | Medium: active path reaches inline tool execution in `ai.service.js`. |
| `server/src/routes/webhooks/meta.js` -> `generateAIReply()` | Active | WhatsApp/Meta route checks takeover before AI reply, then delegates to legacy `ai.service.js`. | Medium: active path reaches inline tool execution in `ai.service.js`. |
| `server/src/services/ai.service.js` OpenAI tool loop | Active when OpenAI client available | Defines tools inline and executes DB operations inside local `executeToolCall()`. | High: direct repository mutation bypasses canonical gateway and confirmation design. |
| `server/src/services/ai.service.js` Gemini fallback | Active when Gemini client used/fallback | Prompt can emit `FILE_ORDER_JSON`, then service executes `create_legacy_order`. | High: legacy order path remains reachable. |
| `server/src/ai/orchestration/orchestrator.js` | Present architecture path | Creates tool gateway but executes commerce tools in local `executeCommerceTool()`. | High if wired: direct repository mutation and order/payment creation are embedded. |
| `server/src/ai/tools/tool-gateway.js` | Present but minimal | Validates unknown tools, allowlist, readonly mode; not deny-by-default by mode/domain/version. | Medium: does not meet AISG target gateway semantics. |
| `server/src/ai/tools/confirmation-service.js` | Present but in-memory | Binds token to chat/tool/args only; not workspace/channel/state-version/payload-hash persistent confirmation. | Medium: not AISG confirmation guard. |

## Current Tool Definitions And Schemas

### Inline OpenAI Tools In `ai.service.js`

`server/src/services/ai.service.js` defines an inline `commerceTools` array with these tools:

| Tool | Schema fields | Read/write | Confirmation | Runtime handler |
|---|---|---|---|---|
| `get_outlets` | none | Read | None | `outletsSupabaseRepository.list()` |
| `search_products` | `query` | Read | None | `productsRepository.search()` |
| `select_outlet` | `outletId` | Write | None in runtime executor | `cartsRepository.upsertByContact()` + `chatsSupabaseRepository.setCurrentOutlet()` |
| `add_cart_item` | `productId`, `quantity` | Write | None in runtime executor | `cartsRepository.findActiveByContact()`, `productsRepository.findById()`, `cartsRepository.addItem()`, `cartsRepository.update()` |

Findings:

- Inline schemas do not reject unknown fields.
- Inline schemas do not reject authority fields such as `workspaceId`, `unitPrice`, `effectivePrice`, or `paymentStatus` because no strict validator exists on the actual runtime path.
- Mutation tools are available directly in the OpenAI function-calling loop without persistent confirmation token consumption.
- `select_outlet` mutates cart/chat state directly, rather than proposal/confirmation flow.
- `add_cart_item` writes cart line snapshots directly and calculates total in the AI service, bypassing `cart.service.addItem()`.

Maps:

- AISG-R5, AISG-R7, AISG-R8, AISG-R17-R24.
- Follow-up tasks: AISG-T003, AISG-T012, AISG-T014-AISG-T021, AISG-T036-AISG-T039.

### Domain Tool Catalog In `server/src/ai/tools/domain-tools.js`

Registered definitions include:

- `search_products`
- `get_product_details`
- `get_outlets`
- `select_outlet`
- `add_cart_item`
- `get_active_cart`
- `create_order`
- `get_order_status`
- `get_payment_status`
- `get_payment_methods`
- `create_payment_link`
- `report_complaint`
- `find_nearest_outlet`
- `handover_to_human`

Findings:

- Definitions include `permission`, `confirmation`, `mutation`, `idempotent`, and `timeoutMs`, but no version, action class, allowed agent modes, allowed domains, state freshness policy, strict unknown-field rejection policy, or handler binding metadata as required by AISG-R20-R22.
- `FORBIDDEN_TOOLS` includes `mark_payment_paid`, `mark_order_paid`, and `set_payment_status`, but this is only a set declaration; the audit did not prove all runtime paths enforce it before mutation.
- `create_order` and `create_payment_link` exist as mutation tools and need later classification under proposal/confirmed flow.
- `handover_to_human` is marked `mutation: true` with `confirmation: none`; this may be acceptable as a human handoff action but requires policy classification.

Maps:

- AISG-R6-R8, AISG-R20-R24.
- Follow-up tasks: AISG-T002, AISG-T014-AISG-T018, AISG-T076.

### Memory Tools In `server/src/ai/tools/memory-tools.js`

Findings:

- Memory write tools exist with `confirmation: customer` and `mutation: true`.
- They are outside commerce/payment authority but still need versioned registry, strict schemas, tenant context, and result normalization in AISG gateway work.

Maps:

- AISG-R17-R24.
- Follow-up tasks: AISG-T014-AISG-T018.

## Direct Repository Calls From AI Paths

### `server/src/services/ai.service.js`

Direct or dynamic repository access observed:

| Line area | Repository call | Effect | Risk |
|---|---|---|---|
| prompt context | `productsSupabaseRepository.findProducts()` | Read official active products context | Medium: prompt/RAG path should occur after scope guard. |
| prompt context | `outletsSupabaseRepository.list()` | Read outlet context | Medium: prompt/RAG path should occur after scope guard and tenant validation. |
| tool executor | dynamic import from `../db/repositories/index.js` | Enables repository access inside AI service | High: bypasses centralized gateway/service boundary. |
| `get_outlets` | `outletsSupabaseRepository.list()` | Read | Medium: not gateway-normalized. |
| `search_products` | `productsRepository.search()` | Read | Medium: active/customer-visible/outlet-aware constraints not proven. |
| `select_outlet` | `outletsSupabaseRepository.findById()` | Read outlet | Medium: active/orderable/channel assignment not proven. |
| `select_outlet` | `cartsRepository.upsertByContact()` | Cart mutation | High: direct mutation from AI. |
| `select_outlet` | `chatsSupabaseRepository.setCurrentOutlet()` | Conversation state mutation | High: selected outlet can be set without AISG confirmation guard. |
| `add_cart_item` | `cartsRepository.findActiveByContact()` | Cart read | Medium. |
| `add_cart_item` | `productsRepository.findById()` | Product read | Medium: no canonical availability/effective pricing guarantee in this executor. |
| `add_cart_item` | `cartsRepository.addItem()` | Cart mutation | High: bypasses canonical `cart.service.addItem()`. |
| `add_cart_item` | `cartsRepository.update()` | Cart total mutation | High: AI path calculates/updates total directly. |
| escalation | `chatsSupabaseRepository.update({ is_escalated: true })` | Conversation mutation | Medium: support mutation, should still go through policy/action classification. |

Maps:

- AISG-R17-R19, AISG-R23-R24.
- Follow-up tasks: AISG-T003, AISG-T014-AISG-T021, AISG-T036-AISG-T037.

### `server/src/ai/orchestration/orchestrator.js`

Direct repository and service access observed:

| Tool branch | Calls | Effect | Risk |
|---|---|---|---|
| `search_products` | `productsRepository.search()` | Read products | Medium: not strict active/outlet-aware in this path. |
| `get_outlets` | `outletsSupabaseRepository.list()` | Read outlets | Medium: not scoped by orderability/channel policy. |
| `select_outlet` | `outletsSupabaseRepository.findById()`, `cartsRepository.upsertByContact()`, `chatsSupabaseRepository.setCurrentOutlet()` | Outlet/cart/chat mutation | High. |
| `add_cart_item` | `cartsRepository.findActiveByContact()`, `productsRepository.findById()`, `cartsRepository.addItem()`, `cartsRepository.update()` | Cart mutation and total update | High. |
| `get_active_cart` | `cartsRepository.findActiveByContact()` | Read cart | Medium. |
| `create_order` | `createCheckout()`, `confirmCheckout()`, `createOrderFromCheckout()`, payment service calls, `checkoutsRepository.updateStatus()` | Checkout/order/payment mutation | High: natural-language tool can create checkout/order/payment without AISG confirmation token/policy. |

Findings:

- `createOrchestrator()` instantiates `createToolGateway()`, but actual tool execution is a local switch statement and still reaches repositories/services directly.
- `create_order` includes dynamic imports of checkout/order/payment services and repository access to `checkoutsRepository`.
- This path is not proven wired from current Telegram/Meta webhooks, but it is a repository-resident AI path and must be covered by architecture tests.

Maps:

- AISG-R17-R24, AISG-R60-R61.
- Follow-up tasks: AISG-T003, AISG-T014-AISG-T021, AISG-T046-AISG-T051.

## Legacy Order Paths

### `FILE_ORDER_JSON` In Gemini Fallback

`server/src/services/ai.service.js` still instructs Gemini sales-form flows to emit `FILE_ORDER_JSON:` and parses it after model response.

Observed flow:

```text
Gemini reply contains FILE_ORDER_JSON
→ parse JSON from model output
→ executeAIAction(actionType='create_legacy_order')
→ createOrderFromAI({ chat, agent, orderData, paymentProofUrl })
→ ordersRepository.create(...)
```

Findings:

- `create_legacy_order` is still listed in `ALLOWED_AI_ACTIONS` in `server/src/services/ai-actions.service.js`.
- `createOrderFromAI()` creates an order from model-provided form data without the canonical cart-checkout-order path.
- Payment proof extraction from recent message attachments can set initial legacy payment status to `pending`, but not `paid`.
- This is explicitly disallowed for ecommerce commerce mode by AISG-R60-R61, but should be removed in a later task, not AISG-T001.

Maps:

- AISG-R5-R8, AISG-R18-R19, AISG-R60-R61.
- Follow-up tasks: AISG-T051, AISG-T082.

### Button-Based Commerce Path

`server/src/services/telegram-commerce.service.js` uses callback/button flows:

- add item calls `cart.service.addItem()`.
- checkout start calls `checkout.service.createCheckout()`.
- checkout confirm calls `checkout.service.confirmCheckout()` and `order.service.createOrderFromCheckout()`.
- payment link creation calls payment services.

Findings:

- This path is safer than AI natural-language tool execution and should be preserved.
- There is still a timestamp-based Telegram checkout idempotency key: `tg_checkout_${chat.id}_${Date.now()}`.
- Payment link failure currently logs and silently falls back to manual payment in the button flow.
- Those concerns map to later checkout/payment tasks and are not to be changed in AISG-T001.

Maps:

- Preserve for AISG-T004 and AISG-R84.
- Follow-up tasks: AISG-T047, AISG-T055.

## Payment Mutation Paths

Authority paths that set payment/order paid:

| File | Path | Authority type | Notes |
|---|---|---|---|
| `payment-webhook.service.js` | provider webhook processors | Verified provider event path | Multiple provider branches set payment/order paid after provider verification and amount/currency checks depending on provider. |
| `payment.service.js` | provider sync / `processPaidPayment()` | Server-side provider refresh/reconciliation | Can set payment/order paid after adapter result. |
| `payment-reconciliation.service.js` | `retryPaymentProcessing()` / reconciliation helper | Reconciliation | Can set payment/order paid after provider adapter returns paid. |
| `payment-reconciliation.worker.js` | pending payment scan | Worker reconciliation | Direct Supabase client updates payment/order paid after provider result. |

AI-facing payment-related tools/actions:

- `get_payment_status`: read-only catalog tool.
- `get_payment_methods`: read-only catalog tool.
- `create_payment_link`: mutation catalog tool requiring customer confirmation in metadata, but actual AISG persistent confirmation is not present.
- Forbidden set contains `mark_payment_paid`, `mark_order_paid`, `set_payment_status`.
- Restricted AI actions include `mark_payment_paid`, `mark_order_paid`, `set_order_paid`, `override_payment_status`, `approve_manual_payment`, `refund_payment`.

Findings:

- No audited AI tool named `mark_payment_paid` was found as an active catalog tool.
- Restricted action validation exists in `ai-actions.service.js`, but gateway-level deterministic restricted-action policy is not yet proven across all AI tool paths.
- Payment paid transitions exist in provider webhook/reconciliation paths, which is expected authority, but AISG-T054 must prove AI/frontend/prompt cannot reach those mutation services as paid authority.
- `create_payment_link` and order creation paths in `orchestrator.js` can initiate payment sessions and should be restricted to proposal/confirmed flow.

Maps:

- AISG-R6-R8, AISG-R62-R66.
- Follow-up tasks: AISG-T016, AISG-T052-AISG-T055, AISG-T076.

## Human Takeover And Scope Baseline

Findings:

- Telegram webhook checks `chat.takenOverByUserId || chat.takeoverBy` before AI reply.
- Meta/WhatsApp webhook checks the same before AI reply.
- `human-takeover.service.js` provides `isTakeoverActive()` and `assertNoActiveTakeover()`.
- AI context builders add takeover notes, but the primary enforcement is in route/webhook code, not an AISG gateway/context guard.
- No deterministic business-domain out-of-scope pipeline was found before Q&A/RAG/prompt construction in `generateAIReply()`.
- `generateAIReply()` may load knowledge/Q&A/product/outlet context before any AISG domain scope guard.

Maps:

- AISG-R1-R4.
- Follow-up tasks: AISG-T006-AISG-T008.

## Tool Gateway And Confirmation Baseline

Findings:

- `server/src/ai/tools/tool-gateway.js` is a minimal allowlist/readonly validator.
- It is not versioned, not mode/domain aware, not deny-by-default for missing policy versions, and does not enforce strict schema validation or safe result normalization.
- `server/src/ai/tools/confirmation-service.js` is in-memory and binds only chat/tool/args; it does not bind workspace, channel, state version, or normalized payload hash.
- `ai.service.js` active OpenAI inline tool loop does not use this gateway/confirmation service.
- `orchestrator.js` uses the gateway only for basic validation before local switch execution.

Maps:

- AISG-R17-R24, AISG-R29-R32.
- Follow-up tasks: AISG-T014-AISG-T025.

## Risk Summary

| Risk | Severity | Evidence | Follow-up |
|---|---:|---|---|
| Active `ai.service.js` direct cart/chat mutation | High | Inline `executeToolCall()` calls cart/chat repositories directly. | AISG-T003, AISG-T014-AISG-T021, AISG-T036. |
| Active legacy `FILE_ORDER_JSON/create_legacy_order` path | High | Gemini fallback parses model JSON and calls `createOrderFromAI()`. | AISG-T051, AISG-T082. |
| Orchestrator direct commerce mutations | High | `executeCommerceTool()` local switch mutates cart/checkout/order/payment. | AISG-T003, AISG-T014-AISG-T021, AISG-T050. |
| No strict schema/unknown-field rejection on active inline tools | High | OpenAI function args are `JSON.parse()` and used directly. | AISG-T012, AISG-T017. |
| No persistent AISG confirmation guard | High | Existing confirmation service is in-memory and not used by active inline tool loop. | AISG-T022-AISG-T025. |
| Payment paid authority exists in provider/reconciliation services but no full AI reachability proof yet | Medium | Webhook/reconciliation set paid; AI restricted action set exists but gateway proof missing. | AISG-T054, AISG-T076. |
| Button commerce payment fallback to manual | Medium | `telegram-commerce.service.js` catches payment session failure and creates manual payment. | AISG-T055. |
| Timestamp checkout idempotency in button flow | Medium | `tg_checkout_${chat.id}_${Date.now()}`. | AISG-T047. |
| Scope guard absent before RAG/tools/prompt context | Medium | `generateAIReply()` checks Q&A/context without AISG scope pipeline. | AISG-T006-AISG-T007. |

## Requirement Mapping

AISG-T001 covers audit evidence for:

- AISG-R5: agent mode authority is not explicit in active inline tools; model effectively triggers tool path.
- AISG-R6: restricted payment actions are listed but gateway reachability proof is missing.
- AISG-R7: prompts currently include behavioral rules, but runtime policy does not fully enforce all mutation authority.
- AISG-R8: unknown tools may be denied by local switch default, but missing policy/version denial is not centralized.
- AISG-R17: active AI calls do not all pass through one gateway.
- AISG-R18: AI orchestration/tool handlers still call mutation repositories directly.
- AISG-R19: persistent commerce mutations are not all routed through canonical services.
- AISG-R20-R22: current registry lacks versioned action class/mode/domain/policy metadata.
- AISG-R23: active schemas do not enforce unknown-field rejection.
- AISG-R24: result normalization is incomplete/inconsistent across active paths.

## Tests And Commands

Commands run during AISG-T001 lifecycle/audit work:

```bash
npm run specs:check
npm run specs:sync:dry
npm run specs:sync
npm run specs:check
```

Result before lifecycle fix:

- Failed because AISG spec had `status: active` while located under `specs/backlog`, had no `workflow_state`, and index was stale.

Result after lifecycle fix:

- `npm run specs:check` passed with 14 specs validated.

Runtime tests:

- Not run for AISG-T001 because this task changed lifecycle/docs/audit evidence only and intentionally did not change runtime behavior.

## Closure Decision

AISG-T001 is complete when this audit evidence is committed into the active spec folder and status/progress/current-task docs are updated. Runtime fixes are intentionally deferred to follow-up tasks to obey `.agents/agents.md` and avoid implementing multiple domains in one task.
