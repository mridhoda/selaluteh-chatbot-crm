# QR Store Backend Audit Evidence

Updated: 2026-07-07

Scope: documentation-only Phase 4 backlog mapping. Sections `1.1` through `1.7` are based on fresh targeted inspection of runtime, tests, migrations, and API/data docs for the requested audit areas. Checkpoint `1.8` summarizes the completed audit wave. No runtime code was changed and no fresh test/spec command output is claimed for this wave.

## Authority Decision

The user explicitly approved continuing the `qr-store-backend` backlog as a follow-up/continuation and instructed to ignore the spec authority blocker. The spec remains under `specs/backlog/qr-store-backend/` unless lifecycle tooling later requires moving it to `active`.

## Capability and Gap Map

| Area | Evidence files | Baseline capabilities | Known gaps / follow-ups |
|---|---|---|---|
| Public storefront / Online Store | `server/src/routes/public-store.js`, `server/src/services/public-storefront.service.js`, `server/src/db/repositories/storefronts.supabase.repository.js` | Public store lookup, menu browsing, cart validation, checkout, payment status, public order tracking, table-backed storefront/outlet lookup, metadata fallback, active outlet selection, response hardening, phone masking, public route rate limits. | Metadata fallback/import fragility noted; public checkout remains pickup-only; no full public checkout route integration test captured. |
| QR lookup / QR Store | `server/src/services/qr-order-session.service.js`, `server/src/db/repositories/qr-order-sessions.supabase.repository.js`, `server/src/db/migrations/038_online_qr_store_schema_phase3.sql`, `039_online_qr_store_phase31_hardening.sql`, `040_online_qr_store_phase32_detail_schema.sql`, `041_online_qr_store_phase33_integrity.sql` | Active QR code lookup with legacy hashed session fallback, outlet/location metadata, token hashing, QR code/session semantic split, QR lookup can return outlet/location context. | Universal QR is limited because `qr_codes.outlet_id` is currently not null and checkout rejects outlet mismatch; service returns `outlet_locked: true`; fulfillment remains forced to pickup; no E2E QR checkout test captured. |
| Marketplace preservation | `server/src/routes/webhooks/meta.js`, `server/src/services/telegram-commerce.service.js`, `server/src/services/ai.service.js`, `server/test/e2e/telegram-marketplace.e2e.test.js`, `server/test/e2e/ai/button-commerce-regression.test.js`, `server/test/integration/checkout-flow.test.js` | WhatsApp interactive commerce delegates shared Telegram-style actions and has cart/checkout confirm paths; Telegram commerce remains active through v1 webhook processing; AI assisted ordering uses official cart tools and legacy AI order creation fallback. | WhatsApp-specific commerce coverage is mostly contract/source-shape coverage rather than a full checkout/payment E2E; keep it green while adding deeper tests later. |
| Product availability / modifiers | `server/src/services/product.service.js`, `server/src/db/repositories/products.supabase.repository.js`, `server/src/services/cart.service.js`, `server/src/services/checkout.service.js`, `server/src/services/public-storefront.service.js` | Product service/repository filter active products, outlet availability, inventory, and outlet price overrides; public menu exposes customer-safe fields; legacy carts carry modifier payloads through snapshots. | Public cart validation and legacy cart/checkout do not fully validate modifier group/option ownership, min/max constraints, or modifier price deltas; no shared modifier validation/pricing service exists to reuse directly. |
| Checkout / payment | `server/src/services/public-storefront.service.js`, `server/src/services/order.service.js`, `server/src/services/payment.service.js`, `server/src/services/payment-webhook.service.js`, `server/src/db/repositories/orders.supabase.repository.js`, `server/src/db/repositories/payments.supabase.repository.js` | Public checkout requires idempotency key, customer name, and phone; server-side cart validation precedes side effects; creates immutable order/payment snapshots; stores idempotency response; payment session creation is provider-authoritative; BayarGG webhook validates signature, duplicate events, provider transaction, amount, currency, expiry, and moves mismatches to `manual_review`; paid transitions move fulfillment to `awaiting_acceptance`, not completed. | Public checkout idempotency remains check-then-create and race-prone; no single DB transaction across order/payment/idempotency record; order number generation is read-last/plus-one and relies on DB uniqueness; live BayarGG provider payload verification remains unproven. |
| Admin lifecycle | `server/src/routes/admin-orders.js`, `server/src/routes/orders.js`, `server/src/services/order.service.js`, `server/src/db/repositories/orders.supabase.repository.js` | List/detail scoping uses workspace/outlet query helpers; list requires outlet selection for outlet-scoped users; detail rechecks outlet access; lifecycle actions use paid-only and atomic fulfillment/status guards; cancel reason and hard-delete blocking are present. | Admin status routes still use coarse `orders.manage_status`; per-action `orders.accept`, `orders.prepare`, `orders.ready`, `orders.complete`, and `orders.cancel` permissions are not enforced. Prepare/ready/complete service guards only compare outlet when an outlet id is supplied by route caller. |
| Docs vs runtime | `docs/backend/05-api-spec/*.md`, `docs/backend/06-data/*.md`, migrations `037` through `041`, active runtime routes/services | Public storefront/order/payment docs mostly match current runtime for pickup-only public checkout, public response safety, BayarGG manual-review behavior, hard delete blocking, and data-table reconciliation. | Stale docs remain: `payments-api.md` examples still show `midtrans`; `webhooks-api.md` says raw events are stored in `webhook_events` for payment webhooks while runtime writes normalized `payment_events`; `relationships.md` still references `payment_attempts` as a payment child even current active attempts are `payments` rows; several plan/alpha docs mention per-action permissions before runtime enforces them. |

## Baseline Evidence to Preserve

- Public routes should stay thin and delegate business logic to service/repository layers.
- Existing Phase 3.x migrations `038` through `041` should not be recreated as duplicate greenfield tables.
- Existing WhatsApp, Telegram, AI-assisted commerce, cart, order, payment, and admin flows must not regress.
- Backend remains authoritative for price, totals, availability, payment paid state, fulfillment, admin permission, QR outlet/location locks, and provider webhook validity.

## 1.1 Online Store Audit

Freshly inspected on 2026-07-07 for Phase 4 task `1.1 Audit Online Store runtime paths`.

### Files Inspected

| File | Evidence |
|---|---|
| `server/src/routes/public-store.js` | Thin public route layer for Online Store and QR/public order routes. Online Store paths include `GET /stores/:storefrontSlug`, alias `GET /storefronts/:storefrontSlug`, `POST /carts/validate`, `POST /checkout`, `GET /payments/:paymentId/status`, and `GET /orders/:publicOrderToken`. Public cart, checkout, payment status, and order lookup routes use public rate-limit middleware. |
| `server/src/services/public-storefront.service.js` | Main Online Store business logic for storefront slug resolution, outlet selection, menu mapping, cart validation, checkout/idempotency, order/payment creation, and payment status response shaping. |
| `server/src/db/repositories/storefronts.supabase.repository.js` | Supabase boundary for table-backed storefront lookup, active storefront outlet mapping, and storefront/outlet availability helper. Missing storefront tables are handled as compatibility fallback by returning null/empty results. |
| `server/src/services/public-order.service.js` | Public order tracking response mapper by opaque public token, including phone masking, public-safe amount fields, payment URL gating, QR location label, and timeline. |
| `server/src/db/repositories/orders.supabase.repository.js` | `findByPublicOrderToken` performs the public token lookup with contact/outlet/order item joins. |
| `server/src/index.js` | Public store router is imported and mounted by the Express app; public routes coexist with `/api/v1` aliases and legacy public paths. |
| `server/test/unit/services/public-storefront.service.test.js` | Baseline helper tests for idempotency hash determinism, safe product mapping, backend-owned cart snapshot shape, outlet flags, non-enumerable internal storefront context, checkout metadata mapping, public order phone masking, and checkout customer name/phone validation. |
| `server/test/unit/routes/authorization-routes.test.js` | Baseline route test confirms public store routes are intentionally unauthenticated and have no admin permission middleware. |
| `docs/backend/05-api-spec/public-storefront-api.md` | Public Storefront API documentation covers versioned customer routes, backend authority rules, pickup-only alpha fulfillment, checkout requirements, public order response safety, and rate limiting. |
| `docs/backend/11-sprint/progress-log.md` / `docs/backend/11-sprint/implementation-status.md` / `docs/backend/09-ai-context/current-task.md` | Prior progress/status evidence identifies Phase 3.x Online Store route/service/test coverage and known limitations. |

### Capability Map

| Area | Current capability | Gaps / risks |
|---|---|---|
| Public storefront | `getPublicStorefront` resolves normalized active storefront slugs through `storefrontsRepository.findActiveBySlug`, loads active workspace/settings, rejects disabled ordering, and returns public `storefront`, `outlets`, and `menu` data. A non-enumerable `internal` context carries storefront/workspace IDs for service use without JSON exposure. Metadata fallback still supports older workspace/settings-based storefront data. | Target environment must have migrations/seed rows for `storefronts` and `storefront_outlets`; metadata fallback is compatibility behavior, not ideal long-term authority. Storefront response uses workspace id as public storefront id, so public contract should remain explicit about that shape. |
| Outlet selection | Public storefront loads mapped active storefront outlets when seeded, otherwise falls back to active workspace outlets. Explicit `outletId` selects that outlet; no query selection picks the first orderable outlet. Checkout/cart context rejects missing, closed, non-orderable, or non-pickup outlets. | `listActiveOutlets` filters active mappings but does not explicitly filter `is_visible`; `isOutletAvailableForStorefront` checks `is_visible` but is not used by the main public storefront/cart path. Confirm visibility semantics before wider alpha. |
| Menu browsing | Public menu is built with `listCustomerProductsForOutlet({ workspaceId, outletId, page: 0, limit: 200 })`; public product mapping exposes customer-safe fields and uses outlet price override before product base price. Categories are derived from returned products. | Menu is capped at 200 products and has no public pagination/category endpoint. Sold-out/unavailable states are simplified to `availability: 'available'` for returned products. |
| Cart validation | `validatePublicCart` defaults to `online_store`, rejects non-pickup fulfillment, resolves backend outlet context, rebuilds the outlet menu, validates product availability and integer quantity `1..99`, ignores client totals/prices, and recomputes subtotal/total from backend unit prices. Empty carts return structured invalid response plus zeroed cart snapshot. | Modifier payload is mapped but not fully validated for group ownership, option ownership, min/max rules, or modifier price deltas; all modifier deltas are currently `0`. Discounts, service fee, and tax are fixed to `0` in alpha cart snapshot. |
| Checkout | `createPublicCheckout` requires `Idempotency-Key`, `customer.name`, and `customer.phone`; revalidates the cart before side effects; builds a stable request hash; returns existing response for same key/hash; rejects same key/different hash; creates order through `createOrderFromCheckout`; creates payment through `createPaymentSessionForOrder`; stores completed idempotency response. | Idempotency is still check-then-create and race-prone under concurrent duplicate requests. Order creation, payment creation, and idempotency persistence are not wrapped in a single DB transaction. Provider/payment creation failure after order creation needs an operational retry/recovery path. |
| Payment status | `getPublicPaymentStatus` looks up payment globally, verifies linked order/public token, returns public payment fields, includes `payment_url` only for pending/processing, includes `paid_at` only when paid, and returns public order token/status. | Payment status endpoint depends on provider/webhook/reconciliation correctness, which is covered in later payment audit tasks. No fresh integration test was run in this documentation wave. |
| Public order tracking | Public route loads order by opaque public token through `getPublicOrderByToken`, masks phone numbers, exposes public-safe amount fields, includes payment URL only while unpaid/pending/processing, exposes QR location label, maps customer-facing items, and builds a timeline from lifecycle timestamps. | Repository lookup by public token is intentionally global rather than workspace-scoped because the token is the public authority; token randomness/uniqueness must remain protected by migrations/indexes and generation logic. |

### Baseline Tests

- `server/test/unit/routes/authorization-routes.test.js`: public routes registration and no admin permission middleware on `GET /stores/:storefrontSlug`, `GET /qr/:qrToken`, `POST /carts/validate`, `POST /checkout`, `GET /payments/:paymentId/status`, and `GET /orders/:publicOrderToken`.
- `server/test/unit/services/public-storefront.service.test.js`: helper-level coverage for idempotency hashing, product response safety, backend-owned cart snapshot, outlet flags, hidden internal storefront context, checkout metadata, phone masking, and checkout required customer fields.
- Prior documented command in `docs/backend/11-sprint/progress-log.md`: `NODE_ENV=test node --test "test/unit/services/public-storefront.service.test.js" "test/unit/middleware/rate-limit.test.js" "test/security/orders/cart-order-security.test.js" "test/security/payments/payment-security.test.js"` passed with 24 tests during Phase 3.4; not rerun for this task.
- Prior documented API contract baseline in `docs/backend/11-sprint/implementation-status.md` identifies route authorization, public storefront helper, order security/property/resilience, and payment targeted integration contract results; not rerun for this task.

### Audit Conclusion

- Phase 4 task `1.1` audit acceptance items are satisfied for inspection and mapping.
- Runtime paths exist for public storefront, outlet selection, menu browsing, cart validation, checkout, payment status, and public order tracking.
- Follow-up implementation should prioritize visibility semantics, full modifier validation/pricing, race-safe idempotency, transactional checkout recovery, and real seeded storefront/outlet validation.
- No runtime code was changed during this audit.

## 1.2 QR Store Runtime Audit

Freshly inspected on 2026-07-07 for Phase 4 task `1.2 Audit QR Store runtime paths`.

### Files Inspected

| File | Evidence |
|---|---|
| `server/src/services/qr-order-session.service.js` | `getQrStoreContext` resolves active static `qr_codes` first, falls back to active legacy `qr_order_sessions`, rejects missing/expired/revoked/inactive outlet records, loads outlet-scoped products, and returns a public QR Store envelope. `buildQrStoreContextResponse` exposes `qr_session.qr_code_id`, `outlet_locked: true`, outlet details, QR location context, and menu categories/products. |
| `server/src/db/repositories/qr-order-sessions.supabase.repository.js` | Uses SHA-256 token hashing only; `findActiveQrCodeByToken` reads active `qr_codes` with joined `outlets` and `qr_locations`; `findActiveByToken` reads active `qr_order_sessions` with joined outlet/QR code/location data and fallback select for optional schema compatibility. |
| `server/src/db/migrations/038_online_qr_store_schema_phase3.sql` | Adds `qr_locations`, `qr_codes`, QR session extension columns (`qr_code_id`, `qr_location_id`, `session_status`, `completed_order_id`), QR/order indexes, RLS, and service-role policies. `qr_codes.outlet_id` is `not null`, which makes every static QR code outlet-owned in the current schema. |
| `server/src/db/migrations/039_online_qr_store_phase31_hardening.sql` | Adds `qr_locations.sort_order`, `qr_codes.outlet_locked default true`, revocation/admin metadata, token/status indexes, QR session status indexes, and hardens `qr_locations.location_type` to `table`, `counter`, `pickup_area`, `takeaway_area`, and `general_store`. |
| `server/src/db/migrations/040_online_qr_store_phase32_detail_schema.sql` | No new QR runtime table replacement; continues additive detail-schema reconciliation and avoids greenfield duplicate QR/session tables. |
| `server/src/db/migrations/041_online_qr_store_phase33_integrity.sql` | Adds QR/order/product/payment indexes including `qr_codes_outlet_status_idx` and `qr_order_sessions_qr_code_created_idx`; keeps canonical runtime tables. |
| `server/test/unit/services/qr-order-session.service.test.js` | Baseline unit coverage verifies static QR code id remains separate from QR order session id, `qr_session.id` is `null` for QR-code-only context, `qr_session.qr_code_id` carries the QR code id, and `qr_context.qr_location_id` is preserved. |
| `server/test/unit/migrations/phase3-online-qr-store-schema.test.js` | Baseline migration coverage verifies additive QR/storefront tables, no duplicate `qr_sessions`/`product_availability`/`idempotency_keys`, QR hardening columns/indexes, location enum hardening, and Phase 3.3 canonical runtime indexes/constraints. |

### Universal / Outlet / Location QR Support

| QR mode | Current support | Gaps / implementation follow-up |
|---|---|---|
| Universal QR | Not fully supported as a true outlet-selectable universal QR. The current static QR table requires `qr_codes.outlet_id not null`, `getQrStoreContext` always returns one outlet id, and `buildQrStoreContextResponse` always returns `outlet_locked: true`. A `general_store` `qr_locations.location_type` exists, but it is still tied to a non-null outlet through `qr_locations.outlet_id` and `qr_codes.outlet_id`. | Add explicit universal QR semantics if required by product: nullable or separate selected/locked outlet modeling, public outlet selection path, checkout outlet validation that distinguishes universal from locked QR, and tests proving a universal QR cannot be forged to another workspace/outlet. |
| Outlet QR | Supported as the strongest current path. `qr_codes` are outlet-owned, active-token lookup joins outlet data, inactive outlets are rejected, the response is outlet-locked, and product menu lookup is scoped by `workspaceId` + `outletId`. Legacy `qr_order_sessions` also carry outlet/locked outlet fields. | Need integration coverage for complete QR context to checkout path, including rejecting client-supplied outlet mismatch and preserving `qr_code_id`/`qr_location_id` through order creation. |
| Location/Table QR | Partially supported. `qr_locations` supports table/counter/pickup/takeaway/general-store labels and default fulfillment metadata; repository joins `qr_locations`; response includes `qr_context.location_type`, `location_label`, and `qr_location_id`; baseline unit test confirms QR location id is preserved in context output. | Runtime response currently forces `fulfillment_type: 'pickup'` in `buildQrStoreContextResponse` instead of using `qrLocation.defaultFulfillmentType` or session fulfillment. Need checkout/order persistence verification for `qr_location_id`, table/location lock enforcement, and dine-in/takeaway behavior if required. |
| Legacy session QR | Supported as fallback. If no active static `qr_codes` row matches the hashed token, service reads active `qr_order_sessions`, checks `session_status`, expiry, revocation, outlet status, and maps table/location labels. | Fallback remains compatibility path; primary static QR behavior should be covered by end-to-end tests before relying on it for alpha. |

### Baseline Tests

- `NODE_ENV=test node --test "test/unit/services/qr-order-session.service.test.js"`: relevant baseline for QR code/session semantic split and location context mapping; not executed in this documentation-only wave.
- `NODE_ENV=test node --test "test/unit/migrations/phase3-online-qr-store-schema.test.js"`: relevant baseline for migrations `038` through `041`, additive canonical-table strategy, QR indexes, and duplicate-table avoidance; not executed in this documentation-only wave.
- Prior progress docs record broader Phase 3.x test runs against QR/public-store/payment/order suites, but this task does not claim a new pass/fail result.

### Audit Conclusion

- Phase 4 task `1.2` audit acceptance items are satisfied for inspection and mapping.
- Current runtime supports outlet QR and partial location/table QR.
- Current runtime does not yet implement true universal QR semantics; that remains a functional gap for a later implementation task.
- No runtime code was changed during this audit.

## 1.3 Existing Marketplace Preservation Audit

Freshly inspected on 2026-07-07 for Phase 4 task `1.3 Audit existing marketplace preservation paths`.

### Files Inspected

| File | Evidence |
|---|---|
| `server/src/routes/webhooks/meta.js` | WhatsApp webhook path validates Meta signature, resolves WhatsApp platform by phone number id/account id, and exposes `handleWhatsAppCommerceAction`. WhatsApp commerce actions support Telegram-style `act:*` callback payloads through `parseTelegramAction`/`handleTelegramCommerceAction`, direct `wa_cart_view`, and `wa_checkout_confirm_*` conversion to checkout/order/payment. |
| `server/src/services/telegram-commerce.service.js` | Active Telegram commerce service covers outlet selection, product listing/detail, add/remove/clear cart, checkout start/confirm, order status, checkout-to-order conversion, payment session creation with manual fallback, and versioned callback protection. |
| `server/src/services/telegram/telegram-update-processor.service.js` | Active Telegram v1 processor imports `parseTelegramAction` and `handleTelegramCommerceAction`, dispatching callback-query commerce actions from webhook events. |
| `server/src/services/ai.service.js` | AI assisted order path keeps official commerce tools for `select_outlet` and `add_cart_item`, uses backend cart service validation, and includes legacy `FILE_ORDER_JSON` fallback through `createOrderFromAI` behind AI action guardrails. |
| `server/src/services/cart.service.js` | Shared cart path enforces product active state, outlet availability/inventory, single-outlet cart binding, max item quantity, and backend price totals for Telegram/WhatsApp/AI-assisted cart usage. |
| `server/src/services/checkout.service.js` | Existing marketplace checkout path enforces pickup checkout, idempotency key reuse, cart/outlet binding, product availability/stock recheck, and checkout snapshot creation before marketplace order conversion. |
| `server/src/services/order.service.js` | `createOrderFromCheckout` preserves source inference for WhatsApp contacts with Indonesian phone handles, while defaulting legacy marketplace source to Telegram. `createOrderFromAI` also infers WhatsApp when contact handle/phone matches. |
| `server/test/e2e/telegram-marketplace.e2e.test.js` | Baseline E2E coverage for Telegram marketplace behavior. Not executed in this documentation-only wave. |
| `server/test/e2e/ai/button-commerce-regression.test.js` | Baseline regression coverage includes WhatsApp interactive commerce action contract and AI button commerce preservation. Not executed in this documentation-only wave. |
| `server/test/integration/checkout-flow.test.js` | Baseline full flow test for product -> cart -> checkout button -> payment link. Not executed in this documentation-only wave. |

### Preservation Map

| Path | Current capability | Gaps / risks |
|---|---|---|
| WhatsApp commerce | Meta webhook routing is active; interactive WhatsApp actions can reuse Telegram commerce callbacks; direct WhatsApp cart view and checkout confirm create order/payment and mark checkout/cart converted. Payment session failure falls back to manual payment instruction. | WhatsApp-specific checkout/payment E2E coverage is thin. Current regression test is source/contract oriented, so deeper WhatsApp cart-confirm-payment flow coverage should be added before changing shared commerce services. |
| Telegram commerce | Telegram v1 webhook and commerce service are active. Outlet, product, cart, checkout, payment-session, manual fallback, and order-status paths are implemented through shared cart/checkout/order/payment services. | Telegram commerce uses generated checkout idempotency keys with `Date.now()` for each checkout-start action; this preserves existing behavior but is not equivalent to public checkout request-hash idempotency. |
| AI assisted order | OpenAI-compatible tool loop can call official `select_outlet` and `add_cart_item`, preserving backend outlet/cart validation. Gemini legacy flow can still create `create_legacy_order` from `FILE_ORDER_JSON` with AI action guardrails. | AI tool path passes `platformType: 'telegram'` for cart additions even when AI may be servicing another channel. Legacy `createOrderFromAI` has weaker item/price snapshot structure than official cart/checkout. Preserve for backward compatibility but prefer official cart/checkout buttons. |

### Regression Tests That Must Stay Green

- `server/test/e2e/telegram-marketplace.e2e.test.js`: Telegram marketplace flow.
- `server/test/e2e/ai/button-commerce-regression.test.js`: AI button commerce and WhatsApp interactive action contract.
- `server/test/integration/checkout-flow.test.js`: product/cart/checkout/payment-link flow.
- `server/test/integration/commerce/telegram-commerce-outlet.integration.test.js`: Telegram outlet selection and outlet-scoped commerce behavior.
- `server/test/integration/commerce/checkout-service.integration.test.js`: marketplace checkout service behavior.
- `server/test/integration/commerce/order-service.integration.test.js`: checkout-to-order behavior.
- `server/test/security/orders/cart-order-security.test.js`: cart/order guardrails that protect shared commerce paths.

### Audit Conclusion

- Phase 4 task `1.3` audit acceptance items are satisfied for WhatsApp, active Telegram, AI-assisted order, and regression-test identification.
- Runtime code was not changed.
- The preservation rule is to extend shared services carefully and keep existing marketplace regression suites green before adding QR/public-store runtime changes.

## 1.4 Product, Availability, and Modifier Runtime Audit

Freshly inspected on 2026-07-07 for Phase 4 task `1.4 Audit product, availability, and modifier runtime`.

### Files Inspected

| File | Evidence |
|---|---|
| `server/src/services/product.service.js` | `listCustomerProductsForOutlet` requires workspace/outlet, loads active products, joins outlet availability and inventory, filters unavailable/out-of-stock products, and applies outlet availability to returned products. Admin product service enforces workspace management and outlet access when applicable. |
| `server/src/db/repositories/products.supabase.repository.js` | Canonical product repository reads `products` and `product_outlet_availability`, supports `findOneAvailability`, `findAvailabilityByOutlet`, `upsertAvailability`, and `findProductWithModifiers` against `product_modifiers(*)`. |
| `server/src/services/cart.service.js` | Existing marketplace cart validates product existence/active state, outlet availability or inventory, single-outlet carts, quantity limits, and uses outlet price override or base price. Modifier arrays are accepted and persisted but not priced. |
| `server/src/services/checkout.service.js` | Existing marketplace checkout revalidates availability and stock before creating checkout snapshot. Modifier payloads are copied from cart items into checkout items. |
| `server/src/services/public-storefront.service.js` | Public menu maps `product.metadata.modifiers` to public product response. Public cart validation carries submitted modifier data into the snapshot but sets every `price_delta` to `0`. |
| `server/src/db/migrations/038_online_qr_store_schema_phase3.sql` through `041_online_qr_store_phase33_integrity.sql` | Online/QR Store migrations extend storefront, QR, provider, payment, order, and integrity tables but do not add a new normalized modifier group/option schema. |

### Runtime Map

| Area | Current capability | Gaps / risks |
|---|---|---|
| Product repository/service | Product authority is in `productsRepository` and `product.service.js`. Active products are workspace-scoped; admin list/detail can include outlet availability after outlet access checks. | `productsRepository.findProducts({ outletId })` ignores outletId parameter; customer-facing outlet filtering happens in service, not repository. Preserve this behavior unless refactoring with tests. |
| Outlet availability | `product_outlet_availability` plus inventory drives customer-facing availability. Inventory quantity `<= 0` hides product; positive inventory allows product; otherwise active availability row with `isAvailable !== false` is required. Price uses outlet `priceOverride` before base price. | Product with inventory stock can bypass missing availability row in customer list; confirm intended seed semantics before strict public availability hardening. |
| Modifier data model | Runtime evidence shows two partial models: `product.metadata.modifiers` in public product mapping and repository support for `product_modifiers(*)`. Cart/checkout/order snapshots carry submitted modifier arrays in metadata. | No complete shared runtime validator was found for modifier group ownership, option ownership, min/max selections, or price deltas. Migrations `038`-`041` do not create canonical modifier group/option tables. |
| Public cart reuse potential | Public cart validation can reuse product/outlet availability and backend price authority from `listCustomerProductsForOutlet`. | Public cart validation cannot directly reuse a complete modifier validation/pricing service because one does not exist. Task `3.3` should introduce or centralize modifier validation/pricing before using modifier totals publicly. |

### Baseline Tests

- `server/test/unit/services/public-storefront.service.test.js`: public product safety and cart snapshot behavior; not executed in this wave.
- `server/test/security/orders/cart-order-security.test.js`: quantity, outlet, and order security guardrails; not executed in this wave.
- `server/test/integration/commerce/checkout-service.integration.test.js`: existing checkout availability/snapshot behavior; not executed in this wave.
- `server/test/integration/commerce/telegram-commerce-outlet.integration.test.js`: outlet-scoped Telegram product/cart behavior; not executed in this wave.

### Audit Conclusion

- Phase 4 task `1.4` audit acceptance items are satisfied.
- Product and outlet availability authority are reusable for public cart validation.
- Full modifier validation/pricing remains an implementation gap and should not be treated as already complete.
- Runtime code was not changed.

## 1.5 Checkout, Order, and Payment Lifecycle Audit

Freshly inspected on 2026-07-07 for Phase 4 task `1.5 Audit checkout, order, and payment lifecycle`.

### Files Inspected

| File | Evidence |
|---|---|
| `server/src/services/public-storefront.service.js` | `createPublicCheckout` requires idempotency key plus customer name/phone, validates cart first, hashes a backend-normalized safe payload, checks completed idempotency records, creates order, creates payment session, then stores completed idempotency response. |
| `server/src/services/order.service.js` | `createOrderFromCheckout` builds immutable order/order item snapshots, order number, public order token, QR/storefront metadata, payment/fulfillment starting states, and audit/realtime events. Fulfillment paid-only guards are in accept/prepare/ready/complete paths. |
| `server/src/db/repositories/orders.supabase.repository.js` | `create` inserts `orders` then `order_items`; `atomicFulfillmentStatusUpdate` and `atomicStatusUpdate` guard transitions; `deleteOne` throws `ORDER_DELETE_DISABLED`. |
| `server/src/services/payment.service.js` | `createPaymentSessionForOrder` resolves active provider, rejects paid orders, reuses idempotency/reusable attempts, builds provider session request, stores payment attempt, and marks order payment pending. `reconcileProviderSession` and provider sync can mark paid through backend/provider authority. |
| `server/src/db/repositories/payments.supabase.repository.js` | Payment repository supports idempotency-key lookup, reusable attempts, provider transaction/reference lookup, atomic/transition status updates, payment event insertion, and scoped payment queries. |
| `server/src/services/payment-webhook.service.js` | BayarGG webhook verifies signature, de-duplicates provider events, matches provider transaction, validates amount/currency/expiry, sends mismatch/expired states to `manual_review`, transitions pending/expired to paid, records events/audits, and marks order paid awaiting acceptance. |
| `server/src/routes/public-store.js` | Public checkout route passes `Idempotency-Key` from header or body to service and stays thin. |

### Lifecycle Map

| Step | Current behavior | Gaps / risks |
|---|---|---|
| Checkout creation/idempotency | Public checkout computes a stable request hash from backend-derived outlet/items/customer data. Same idempotency key/hash returns stored response; same key/different hash returns conflict. Existing marketplace checkout reuses `checkouts.idempotency_key`. | Public checkout remains check-then-create: concurrent first requests can both pass before `storeCompleted`. Order, payment, and idempotency writes are not in one DB transaction/claim. |
| Order snapshot creation | `createOrderFromCheckout` snapshots customer, outlet, fulfillment, item names/unit prices/quantities/subtotals, public token, QR/location/storefront metadata, and starts at pending payment/not started. | Order number generation reads latest order and increments in service; DB unique index helps detect duplicates but service has no retry loop documented here. Public checkout payment failure after order creation can leave an unpaid order without stored idempotency response. |
| Payment session creation | Active provider resolution is provider-agnostic. BayarGG/DOKU/Xendit session creation uses authoritative order total/currency/customer snapshot, stores provider refs and payment URL, and sets order payment status to pending. | Provider failure after order creation needs retry/recovery handling. Live BayarGG session and webhook payload verification remains unproven in this audit. |
| BayarGG paid transition | `processBayarGgWebhook` verifies the adapter webhook result before mutation, de-duplicates processed events, matches invoice/provider transaction, validates amount/currency/expiry, transitions payment to paid from pending/expired, writes event/audit, then marks order `payment_status=paid`, `fulfillment_status=awaiting_acceptance`, `status=awaiting_outlet_approval`. | If `transitionStatus` returns null because target payment is already paid, order is still marked paid afterward; this is safe for duplicate/stale paid state but should stay covered by idempotency tests. |
| Fulfillment guards | Accept requires paid and `awaiting_acceptance`; prepare/ready/complete require paid and exact previous fulfillment state through atomic updates. Generic status transition also blocks non-cancel fulfillment transitions unless paid. | Prepare/ready/complete compare outlet only when an outlet id is supplied; route callers should always provide outlet context or service should derive it from user scope in a later hardening task. |

### Baseline Tests

- `server/test/unit/services/public-storefront.service.test.js`: public checkout helper and customer field validation; not executed in this wave.
- `server/test/integration/payments/payment-webhook.integration.test.js`: payment webhook behavior; not executed in this wave.
- `server/test/security/payments/payment-security.test.js`: payment authority and mismatch safety; not executed in this wave.
- `server/test/concurrency/payments/payment-concurrency.test.js`: payment concurrency baseline; not executed in this wave.
- `server/test/e2e/payments/payment-e2e.test.js`: payment E2E baseline; not executed in this wave.
- `server/test/security/orders/cart-order-security.test.js`: paid-only order/fulfillment guardrails; not executed in this wave.

### Audit Conclusion

- Phase 4 task `1.5` audit acceptance items are satisfied.
- Paid is not treated as completed; paid transitions put orders into awaiting outlet acceptance.
- Transactional public checkout/idempotency hardening and live BayarGG verification remain implementation gaps.
- Runtime code was not changed.

## 1.6 Admin Order Lifecycle and Permissions Audit

Freshly inspected on 2026-07-07 for Phase 4 task `1.6 Audit admin order lifecycle and permissions`.

### Files Inspected

| File | Evidence |
|---|---|
| `server/src/routes/admin-orders.js` | Phase 2 admin aliases require auth/workspace context. List uses `orders.read` and requires scoped outlet selection. Detail uses `orders.read`. All lifecycle actions use `orders.manage_status`. Response maps server-derived `allowed_actions`. |
| `server/src/routes/orders.js` | Legacy admin order routes also use `orders.manage_status` for cancel/accept/reject/start-preparing/mark-ready/complete and return 405 on `DELETE /:id`. |
| `server/src/services/order.service.js` | `listWorkspaceOrdersForUser` and `getWorkspaceOrderForUser` use outlet-scoped query/access helpers. Accept/reject require outlet id match; prepare/ready/complete require paid and atomic fulfillment status. Cancel requires reason through `transitionOrderStatus`. `deleteOrderForUser` throws `ORDER_DELETE_DISABLED`. |
| `server/src/db/repositories/orders.supabase.repository.js` | Scoped list/detail/update query methods filter by workspace and outlet/outletIds. `deleteOne` is hard blocked. Atomic status/fulfillment methods prevent invalid concurrent transitions. |
| `docs/backend/05-api-spec/orders-api.md` | Documents admin aliases, paid-only fulfillment, cancel reason, and hard-delete disabled behavior. |

### Runtime Map

| Area | Current capability | Gaps / risks |
|---|---|---|
| List scoping | Admin aliases list orders through `listWorkspaceOrdersForUser`, which builds workspace/outlet scope and passes `outletId`/`outletIds` into repository scoped list/count. `requireScopedOutletSelection` requires outlet selection for outlet-scoped order access. | Users with all-outlet access can list without a selected outlet if access-control allows it; this appears intentional. |
| Detail scoping | Detail lookup uses workspace scope and, for non-all-outlet users, rechecks `assertOutletAccess(user, order.outletId)`. Repository also supports `workspaceFindByIdScoped`. | Detail route does not require outlet query/body because service derives outlet from the order before enforcing access. |
| Outlet access enforcement | Accept/reject require caller-supplied outlet id and compare it to order outlet. Prepare/ready/complete compare only if an outlet id is supplied. Generic cancel currently derives only workspace/actor and does not pass outlet id, relying on permission and service transition rules rather than route-level outlet selection. | Harden later by deriving action outlet scope from user/order for every lifecycle mutation, not only accept/reject or optional outlet id. |
| Cancel reason | Generic status cancellation requires non-empty `reason`; reject also requires reason. Docs and runtime align. | Continue to ensure all cancel/reject aliases pass and persist reasons consistently. |
| Hard-delete blocking | `DELETE /orders/:id` returns 405 and repository/service delete paths throw `ORDER_DELETE_DISABLED`. | None for hard-delete blocking in inspected runtime. |
| Permission split | Current routes use `orders.manage_status` for every lifecycle action. | Product/plan docs mention per-action permissions (`orders.accept`, `orders.prepare`, `orders.ready`, `orders.complete`, `orders.cancel`) but runtime has not split enforcement. This is an explicit gap, not a docs-only issue. |

### Baseline Tests

- `server/test/unit/routes/authorization-routes.test.js`: confirms route authorization middleware presence; not executed in this wave.
- `server/test/security/orders/cart-order-security.test.js`: fulfillment/payment guardrails; not executed in this wave.
- `server/test/integration/commerce/order-service.integration.test.js`: order service behavior; not executed in this wave.
- `server/test/e2e/orders/cart-order-e2e.test.js`: order flow E2E baseline; not executed in this wave.

### Audit Conclusion

- Phase 4 task `1.6` audit acceptance items are satisfied.
- Admin lifecycle has workspace/outlet scoping, paid-only guards, cancel reason, and hard-delete blocking.
- Per-action permission enforcement and uniform mutation outlet-scope hardening remain implementation gaps.
- Runtime code was not changed.

## 1.7 Docs Versus Runtime Audit

Freshly inspected on 2026-07-07 for Phase 4 task `1.7 Audit docs versus runtime`.

### Files Inspected

| File | Evidence |
|---|---|
| `docs/backend/05-api-spec/public-storefront-api.md` | Mostly aligned with runtime public routes, pickup-only public checkout, idempotency/customer requirements, public order safety, payment paid authority, and QR outlet lock. |
| `docs/backend/05-api-spec/orders-api.md` | Mostly aligned with admin aliases, paid-only fulfillment, cancel reason, and hard-delete disabled behavior. |
| `docs/backend/05-api-spec/payments-api.md` | Payment authority and public payment status docs align conceptually, but examples still include stale `midtrans` provider values while runtime supports manual/xendit/doku/bayargg. |
| `docs/backend/05-api-spec/webhooks-api.md` | Webhook docs cover provider signature verification and BayarGG validation/manual-review rules, but generic payment webhook table wording still says raw events are stored in `webhook_events` while runtime payment webhook processing writes normalized rows to `payment_events`. |
| `docs/backend/06-data/database-schema.md` | Runtime mapping for storefronts, QR, product availability, idempotency, provider settings, and manual_review is aligned with migrations `038` through `041`. |
| `docs/backend/06-data/indexes.md` | Phase 3.3 indexes and uniqueness docs are aligned with migration `041`, including runtime `payment_events`. |
| `docs/backend/06-data/relationships.md` | Mostly aligned for workspace/outlet/product/order/payment relationships, but still references `payment_attempts` as a payment child while active runtime uses `payments` rows as attempts. |
| `server/src/db/migrations/037_qr_public_order_lifecycle.sql` through `041_online_qr_store_phase33_integrity.sql` | Migrations confirm additive QR/public order/provider/index/integrity schema, not greenfield replacement. |
| `server/src/routes/public-store.js`, `server/src/routes/admin-orders.js`, `server/src/routes/orders.js`, `server/src/services/public-storefront.service.js`, `server/src/services/payment-webhook.service.js` | Runtime comparison sources for route and service behavior. |

### Stale / Needs-Update Docs Marked Before Runtime Editing

| Document | Stale or risky claim | Runtime evidence / action |
|---|---|---|
| `docs/backend/05-api-spec/payments-api.md` | Example payment provider fields use `midtrans`. | Runtime provider set is `manual`, `xendit`, `doku`, `bayargg`; docs should update examples before wider alpha documentation release. |
| `docs/backend/05-api-spec/webhooks-api.md` | Generic payment webhook section says raw event is stored in `webhook_events`. | Runtime payment webhook path writes normalized provider rows to `payment_events`; Meta/Telegram webhooks use webhook event persistence separately. Update wording later, not runtime. |
| `docs/backend/06-data/relationships.md` | Relationship diagram includes `payments 1 -> * payment_attempts`. | Current payment attempts are represented by rows in `payments` with `attempt_number`; `payment_attempts` is future/richer history only. |
| `plans/qr-order-backend/phase-3.4.md`, `phase-3.7.md`, `alpha-testing.md` | Some plan/alpha text expects per-action permissions such as `orders.accept`. | Runtime still enforces `orders.manage_status`; keep this as an implementation gap until product confirms split. |
| `docs/backend/05-api-spec/public-storefront-api.md` | QR context example shows a legacy `data` envelope and fields, while current `getQrStoreContext` response is richer with `qr_session`, `outlet`, `qr_context`, and `menu`. | Public QR docs need response shape refresh. Runtime was not edited. |

### Audit Conclusion

- Phase 4 task `1.7` audit acceptance items are satisfied.
- Stale docs are marked in this evidence before any future runtime changes.
- No runtime code was changed.

## 1.8 Checkpoint — Audit Complete

Completed on 2026-07-07 after tasks `1.1` through `1.7` were freshly inspected and documented.

### Gap List With File References

| Gap | File references | Recommended follow-up |
|---|---|---|
| True Universal QR semantics are not implemented. | `server/src/db/migrations/038_online_qr_store_schema_phase3.sql`, `server/src/services/qr-order-session.service.js`, `server/src/services/public-storefront.service.js` | Later QR implementation task should decide nullable/unlocked QR outlet model and checkout validation. |
| Public checkout idempotency is check-then-create and not transaction/claim based. | `server/src/services/public-storefront.service.js`, `server/src/db/repositories/orders.supabase.repository.js`, `server/src/db/repositories/payments.supabase.repository.js` | Add DB-backed claim/transaction workflow before real high-concurrency alpha. |
| Public checkout order/payment/idempotency writes are not atomic. | `server/src/services/public-storefront.service.js` | Add transactional repository/service boundary and recovery behavior for payment-session failure after order creation. |
| Full modifier validation/pricing is missing. | `server/src/services/public-storefront.service.js`, `server/src/services/cart.service.js`, `server/src/services/checkout.service.js`, `server/src/db/repositories/products.supabase.repository.js` | Task `3.3` should add or centralize modifier group/option/min/max/price validation. |
| Live BayarGG verification is not proven. | `server/src/services/payment.service.js`, `server/src/services/payment-webhook.service.js`, `server/src/integrations/payments/*bayargg*` | Later payment task should verify real provider session/webhook payloads and signatures. |
| Admin lifecycle permissions are coarse. | `server/src/routes/admin-orders.js`, `server/src/routes/orders.js`, `plans/qr-order-backend/phase-3.4.md` | Product decision needed before splitting `orders.manage_status` into per-action permissions. |
| Lifecycle mutation outlet scope is not uniform. | `server/src/services/order.service.js`, `server/src/routes/admin-orders.js`, `server/src/routes/orders.js` | Derive and enforce outlet scope for every mutation, not only accept/reject or optional caller outlet id. |
| Docs have stale provider/table/permission/QR examples. | `docs/backend/05-api-spec/payments-api.md`, `docs/backend/05-api-spec/webhooks-api.md`, `docs/backend/06-data/relationships.md`, `docs/backend/05-api-spec/public-storefront-api.md`, `plans/qr-order-backend/phase-3.4.md` | Update docs in a documentation cleanup task before runtime changes depend on those contracts. |

### Baseline Tests Identified

- `server/test/unit/services/public-storefront.service.test.js`
- `server/test/unit/services/qr-order-session.service.test.js`
- `server/test/unit/routes/authorization-routes.test.js`
- `server/test/unit/migrations/phase3-online-qr-store-schema.test.js`
- `server/test/e2e/telegram-marketplace.e2e.test.js`
- `server/test/e2e/ai/button-commerce-regression.test.js`
- `server/test/integration/checkout-flow.test.js`
- `server/test/integration/commerce/telegram-commerce-outlet.integration.test.js`
- `server/test/integration/commerce/checkout-service.integration.test.js`
- `server/test/integration/commerce/order-service.integration.test.js`
- `server/test/integration/payments/payment-webhook.integration.test.js`
- `server/test/concurrency/payments/payment-concurrency.test.js`
- `server/test/security/orders/cart-order-security.test.js`
- `server/test/security/payments/payment-security.test.js`

### Checkpoint Conclusion

- Phase 4 audit tasks `1.1` through `1.7` are complete as documentation audits.
- Gap list includes file references.
- Baseline tests are identified but not executed in this documentation-only wave.
- No implementation begins until gap priority is confirmed by continuing with task `2.1 Verify migrations 038 through 041`.
- Runtime code was not changed.

## Validation Limitation

- `npm run specs:check` was not executed in this documentation wave; no pass/fail output is claimed.
- The `1.1` through `1.7` sections are freshly inspected; checkpoint `1.8` is documentation-only.
- Runtime code was intentionally not changed.
