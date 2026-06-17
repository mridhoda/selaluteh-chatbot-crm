# Current Sprint

## Sprint Name

Sprint 1.5 — Multi-Outlet Foundation & Backend Structure

## Goal

Complete the multi-outlet backend foundation started in Sprint 1, then prepare the codebase for Cart/Checkout domain implementation.

## Why This Sprint

Sprint 0 (Stabilize Legacy CRM) is complete. The multi-outlet models, webhook idempotency, AI guardrails, and Telegram outlet selection have been partially implemented. This sprint hardens the backend structure, completes outlet access controls, finishes repository contracts, and stabilizes the product/availability domain before Cart implementation.

## Tasks (from specs/active/general-backend/tasks.md)

### Completed in Prior Work
- [x] 0.1-0.8 Baseline, Safety, Hygiene
- [x] 1.1 Confirm server/src runtime
- [x] 4.1-4.2 Outlet model audit and extension
- [x] 4.5 UserOutletAccess audit
- [x] 5.5-5.6 Webhook event model and idempotency
- [x] 6.8 Outlet context on chat
- [x] 7.4 AI commerce guardrails
- [x] 8.1-8.3 Product model, extension, indexes
- [x] 9.1-9.3 ProductOutletAvailability model and unique constraint
- [x] 10.2-10.3 Telegram /start and outlet selection

### In Progress (Partial)
- [~] 1.2-1.6 Backend structure rules and contracts
- [~] 2.8 Request context
- [~] 3.1-3.5 Workspace membership and access control foundation
- [~] 3.8 Workspace isolation tests
- [~] 4.3-4.10 Outlet repository, service, APIs, access, security tests
- [~] 5.7-5.11 Telegram parsing, webhook security, idempotency tests
- [~] 7.2-7.7 AI action contract, validation, guardrail tests
- [~] 8.4-8.9 Product repository, service, routes, tests
- [~] 9.4-9.9 Availability repository, effective price, catalog API, tests
- [~] 10.1-10.7 Telegram commerce state, product browsing, tests

### Next Focus Area
- [ ] 11.1-11.11 Cart Domain (model, repository, service, Telegram integration, tests)

## Acceptance Criteria

- All Task 0 items are checked complete.
- Workspace/outlet security tests pass.
- Catalog endpoint returns correct outlet-scoped products.
- Telegram users can select outlet and browse products.
- Cart service foundation is ready for implementation.
