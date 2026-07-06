# AISG-T002 Current AI Tool Matrix

Date: 2026-07-03
Spec: `selaluteh-ai-security-guardrails`
Task: `AISG-T002 [P0]`

## Scope

Matrix of current AI tools and runtime tool paths: mode, intent, read/write class, confirmation behavior, canonical service usage, direct repository usage, and risks. This matrix describes current runtime before later AISG gateway refactors.

## Runtime Authority Summary

| Runtime surface | Source | Registry authority | Execution authority | Phase 0 status |
|---|---|---|---|---|
| OpenAI function calling in `ai.service.js` | Inline `commerceTools` | Inline local array, not versioned | Local `executeToolCall()` | Unsafe until AISG-T003 mitigation. |
| Gemini legacy sales-form flow in `ai.service.js` | Prompt marker `FILE_ORDER_JSON` | Prompt text, not tool registry | `executeAIAction(create_legacy_order)` then `createOrderFromAI()` | Unsafe for commerce; legacy path recorded. |
| AI orchestrator tool loop | `domain-tools.js` + `tool-gateway.js` | Minimal non-versioned definitions | Local `executeCommerceTool()` switch | Unsafe until AISG-T003 mitigation. |
| Domain tool definitions | `server/src/ai/tools/domain-tools.js` | Catalog metadata only | Depends on caller | Not yet AISG-compliant registry. |
| Memory tool definitions | `server/src/ai/tools/memory-tools.js` | Catalog metadata only | Depends on caller | Requires later gateway/context enforcement. |
| Telegram button commerce | `telegram-commerce.service.js` | Button callback parser, not LLM tool | Canonical services/repositories | Safer baseline; preserve. |

## OpenAI Inline Tools In `ai.service.js`

| Tool | Mode | Intent | Read/write | Runtime confirmation | Canonical service | Direct repository use | Risk | Follow-up |
|---|---|---|---|---|---|---|---|---|
| `get_outlets` | Implicit commerce | list outlets | Read | None | No | `outletsSupabaseRepository.list()` | Medium: no versioned registry or outlet/channel policy. | AISG-T014-AISG-T018 |
| `search_products` | Implicit commerce | search menu/product | Read | None | No | `productsRepository.search()` | Medium: active/customer-visible/outlet-aware constraints not proven. | AISG-T030-AISG-T031 |
| `select_outlet` | Implicit commerce | select outlet for order | Mutation | None | No | `outletsSupabaseRepository.findById()`, `cartsRepository.upsertByContact()`, `chatsSupabaseRepository.setCurrentOutlet()` | High: selected outlet/cart state mutation without AISG confirmation. | AISG-T003, AISG-T021, AISG-T028, AISG-T034 |
| `add_cart_item` | Implicit commerce | add item to cart | Mutation | None | No | `cartsRepository.findActiveByContact()`, `productsRepository.findById()`, `cartsRepository.addItem()`, `cartsRepository.update()` | High: bypasses canonical cart service and server-side pricing policy. | AISG-T003, AISG-T021, AISG-T036-AISG-T039 |

## Domain Tool Catalog In `domain-tools.js`

| Tool | Intended mode | Intent | Read/write | Declared confirmation | Canonical service | Direct repository risk | Risk | Notes |
|---|---|---|---|---|---|---|---|---|
| `search_products` | commerce | product search | Read | none | Not bound in definition | Depends on executor | Medium | Needs active/customer-visible/outlet-aware result policy. |
| `get_product_details` | commerce | product detail | Read | none | Not bound | Depends on executor | Medium | Needs strict schema and safe normalizer. |
| `get_outlets` | commerce | outlet list | Read | none | Not bound | Depends on executor | Medium | Needs active/orderable/channel assignment policy. |
| `select_outlet` | commerce | select outlet | Mutation | customer | Not bound | High in current executors | High | Must become proposal/confirmed mutation. |
| `add_cart_item` | commerce | add item to cart | Mutation | customer | Not bound | High in current executors | High | Must use `cart.service.addItem()` only. |
| `get_active_cart` | commerce | show cart | Read | none | Not bound | Depends on executor | Low/Medium | Must be tenant/context scoped. |
| `create_order` | commerce | create order | Mutation | customer | Not bound | High in orchestrator | High | Must be disabled/replaced by canonical checkout confirmation. |
| `get_order_status` | support/commerce | order status | Read | none | Not bound | Depends on executor | Medium | Must fail closed cross-tenant. |
| `get_payment_status` | support/payment | payment status | Read | none | Not bound | Depends on executor | Medium | Read-only; no paid mutation. |
| `get_payment_methods` | payment | list methods | Read | none | Not bound | Depends on executor | Medium | Provider source must be workspace configuration. |
| `create_payment_link` | payment | create payment session | Mutation | customer | Not bound | Depends on executor | High | Must be confirmed and provider-config controlled. |
| `report_complaint` | support | create complaint | Mutation | customer | Not bound | Depends on executor | Medium | Needs support policy and audit. |
| `find_nearest_outlet` | commerce/location | recommend outlet | Read | none | Location service path | Low/Medium | Must update recommendation only, never selected outlet. |
| `handover_to_human` | support | human handoff | Mutation | none | Not bound | Depends on executor | Medium | May be safe but needs policy class `HUMAN_ONLY`/support mutation classification. |

Forbidden declarations:

| Forbidden tool | Current declaration | Gap |
|---|---|---|
| `mark_payment_paid` | `FORBIDDEN_TOOLS` set | Need gateway-level deterministic deny and regression test. |
| `mark_order_paid` | `FORBIDDEN_TOOLS` set | Need gateway-level deterministic deny and regression test. |
| `set_payment_status` | `FORBIDDEN_TOOLS` set | Need gateway-level deterministic deny and regression test. |

## Memory Tool Catalog

| Tool | Intended mode | Intent | Read/write | Declared confirmation | Risk |
|---|---|---|---|---|---|
| memory read tools | support/personalization | read customer memory | Read | none | Needs context scoping and result redaction. |
| memory write/correct/delete tools | support/personalization | mutate customer memory | Mutation | customer | Needs persistent confirmation and tenant-bound context. |

## Prompt/Marker-Based Actions

| Marker/action | Source | Mutation | Current guard | Risk | Follow-up |
|---|---|---:|---|---|---|
| `FILE_ORDER_JSON` | Gemini prompt in `ai.service.js` | Yes | `executeAIAction(create_legacy_order)` | High: model JSON can create non-canonical ecommerce order. | AISG-T051, AISG-T082 |
| `FILE_COMPLAINT_JSON` | OpenAI/Gemini complaint prompt handling | Yes | `executeAIAction(create_legacy_complaint)` or complaint service | Medium: support path needs policy/audit but not ecommerce order path. | AISG-T016, AISG-T063 |
| `ESCALATE_TO_HUMAN` | Gemini prompt handling | Yes | Chat escalation update | Medium: should be support policy action. | AISG-T016 |

## Canonical Service Use Matrix

| Domain action | Current safest path | AI natural-language path status | Required target |
|---|---|---|---|
| Product search | Product repository/service depending caller | Inline repository search | Registry handler with active/customer-visible/outlet-aware policy. |
| Outlet selection | Telegram button flow and outlet services | Direct cart/chat repository mutation | Proposal then confirmed select outlet through canonical service/state policy. |
| Add cart item | `cart.service.addItem()` in button flow | Direct `cartsRepository.addItem()` in AI paths | AI must call `cart.service.addItem()` only after confirmation. |
| Checkout/order | `checkout.service` + `order.service` in button flow | Orchestrator can create checkout/order/payment; Gemini can create legacy order | Canonical cart-checkout-order only, confirmed and idempotent. |
| Payment paid | Webhook/reconciliation services | No explicit AI paid tool found; proof incomplete | Paid only by verified webhook/reconciliation, with restricted-action regression. |
| Human takeover | Webhook route checks and service helper | Route-level guard, not gateway-level | Enforce before generation and tools in all channels. |

## Phase 0 Conclusion

Current AI tool metadata is descriptive but not yet an AISG-compliant versioned registry. Active natural-language commerce paths still bypass canonical gateway and confirmation boundaries. The immediate Phase 0 gate is to install architecture/security tests and preserve safe button commerce baseline before Phase 1+ implementation.
