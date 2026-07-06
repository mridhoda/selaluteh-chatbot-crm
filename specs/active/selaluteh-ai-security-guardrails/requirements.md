# Requirements — SelaluTeh AI Security Guardrails

## Purpose

Dokumen ini mendefinisikan requirement normatif untuk menutup celah utama hasil audit: jalur AI function calling yang dapat melewati canonical service, tenant context yang tidak cukup immutable, mutation tanpa confirmation yang kuat, legacy order bypass, dan race condition checkout.

Kata **SHALL** berarti wajib. **MAY** berarti opsional dan tidak boleh melemahkan P0 guardrails.

## Fastest Safe Alpha Slice

Internal alpha hanya boleh memakai subset yang sudah memiliki: strict domain scope, immutable context, Tool Gateway, canonical service-only mutation, explicit confirmation, canonical cart/checkout/order, payment authority, pickup-only fulfillment, dan test lintas tenant/channel.

## 1. Security Boundary and Business Scope

### AISG-R1 — P0

The system SHALL execute immutable input-safety checks before domain classification, retrieval, tool selection, or model-assisted mutation.

### AISG-R2 — P0

The system SHALL route out-of-scope requests to a deterministic refusal response without RAG, tools, commerce state mutation, or hidden fallback.

### AISG-R3 — P0

The business-domain scope SHALL allow only approved SelaluTeh commerce and customer-support domains, including products, outlets, cart, order, payment, pickup, complaint, and human handoff.

### AISG-R4 — P0

The system SHALL skip AI generation and AI tools while human takeover is active for the conversation.

### AISG-R5 — P0

Every agent SHALL operate in an explicit server-configured mode such as COMMERCE_CART_MODE or SUPPORT_MODE; the model SHALL NOT select or change its own mode.

### AISG-R6 — P0

Restricted actions such as marking payment paid, overriding payment state, refunding, cross-workspace access, and creating non-canonical commerce orders SHALL be denied by deterministic server policy.

### AISG-R7 — P0

Prompts and model instructions SHALL be treated as behavioral guidance only and SHALL NOT be the authority for authorization, pricing, tenant scope, payment truth, or mutation eligibility.

### AISG-R8 — P0

Unknown tools, unknown actions, missing policies, and unsupported tool versions SHALL be denied by default.

## 2. Trusted Context and Tenant Isolation

### AISG-R9 — P0

The system SHALL create an immutable AIActionContext from authenticated server state, channel connection, conversation, workspace, contact, outlet state, cart state, and inbound message.

### AISG-R10 — P0

workspaceId and channelConnectionId SHALL be resolved from trusted channel and conversation state, never from model tool arguments.

### AISG-R11 — P0

Every tool execution SHALL verify that workspace, channel connection, conversation, contact, cart, and selected outlet belong to the same tenant context.

### AISG-R12 — P0

A tool SHALL NOT accept model-supplied authority fields including workspaceId, unitPrice, effectivePrice, paymentStatus, role, permission, or arbitrary outlet scope.

### AISG-R13 — P0

Repository and service queries SHALL be scoped by workspaceId and, where applicable, channelConnectionId and allowed outlet IDs.

### AISG-R14 — P0

Cross-workspace reads and writes SHALL fail without revealing whether the foreign entity exists.

### AISG-R15 — P0

Outlet access SHALL be validated against the workspace and channel assignment before any outlet-bound mutation.

### AISG-R16 — P0

The AIActionContext SHALL be read-only during one execution and SHALL be refreshed from canonical state before each mutation.

## 3. Tool Gateway and Policy Engine

### AISG-R17 — P0

All AI tool calls SHALL pass through one AIToolGateway before reaching any application or domain service.

### AISG-R18 — P0

AI orchestration, controllers, and tool handlers SHALL NOT call repository mutation methods directly.

### AISG-R19 — P0

All persistent commerce mutations SHALL be performed through canonical application/domain services such as cart, checkout, order, payment, complaint, and outlet services.

### AISG-R20 — P0

The system SHALL maintain a versioned tool registry containing tool name, schema, allowed agent modes, action class, required context, confirmation policy, timeout, idempotency policy, and handler.

### AISG-R21 — P0

Tools SHALL be allowlisted by agent mode, classified domain, user intent, conversation state, and workspace configuration.

### AISG-R22 — P0

Tools SHALL be classified as READ_ONLY, MUTATION_PROPOSAL, MUTATION_CONFIRMED, HUMAN_ONLY, or PROHIBITED.

### AISG-R23 — P0

Tool input SHALL be validated with strict schemas that reject unknown fields, invalid IDs, malformed quantities, and unsupported enum values.

### AISG-R24 — P0

Tool results SHALL be normalized into safe, bounded, customer-safe structures before being returned to the model.

### AISG-R25 — P1

The gateway SHALL enforce per-turn tool-call limits, execution timeouts, model iteration limits, and payload-size limits.

### AISG-R26 — P1

The gateway SHALL apply rate limits and circuit breakers per workspace, connection, conversation, tool, and dependency where appropriate.

### AISG-R27 — P0

Policy denial and tool failure SHALL use stable internal error codes and safe customer-facing messages without leaking secrets or cross-tenant metadata.

## 4. Confirmation and Intent Gating

### AISG-R28 — P0

Read-only questions, price inquiries, menu browsing, hypothetical questions, and recommendation requests SHALL NOT mutate cart, outlet selection, checkout, order, payment, or complaint state.

### AISG-R29 — P0

Commerce mutations initiated through natural language SHALL first produce a server-validated proposal unless the user performed an equivalent explicit UI action.

### AISG-R30 — P0

Mutation execution SHALL require an explicit customer confirmation captured by a button, structured reply, or deterministic confirmation state.

### AISG-R31 — P0

The system SHALL store an opaque confirmation record bound to workspace, conversation, action type, normalized payload, state version, and expiration.

### AISG-R32 — P0

Confirmation tokens SHALL be single-use, time-limited, tamper-resistant, and invalid across other workspaces, conversations, actions, or payload versions.

### AISG-R33 — P0

Ambiguous product or outlet matches SHALL require customer selection before a mutation is proposed or executed.

### AISG-R34 — P0

A nearest-outlet recommendation SHALL update recommendedOutletId only and SHALL NOT update selectedOutletId without explicit customer acceptance.

### AISG-R35 — P0

Checkout confirmation SHALL summarize outlet, pickup method, canonical items, quantities, prices, discounts, and total before conversion to order.

### AISG-R36 — P1

Affirmation detection for free-text confirmation SHALL be deterministic, context-bound, and unable to confirm an unrelated or expired proposal.

## 5. Product, Outlet, Cart, and Pricing Integrity

### AISG-R37 — P0

Product search for customer-facing commerce SHALL return only active, non-archived, customer-visible products.

### AISG-R38 — P0

When an outlet is selected, product search SHALL be outlet-scoped and SHALL return canonical effective outlet pricing and availability.

### AISG-R39 — P1

Before outlet selection, the system MAY allow catalog browsing but SHALL mark results as requiring outlet selection and SHALL block cart mutation.

### AISG-R40 — P1

Before claiming a requested product is unavailable, the system SHALL use the canonical product search tool rather than relying only on a limited prompt context.

### AISG-R41 — P0

Outlet selection SHALL require an active, non-archived, orderable, pickup-enabled outlet belonging to the workspace and allowed channel assignment.

### AISG-R42 — P0

The availability model SHALL be explicit-allow and default-deny for outlet commerce unless a separately approved workspace policy states otherwise.

### AISG-R43 — P0

Missing availability records SHALL be treated as unavailable, and availability lookup failures SHALL fail closed with a distinct technical error.

### AISG-R44 — P0

The add_cart_item tool SHALL call cartService.addItem or its canonical equivalent and SHALL NOT call cartsRepository.addItem directly.

### AISG-R45 — P0

Unit price, effective price, modifier price, discount, subtotal, tax, fee, and total SHALL be calculated or verified server-side from canonical data.

### AISG-R46 — P0

Line-item quantity SHALL be an integer of at least one and no greater than the effective workspace, product, stock, and channel limits.

### AISG-R47 — P1

The system SHALL reject absurd or invalid quantities and request clarification rather than silently clamping customer input.

### AISG-R48 — P0

Duplicate equivalent cart lines SHALL merge deterministically according to canonical product, variant, modifier, note, and pricing identity.

### AISG-R49 — P1

Variants SHALL be referenced by canonical IDs and validated as active, product-owned, outlet-available, and selection-rule compliant.

### AISG-R50 — P1

Price-affecting modifiers SHALL be referenced by canonical IDs and validated for ownership, availability, combination rules, limits, and price.

### AISG-R51 — P1

Free-text preparation instructions SHALL be stored as customer notes and SHALL NOT alter price or impersonate canonical variants or modifiers.

### AISG-R52 — P0

An active cart SHALL contain items for exactly one selected outlet, and outlet changes SHALL require explicit cart handling according to policy.

### AISG-R53 — P1

Promotions and discounts SHALL come only from the canonical promotion and pricing services; the model SHALL NOT invent eligibility or discount amounts.

### AISG-R54 — P0

Recommended outlet, selected outlet, cart, confirmation, and checkout state SHALL have centralized freshness and expiration rules enforced before mutation.

### AISG-R55 — P1

When a customer requests checkout and an active non-empty cart already exists, the system SHALL expose the canonical checkout action even if no item was added in the current turn.

## 6. Checkout, Order, Payment, and Fulfillment

### AISG-R56 — P0

Checkout creation SHALL require a fresh, non-empty, canonical cart with matching selected outlet and revalidated products, availability, price, and stock.

### AISG-R57 — P0

Checkout idempotency keys SHALL be stable for the active cart and cart version and SHALL NOT be based solely on timestamps.

### AISG-R58 — P0

Checkout confirmation SHALL atomically claim the pending checkout before creating an order.

### AISG-R59 — P0

The database SHALL enforce at most one canonical order per checkout through a unique constraint or equivalent invariant.

### AISG-R60 — P0

Commerce order creation SHALL use only the canonical cart-to-checkout-to-order path for ecommerce agent modes.

### AISG-R61 — P0

FILE_ORDER_JSON and create_legacy_order SHALL be unavailable to COMMERCE_CART_MODE and removed from its prompt, registry, and allowlist.

### AISG-R62 — P0

Payment provider selection SHALL come from explicit workspace configuration and SHALL not be inferred by the model.

### AISG-R63 — P1

The payment adapter SHALL validate configured currency, minimum amount, maximum amount, expiry, and provider-specific constraints before creating a session.

### AISG-R64 — P1

Payment records SHALL preserve requested amount, provider payable amount, provider adjustment amount, currency, and provider reference.

### AISG-R65 — P0

PAID status SHALL be established only by verified provider webhook or reconciliation, never by AI, frontend claims, prompt instructions, or unverified callback data.

### AISG-R66 — P0

Failure to create an expected online payment session SHALL be visible and recoverable and SHALL NOT silently downgrade to manual payment without an explicit approved policy and customer confirmation.

### AISG-R67 — P0

The MVP fulfillment method SHALL be PICKUP, with selected outlet explicitly shown and confirmed before checkout.

### AISG-R68 — P1

Delivery requests SHALL be clarified as unsupported for the pickup-only MVP and SHALL NOT store a shared location as a delivery address.

### AISG-R69 — P1

When complaint and new-order intents coexist, the system SHALL acknowledge the complaint and ask whether the customer also wants a separate new order before mutating commerce state.

## 7. Reliability and Safe Failure

### AISG-R70 — P0

Every mutation tool execution SHALL have an idempotency key derived from canonical action context and state version.

### AISG-R71 — P0

Retries, duplicate webhook deliveries, duplicate button taps, and concurrent model/tool attempts SHALL NOT create duplicate cart effects, checkouts, orders, payments, complaints, or outbound confirmations.

### AISG-R72 — P0

Dependency failures in product, outlet, availability, pricing, inventory, checkout, order, or payment validation SHALL fail closed for mutation.

### AISG-R73 — P1

The system SHALL not silently switch to a different tool, outlet, product, payment method, connection, or legacy flow after a policy or dependency failure.

### AISG-R74 — P1

Customer-facing failure messages SHALL explain the next safe action while internal diagnostics retain the stable error code and correlation ID.

## 8. Audit, Observability, Testing, and Rollout

### AISG-R75 — P1

The system SHALL persist an audit record for every proposed, denied, confirmed, executed, failed, retried, and completed AI tool action.

### AISG-R76 — P1

Policy decisions SHALL record tool name, policy version, workspace, conversation, action class, decision, reason code, and correlation ID without storing secrets.

### AISG-R77 — P0

Logs, traces, prompts, tool payloads, and errors SHALL redact bot tokens, API keys, payment secrets, confirmation secrets, authentication tokens, and unnecessary personal data.

### AISG-R78 — P1

Metrics SHALL cover scope denials, tool proposals, confirmations, policy denials, tool failures, latency, retries, duplicate prevention, checkout races, and cross-tenant denials.

### AISG-R79 — P1

Alerts SHALL exist for restricted-action attempts, cross-tenant attempts, legacy path usage, repeated confirmation failures, duplicate-order prevention events, payment authority violations, and abnormal tool failure rates.

### AISG-R80 — P2

Security and tool-execution audit records SHALL follow documented retention, privacy, and deletion rules.

### AISG-R81 — P0

Unit tests SHALL cover scope policy, restricted actions, context construction, schema validation, confirmation validation, pricing authority, quantity rules, and error mapping.

### AISG-R82 — P0

Service and repository tests SHALL prove canonical mutation paths, outlet availability enforcement, cart invariants, checkout atomicity, and unique order-per-checkout behavior.

### AISG-R83 — P0

Integration tests SHALL cover complete proposal-confirm-execute flows and prove that direct repository mutation paths are unreachable from AI tools.

### AISG-R84 — P0

End-to-end tests SHALL cover Telegram and WhatsApp inbound conversations, buttons, human takeover, outlet selection, cart, checkout, payment-session failure, and pickup confirmation.

### AISG-R85 — P0

Cross-tenant tests SHALL prove that workspace, connection, conversation, outlet, product, cart, confirmation, order, and payment references cannot cross tenant boundaries.

### AISG-R86 — P0

Adversarial evaluations SHALL include prompt injection, restricted payment actions, forged price, forged outlet, direct-order bypass, excessive quantity, fake confirmation, tool-name injection, and out-of-scope requests.

### AISG-R87 — P0

Concurrency tests SHALL cover duplicate confirmations, parallel checkout confirmation, duplicate webhooks, duplicate tool calls, and worker retries.

### AISG-R88 — P1

Migration SHALL be additive and feature-flagged, preserve existing canonical chat and commerce behavior, and provide tested rollback without re-enabling unsafe global fallbacks.

### AISG-R89 — P1

Architecture docs, security runbooks, tool registry documentation, error catalog, evaluation dataset, and incident response procedures SHALL be updated before production rollout.

### AISG-R90 — P0

The fastest safe alpha slice SHALL not exit internal alpha until all P0 requirements and their automated tests pass, direct AI repository mutations are removed, legacy commerce order creation is disabled, and two-channel commerce E2E succeeds.
