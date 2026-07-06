# Design — SelaluTeh AI Security Guardrails

## 1. Executive Summary

Audit menemukan bahwa jalur tombol commerce relatif aman karena menggunakan service canonical, tetapi jalur AI function calling dapat langsung memanggil repository. Akibatnya model berpotensi melewati validasi produk aktif, outlet availability, harga outlet, single-outlet cart, merge item, quantity, checkout, dan order lifecycle.

Desain target mengubah batas kepercayaan menjadi:

```text
Inbound Channel
→ Tenant/Conversation Resolver
→ Human Takeover Guard
→ Input Safety
→ Business Domain Scope Guard
→ Intent Router
→ AI Response or Action Proposal
→ AIToolGateway
   → Tool Registry
   → Policy Engine
   → Immutable Action Context
   → Schema Validation
   → State Freshness
   → Confirmation Guard
   → Idempotency Guard
   → Limits / Timeout / Circuit Breaker
→ Canonical Application Service
→ Repository / Database / Provider Adapter
→ Safe Result Normalizer
→ Conversational Response
```

Prinsip utama:

```text
LLM = proposal and language layer
Policy Engine = deterministic permission
Canonical Service = business authority
Repository = persistence only
```

## 2. Trust Boundaries

### 2.1 Untrusted inputs

- customer message;
- model output;
- tool arguments;
- callback data;
- shared location metadata;
- client-provided price or payment status;
- prompt content and retrieved documents.

### 2.2 Trusted server context

- workspace from channel connection and conversation;
- authenticated workspace membership for admin/human actions;
- channelConnectionId;
- conversationId and contact identity;
- selected and recommended outlet state;
- canonical cart and cart version;
- payment provider configuration;
- agent mode and tool policy version.

### 2.3 Authority matrix

| Decision | Authority |
|---|---|
| Allowed business domain | Immutable scope policy |
| Tool availability | Tool registry + policy engine |
| Workspace/connection | Server-generated context |
| Outlet orderability | Outlet service |
| Product availability | Catalog/availability service |
| Price and discount | Pricing/promo service |
| Cart mutation | Cart service |
| Checkout conversion | Checkout service + DB transaction |
| Order lifecycle | Order service |
| Payment PAID | Verified webhook/reconciliation |
| Human takeover | Conversation/handoff service |

## 3. Module Architecture

Recommended structure, adapted to actual repository layout:

```text
server/src/modules/ai-security/
├── domain/
│   ├── action-class.ts
│   ├── agent-mode.ts
│   ├── policy-decision.ts
│   ├── security-errors.ts
│   └── confirmation-status.ts
├── application/
│   ├── build-ai-action-context.ts
│   ├── evaluate-domain-scope.ts
│   ├── execute-ai-tool.ts
│   ├── propose-ai-action.ts
│   ├── confirm-ai-action.ts
│   └── expire-commerce-state.ts
├── infrastructure/
│   ├── ai-tool-gateway.ts
│   ├── ai-tool-registry.ts
│   ├── ai-policy-engine.ts
│   ├── confirmation.repository.ts
│   ├── tool-execution.repository.ts
│   └── policy-decision.repository.ts
└── handlers/
    ├── search-products.handler.ts
    ├── select-outlet.handler.ts
    ├── add-cart-item.handler.ts
    ├── start-checkout.handler.ts
    ├── confirm-checkout.handler.ts
    └── create-complaint.handler.ts
```

`ai.service` becomes an orchestrator. It SHALL NOT import mutation repositories.

## 4. Immutable AIActionContext

```ts
type AIActionContext = Readonly<{
  workspaceId: string;
  channelConnectionId: string;
  conversationId: string;
  contactId: string | null;
  inboundMessageId: string;

  agentId: string;
  agentMode: "COMMERCE_CART_MODE" | "SUPPORT_MODE";
  policyVersion: string;

  takeoverActive: boolean;

  recommendedOutletId: string | null;
  recommendedOutletVersion: number | null;
  selectedOutletId: string | null;
  selectedOutletAt: string | null;

  activeCartId: string | null;
  cartVersion: number | null;
  activeCheckoutId: string | null;

  channel: "TELEGRAM" | "WHATSAPP";
}>;
```

Context builder loads canonical state and verifies all relations. Tool arguments never replace these values.

## 5. Tool Registry

```ts
type ToolDefinition = {
  name: string;
  version: number;
  actionClass:
    | "READ_ONLY"
    | "MUTATION_PROPOSAL"
    | "MUTATION_CONFIRMED"
    | "HUMAN_ONLY"
    | "PROHIBITED";

  allowedAgentModes: string[];
  allowedDomains: string[];
  inputSchema: unknown;

  requiresSelectedOutlet: boolean;
  requiresFreshCart: boolean;
  confirmation:
    | "NONE"
    | "CUSTOMER_BOUND"
    | "HUMAN_APPROVAL";

  timeoutMs: number;
  maxCallsPerTurn: number;
  idempotencyPolicy: string;
  handler: string;
};
```

Unknown tools and missing registry entries are denied.

Example classification:

| Tool | Class | Confirmation |
|---|---|---|
| search_products | READ_ONLY | NONE |
| get_outlets | READ_ONLY | NONE |
| recommend_outlet | READ_ONLY | NONE |
| propose_select_outlet | MUTATION_PROPOSAL | CUSTOMER_BOUND |
| select_outlet | MUTATION_CONFIRMED | CUSTOMER_BOUND |
| propose_add_cart_item | MUTATION_PROPOSAL | CUSTOMER_BOUND |
| add_cart_item | MUTATION_CONFIRMED | CUSTOMER_BOUND |
| start_checkout | MUTATION_PROPOSAL | CUSTOMER_BOUND |
| confirm_checkout | MUTATION_CONFIRMED | CUSTOMER_BOUND |
| mark_payment_paid | PROHIBITED | never |
| create_legacy_order | PROHIBITED in commerce | never |

## 6. Tool Gateway Pipeline

```ts
async function executeTool(request: ToolExecutionRequest) {
  const definition = registry.require(request.toolName);
  const context = await contextBuilder.build(request);

  scopeGuard.requireAllowed(request.domain);
  policy.requireToolAllowed(definition, context, request.intent);
  schemaValidator.parse(definition.inputSchema, request.arguments);

  await stateFreshnessGuard.requireFresh(definition, context);
  await tenantGuard.requireConsistent(context, request.arguments);
  await confirmationGuard.requireIfNeeded(definition, request, context);
  await idempotencyGuard.claim(request, context);

  return limits.run(definition, async () => {
    const raw = await handler.execute({
      context,
      input: request.arguments,
    });
    return resultNormalizer.normalize(definition, raw);
  });
}
```

## 7. Confirmation Architecture

Natural-language mutation is two-phase:

```text
User intent
→ resolve canonical entities
→ create proposal
→ render summary/buttons
→ customer confirms
→ consume confirmation token
→ execute canonical service once
```

### 7.1 Data model

```sql
create table ai_action_confirmations (
  id uuid primary key,
  token_hash text not null unique,

  workspace_id uuid not null,
  channel_connection_id uuid not null,
  conversation_id uuid not null,

  action_type text not null,
  normalized_payload jsonb not null,
  payload_hash text not null,

  state_version jsonb not null,
  status text not null,

  expires_at timestamptz not null,
  consumed_at timestamptz null,
  created_at timestamptz not null,
  correlation_id text not null
);
```

Statuses:

```text
PENDING
CONSUMED
EXPIRED
CANCELLED
INVALIDATED
```

The token is opaque. Only its hash is persisted.

### 7.2 State binding

A confirmation can be consumed only when:

- workspace, connection, and conversation match;
- action type matches;
- normalized payload hash matches;
- cart/outlet/recommendation state version remains valid;
- token is pending and not expired;
- atomic consume succeeds.

## 8. Scope Guard

Pipeline:

```text
input safety
→ domain classifier
→ allowed?
   no: fixed refusal, no RAG, no tools
   yes: intent router
```

Allowed domains:

- greetings directly related to service;
- brand/outlet/product information;
- prices and official promotions from tools;
- cart, order, checkout, payment, pickup;
- order status;
- complaints, tickets, refund policy;
- customer service and human handoff.

Rejected domains:

- coding;
- school assignments;
- general knowledge unrelated to SelaluTeh;
- politics/news;
- medical/legal/investment advice;
- unrestricted roleplay;
- tools outside commerce/support.

## 9. Canonical Commerce Flow

```text
Search Product
→ Select Outlet
→ Add to Cart
→ Create Checkout
→ Confirm Checkout
→ Create Order
→ Create Payment Session
→ Verified Payment Webhook
→ Outlet Approval
→ Preparing
→ Ready
→ Picked Up / Completed
```

No ecommerce order may be created through `FILE_ORDER_JSON`.

## 10. Product Search and Ambiguity

Search results return:

```ts
type ProductSearchResult = {
  productId: string;
  name: string;
  match:
    | "EXACT"
    | "HIGH_CONFIDENCE"
    | "AMBIGUOUS"
    | "NO_MATCH";

  selectedOutletId: string | null;
  availability:
    | "AVAILABLE"
    | "OUTLET_REQUIRED"
    | "UNAVAILABLE";

  effectivePriceMinor: number | null;
  canAddToCart: boolean;
};
```

Policy:

```text
EXACT → proposal allowed
HIGH_CONFIDENCE → confirm full item name
AMBIGUOUS → customer must choose
NO_MATCH → no invention
```

## 11. Outlet State

Conversation commerce state separates:

```ts
type OutletState = {
  recommendedOutletId: string | null;
  recommendedOutletVersion: number;
  recommendedAt: string | null;

  selectedOutletId: string | null;
  selectedAt: string | null;
};
```

Shared location may update recommendation, not selection.

Outlet validation:

- same workspace;
- active and not archived;
- pickup/order enabled;
- permitted channel assignment;
- customer-facing.

## 12. Cart Integrity

`add_cart_item` calls only:

```ts
cartService.addItem({
  workspaceId: context.workspaceId,
  cartId: context.activeCartId,
  outletId: context.selectedOutletId,
  productId: input.productId,
  variantId: input.variantId,
  modifierIds: input.modifierIds,
  note: input.note,
  quantity: input.quantity,
  idempotencyKey,
});
```

The cart service:

1. validates fresh cart and selected outlet;
2. validates active product;
3. validates explicit outlet availability;
4. validates variant/modifier IDs;
5. resolves effective server-side price;
6. validates quantity and stock policy;
7. merges an equivalent line deterministically;
8. recalculates totals;
9. increments cart version;
10. writes an audit/outbox event.

## 13. Availability Semantics

Alpha uses:

```text
product active
+ outlet active
+ explicit availability enabled
= sellable
```

Missing row:

```text
PRODUCT_NOT_AVAILABLE_AT_OUTLET
```

Lookup/dependency failure:

```text
AVAILABILITY_CHECK_FAILED
```

Both block mutation, but remain distinguishable in diagnostics.

## 14. Checkout and Concurrency

Stable idempotency:

```text
checkout:{workspaceId}:{cartId}:{cartVersion}
```

Atomic confirmation:

```sql
begin;

update checkouts
set status = 'CONFIRMING'
where id = :checkout_id
  and workspace_id = :workspace_id
  and status = 'PENDING';

-- affected rows must equal one

insert into orders (..., checkout_id)
values (..., :checkout_id);

update checkouts
set status = 'CONVERTED',
    order_id = :order_id
where id = :checkout_id;

commit;
```

Database invariant:

```sql
create unique index uq_orders_checkout_id
on orders(checkout_id)
where checkout_id is not null;
```

## 15. Payment Boundary

The model cannot set payment authority.

```text
Payment session request
→ configured provider adapter
→ requested amount
→ provider payable amount
→ provider reference
→ verified webhook/reconciliation
→ PAID
```

Store:

```ts
type PaymentAmountSnapshot = {
  requestedAmountMinor: number;
  providerPayableAmountMinor: number;
  providerAdjustmentAmountMinor: number;
  currency: string;
};
```

Provider failure must not silently become manual payment unless an approved workspace policy and explicit customer confirmation exist.

## 16. Pickup-Only Alpha

Checkout summary must explicitly say:

```text
Pickup at <selected outlet>
```

Shared location is used only to recommend an outlet. Delivery address capture is outside alpha scope.

## 17. Reliability Controls

- one in-flight mutation per confirmation token;
- stable idempotency keys;
- bounded retries;
- dependency-specific timeout;
- circuit breakers for provider failures;
- no silent tool/provider fallback;
- dead-letter/replay for asynchronous processing;
- all effects remain idempotent.

## 18. Audit Data

### 18.1 Tool executions

```sql
create table ai_tool_executions (
  id uuid primary key,
  workspace_id uuid not null,
  channel_connection_id uuid not null,
  conversation_id uuid not null,

  tool_name text not null,
  tool_version integer not null,
  action_class text not null,

  status text not null,
  idempotency_key text null,
  confirmation_id uuid null,

  input_digest text not null,
  safe_result jsonb null,
  error_code text null,

  started_at timestamptz not null,
  finished_at timestamptz null,
  correlation_id text not null
);
```

### 18.2 Policy decisions

```sql
create table ai_policy_decisions (
  id uuid primary key,
  workspace_id uuid not null,
  conversation_id uuid not null,
  tool_name text null,
  policy_version text not null,
  decision text not null,
  reason_code text not null,
  created_at timestamptz not null,
  correlation_id text not null
);
```

Never store plaintext secrets or unrestricted prompt payloads.

## 19. Error Catalog

Core codes:

```text
AI_SCOPE_OUT_OF_DOMAIN
AI_TOOL_UNKNOWN
AI_TOOL_NOT_ALLOWED
AI_TOOL_SCHEMA_INVALID
AI_CONTEXT_INVALID
AI_CONTEXT_TENANT_MISMATCH
AI_ACTION_CONFIRMATION_REQUIRED
AI_CONFIRMATION_EXPIRED
AI_CONFIRMATION_ALREADY_USED
AI_CONFIRMATION_STATE_CHANGED
AI_RESTRICTED_ACTION
OUTLET_SELECTION_REQUIRED
OUTLET_NOT_ORDERABLE
PRODUCT_AMBIGUOUS
PRODUCT_NOT_ACTIVE
PRODUCT_NOT_AVAILABLE_AT_OUTLET
AVAILABILITY_CHECK_FAILED
QUANTITY_INVALID
VARIANT_INVALID
MODIFIER_INVALID
CART_STATE_STALE
CHECKOUT_ALREADY_CLAIMED
ORDER_ALREADY_CREATED_FOR_CHECKOUT
PAYMENT_PROVIDER_UNAVAILABLE
PAYMENT_AUTHORITY_VIOLATION
LEGACY_COMMERCE_ORDER_DISABLED
```

## 20. Observability

Metrics:

```text
ai_scope_denied_total
ai_tool_proposed_total
ai_confirmation_created_total
ai_confirmation_consumed_total
ai_confirmation_rejected_total
ai_policy_denied_total
ai_tool_execution_total
ai_tool_execution_failed_total
ai_tool_latency_ms
ai_duplicate_effect_prevented_total
ai_checkout_race_prevented_total
ai_cross_tenant_denied_total
ai_restricted_action_attempt_total
ai_legacy_path_attempt_total
```

Alerts target security events, not customer text.

## 21. Migration Strategy

### Phase A — Inventory and freeze

- inventory all tool definitions and direct repository calls;
- freeze new AI mutation tools;
- identify legacy order prompt/tool paths;
- create regression baseline.

### Phase B — Additive infrastructure

- add Tool Gateway and registry;
- add immutable context builder;
- add confirmation and execution tables;
- add policy and audit records;
- keep existing safe button flow working.

### Phase C — Canonicalize tools

- migrate `add_cart_item`;
- migrate `select_outlet`;
- migrate checkout;
- remove direct repository mutation imports;
- disable `FILE_ORDER_JSON` for commerce.

### Phase D — Enforce and test

- enable deny-by-default in shadow mode;
- compare policy decisions;
- enable feature flag per workspace/channel;
- run two-channel E2E and adversarial suite.

### Phase E — Remove unsafe compatibility

- delete direct mutation path;
- delete ecommerce legacy prompt/tool;
- make guardrails mandatory;
- retain rollback to previous canonical button flow, not to unsafe repository bypass.

## 22. Feature Flags

```text
AI_TOOL_GATEWAY_ENABLED
AI_CONFIRMATION_GUARD_ENABLED
AI_CANONICAL_CART_ONLY
AI_LEGACY_COMMERCE_DISABLED
AI_OUTLET_AVAILABILITY_DEFAULT_DENY
AI_CHECKOUT_ATOMIC_CONFIRM
AI_SECURITY_AUDIT_ENABLED
```

Rollout order must preserve safe button-based commerce.

## 23. Fastest Safe Alpha Slice

Must ship:

- strict scope guard;
- Tool Gateway;
- immutable context;
- no direct repository mutations;
- canonical add-to-cart;
- selected-outlet validation;
- explicit confirmation;
- default-deny availability;
- stable checkout idempotency;
- atomic checkout-to-order;
- PAID authority;
- pickup confirmation;
- human takeover;
- tenant, concurrency, and adversarial tests.

Deferred:

- delivery;
- adaptive risk scoring;
- autonomous multi-agent tool delegation;
- advanced promo personalization;
- auto-remediation.
