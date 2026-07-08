# TASK LOOP: Execute One Phase 5 Task Safely

Active spec:
selkop-phase-5-frontend-integration

Active task:
[ISI TASK ID DAN JUDUL DI SINI]

Example:
8.2 Implement checkout idempotency lifecycle

## Goal

Execute only this task.

Do not jump to other tasks unless required for this task's dependencies or tests.

## Required loop

### 1. Audit

Read existing frontend and backend contract related to this task.

Find:

- existing routes
- existing components
- existing layouts
- existing API client methods
- existing auth guard
- existing state management
- existing tests
- existing backend endpoint contract
- existing error response shape
- existing frontend regression risks

Do not assume missing modules before searching.

### 2. Map

Map the target behavior to current implementation.

Classify the work as:

- reuse
- extend
- refactor
- rebuild
- greenfield

Explain why.

### 3. Plan

Create a short implementation plan.

Include:

- files to read
- files to modify
- files to create
- tests to write first
- backend contract dependency
- regression impact
- fallback/blocked status if backend contract is missing

### 4. RED Test

Write failing test first for behavior changes.

For critical behavior, include negative tests:

- frontend cannot send payment_status
- frontend cannot send fulfillment_status
- frontend cannot mark paid
- frontend cannot override QR locked outlet/location
- duplicate checkout is prevented
- allowed_actions are backend-driven
- raw provider payload is not shown

### 5. GREEN Implementation

Implement the minimum safe change.

Rules:

- frontend is UX layer only
- API calls go through centralized API client
- frontend does not own price/payment/order authority
- checkout uses Idempotency-Key
- QR session token is passed only when required
- admin actions use explicit endpoints
- allowed_actions comes from backend
- public UI hides internal fields

### 6. Refactor

Clean up duplication.

Do not create shadow business logic.

### 7. Verify

Run targeted tests.

Then run relevant regression tests.

At minimum, check existing admin/WhatsApp frontend flows if the task touches:

- routing
- admin shell
- API client
- auth guard
- order UI
- product UI
- payment UI
- marketplace/CRM/chat UI

### 8. Docs Update

Update relevant docs:

- implementation status
- task checklist
- Phase 5 deliverable doc
- known limitations
- blocked backend contracts

### 9. Report

Return:

- summary
- files changed
- tests added
- test commands
- test results
- regression result
- docs updated
- risks
- blockers
- next recommended task

## Hard blockers

Stop immediately if:

- frontend can mark payment paid
- frontend sends payment_status
- frontend sends fulfillment_status
- frontend treats payment redirect as paid
- frontend uses local total as final authority
- frontend overrides QR locked outlet/location
- checkout can submit without Idempotency-Key
- admin actions are guessed client-side
- admin uses generic PATCH status
- raw provider payload appears in public UI
- internal order ID appears in public UI
- existing WhatsApp/admin frontend flow breaks