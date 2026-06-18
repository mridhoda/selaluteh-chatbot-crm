# Decision Log

## Decision: MVP Single Workspace + Multi Outlet

Status: Accepted

MVP will use one workspace/account with many outlets.

## Decision: Future Multi Workspace + Multi Outlet

Status: Accepted

Future production must support multiple accounts/franchise owners, each with multiple outlets.

## Decision: Workspace Is Account, Outlet Is Branch

Status: Accepted

Workspace represents business owner/franchise owner. Outlet represents physical branch.

## Decision: workspace_id Everywhere Tenant-Owned

Status: Accepted

All tenant-owned data must include workspace_id.

## Decision: outlet_id for Outlet Operations

Status: Accepted

Cart, checkout, order, payment, complaints, and relevant chats must include outlet context.

## Decision: Customer Selects Outlet First

Status: Accepted for MVP

Reason: faster than location routing and clearer for first implementation.

## Decision: Cart Items Embedded, Not Separate Collection

Status: Accepted

Reason: Cart is a transient document with a limited number of items. Embedding avoids joins and simplifies atomic updates. Same pattern applied to checkout and order items.

## Decision: Order Timeline as Embedded Array

Status: Accepted

Reason: Timeline is append-only, always read with the order, and never queried independently. Embedding eliminates N+1 and keeps order atomic.

## Decision: Separate PaymentEvent Collection

Status: Accepted

Reason: Payment webhook events may arrive independently of payment queries. A separate collection enables idempotency lookups and event replay without bloating the payment document. The Payment document keeps a summary events array for convenience reads.

## Decision: Server-Derived Idempotency for Webhooks, Idempotency Key for Checkout

Status: Accepted

Reason: Webhook idempotency uses `providerEventId` (server-derived). Checkout idempotency uses a client-provided `idempotencyKey` because the checkout trigger comes from Telegram/chat, not a provider callback.

## Decision: Atomic Status Update with Expected-State Check

Status: Accepted

Reason: Concurrency-safe transitions for payments (`expectedStatus: 'pending' → 'paid'`) and orders (`expectedStatus: current → newStatus`). Prevents duplicate paid events and race conditions.

## Decision: Payment Reconciliation as Separate Service, Not Embedded

Status: Accepted

Reason: Reconciliation compares payment, order, and provider state. A separate service avoids circular dependencies between payment and order services. It's triggered by webhooks, admin sync, or batch workers.

## Decision: Top-Level await Avoided in Provider Adapters

Status: Accepted

Reason: ESM top-level await prevents module loading in some test/CI contexts. Adapters use async functions and dynamic import inside `loadAdapter()` instead.

## Decision: Payment `paid` Requires Verified Provider Event

Status: Accepted (enforced)

Reason: No standard mark-paid API endpoint exists. Only `atomicStatusUpdate` from webhook processing or reconciliation can transition to `paid`.

## Decision: Supabase/Postgres as the Sole Runtime Target

Status: Accepted

Reason: The backend runtime must fully transition to Supabase/Postgres to support transactional guarantees, relational schema consistency, and scalable multi-tenant isolation.

## Decision: Fresh-Start Migration (No Mongo Data Backfill or Dual-Write)

Status: Accepted

Reason: MongoDB is legacy-only and contains test data. Starting fresh from Supabase avoids complex reconciliation scripts, dual-write sync bugs, and data backfill overhead.

## Decision: Keep Custom Backend JWT Authentication

Status: Accepted

Reason: Custom JWT-based authentication is kept during the cutover. Migration to Supabase Auth is deferred to a future spec to minimize scope and prevent auth disruptions.

## Decision: Domain-by-Domain Staged Cutover & Total MongoDB Removal

Status: Accepted

Reason: To ensure safety and preserve behavior, repository layers and routes were cut over staged domain-by-domain. Once all domains were migrated, MongoDB connection code, Mongoose models, and Mongoose test helpers (like `MongoMemoryServer`) were completely removed from the codebase to eliminate technical debt.

