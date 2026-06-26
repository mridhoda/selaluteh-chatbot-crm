---
schema_version: 1
document_type: requirements
spec_id: thermal-print-specs
title: SelaluTeh Thermal Print Requirements
status: active
workflow_state: in_progress
version: 1.0.0
updated_at: 2026-06-24
---

# Requirements Document: SelaluTeh Thermal Print

## Introduction

Spec ini menetapkan dua jalur produksi utama:

```text
Desktop
├── Linux
└── Windows

Android
└── Tablet / HP outlet
```

```text
Order + verified Payment
→ Canonical Receipt Snapshot
→ HTML / ESC-POS Renderer
→ Printer Transport Adapter
   ├── Browser Print — Linux/Windows
   ├── Cleanter — Android
   ├── QZ Tray / Local Agent — desktop advanced
   ├── Mock — development
   └── Web Bluetooth — experimental
→ Thermal Printer
→ Print Job + Attempt + Evidence
```

## Authority and Boundaries

| Area | Authority |
|---|---|
| Receipt snapshots, templates, profiles, stations, transports, jobs, attempts, history | This spec |
| Immutable order and item snapshots | `selaluteh-cart-order-lifecycle` |
| Verified payment state and refund state | `selaluteh-payments-xendit` |
| Outlet identity and address | `selaluteh-outlet-management-operations` |
| Workspace/outlet permission | `selaluteh-workspace-access-control` |
| Administrative activity | `selaluteh-audit-activity-timeline` |
| Approved logo assets | `selaluteh-media-storage` |

## Fixed Direction

```text
Linux / Windows alpha : Browser Print
Android alpha         : Cleanter
Development           : Mock + Preview
Desktop advanced      : QZ Tray / Local Agent
Web Bluetooth         : Experimental only
```

## Requirement Summary

| ID | Requirement | Priority |
|---|---|---|
| TP-R1 | Authority and boundaries | P0 |
| TP-R2 | Supported platforms | P0 |
| TP-R3 | Transport adapter architecture | P0 |
| TP-R4 | Canonical receipt snapshot | P0 |
| TP-R5 | Document types | P0 |
| TP-R6 | Final proof policy | P0 |
| TP-R7 | Eligibility engine | P0 |
| TP-R8 | Verified payment representation | P0 |
| TP-R9 | Test mode marking | P0 |
| TP-R10 | Receipt content | P0 |
| TP-R11 | Receipt and queue identifiers | P1 |
| TP-R12 | Template ownership and versioning | P0 |
| TP-R13 | Safe structured templates | P0 |
| TP-R14 | Paper width and layout | P0 |
| TP-R15 | Encoding and typography | P0 |
| TP-R16 | Logo and QR capabilities | P1 |
| TP-R17 | Printer profile | P0 |
| TP-R18 | Print station | P0 |
| TP-R19 | Station-printer binding | P0 |
| TP-R20 | Transport types | P0 |
| TP-R21 | Desktop browser printing | P0 |
| TP-R22 | Desktop direct bridge | P1 |
| TP-R23 | Android Cleanter | P0 |
| TP-R24 | Experimental Web Bluetooth | P2 |
| TP-R25 | ESC/POS renderer | P0 |
| TP-R26 | HTML renderer | P0 |
| TP-R27 | Mock transport | P0 |
| TP-R28 | Print job model | P0 |
| TP-R29 | Print job lifecycle | P0 |
| TP-R30 | Completion evidence | P0 |
| TP-R31 | Print attempts | P0 |
| TP-R32 | Idempotency and accidental duplicates | P0 |
| TP-R33 | Reprint | P0 |
| TP-R34 | Copies | P1 |
| TP-R35 | Manual print actions | P0 |
| TP-R36 | Auto-print foundation | P1 |
| TP-R37 | Claim and lease | P1 |
| TP-R38 | Station health | P1 |
| TP-R39 | Test print | P0 |
| TP-R40 | Setup workflow | P0 |
| TP-R41 | Preview | P0 |
| TP-R42 | Orders sidebar integration | P0 |
| TP-R43 | Print history | P0 |
| TP-R44 | Stable error model | P0 |
| TP-R45 | Authorization and RLS | P0 |
| TP-R46 | Privacy and data minimization | P0 |
| TP-R47 | Local transport security | P0 |
| TP-R48 | API contracts | P0 |
| TP-R49 | Events, audit, and observability | P0 |
| TP-R50 | Testing, rollout, and operational readiness | P0 |

---

# Detailed Requirements

## TP-R1: Authority and boundaries

**Priority:** P0

### Acceptance Criteria

1. Printing owns receipt snapshots, templates, printer profiles, print stations, print jobs, attempts, renderers, transports, and print history.
2. Order, Payment, Outlet, Access Control, Audit, and Media domains remain authoritative for their own data.
3. Printing shall never mutate order, payment, inventory, product, or outlet truth.
4. Missing external contracts shall be treated as blockers rather than guessed.

## TP-R2: Supported platforms

**Priority:** P0

### Acceptance Criteria

1. Supported platforms are DESKTOP_LINUX, DESKTOP_WINDOWS, and ANDROID.
2. Desktop alpha uses Browser Print; Android alpha uses Cleanter.
3. Desktop direct printing through QZ Tray or a local print agent is an advanced path.
4. Web Bluetooth remains experimental and disabled by default.

## TP-R3: Transport adapter architecture

**Priority:** P0

### Acceptance Criteria

1. Receipt generation and printer transport shall be separate.
2. All transports implement one shared PrinterTransport interface.
3. Transport is selected from station configuration plus capability detection, not user-agent alone.
4. Transport failure never changes order or payment state.

## TP-R4: Canonical receipt snapshot

**Priority:** P0

### Acceptance Criteria

1. Every print job uses a canonical versioned snapshot.
2. Snapshot data comes from immutable order items, verified payment read models, outlet data, and approved template settings.
3. Historical receipts shall not read current catalog prices or names.
4. Equivalent source and template versions shall produce deterministic snapshots.

## TP-R5: Document types

**Priority:** P0

### Acceptance Criteria

1. Supported document types are ORDER_INVOICE, CUSTOMER_RECEIPT, KITCHEN_TICKET, REFUND_RECEIPT, and TEST_PAGE.
2. ORDER_INVOICE visibly shows unpaid/current payment state.
3. CUSTOMER_RECEIPT requires verified PAID except approved test mode.
4. KITCHEN_TICKET omits payment secrets and unnecessary PII.

## TP-R6: Final proof policy

**Priority:** P0

### Acceptance Criteria

1. The default final proof is CUSTOMER_RECEIPT.
2. The recommended default print point is ORDER_COMPLETED.
3. Authorized manual print may occur after verified PAID when policy allows.
4. Order status and payment status remain separate on the receipt.

## TP-R7: Eligibility engine

**Priority:** P0

### Acceptance Criteria

1. Backend evaluates print eligibility by workspace, outlet, order, payment, document type, mode, and actor.
2. Frontend and AI capability flags are advisory only.
3. Eligibility is checked at job creation and again before rendering if source state may change.
4. Ineligible requests return stable reason codes.

## TP-R8: Verified payment representation

**Priority:** P0

### Acceptance Criteria

1. PAID may be printed only from Payments domain verified state.
2. APPROVED or COMPLETED shall never be used as proof of payment.
3. Refunded payments require a refund/correction document.
4. Printing cannot create, override, or reconcile payment truth.

## TP-R9: Test mode marking

**Priority:** P0

### Acceptance Criteria

1. Xendit test-mode or test-order receipts display TEST MODE prominently.
2. Test receipts are not valid live payment proof.
3. Test and live history are filterable.
4. Test marking is backend-controlled.

## TP-R10: Receipt content

**Priority:** P0

### Acceptance Criteria

1. Customer receipt supports brand, outlet, address, order number, queue number, times, channel, pickup, items, modifiers, totals, payment, and footer.
2. Money is formatted from integer minor units.
3. Full payment credentials are never printed.
4. Phone and payment references are masked or omitted by default.

## TP-R11: Receipt and queue identifiers

**Priority:** P1

### Acceptance Criteria

1. Order number comes from the Order domain.
2. Queue number is optional and not an authorization secret.
3. Reprints preserve original order and queue identifiers.
4. Historical receipt identifiers are not rewritten by later policy changes.

## TP-R12: Template ownership and versioning

**Priority:** P0

### Acceptance Criteria

1. Templates belong to a workspace and may have outlet overrides.
2. Templates are versioned with DRAFT, PUBLISHED, and ARCHIVED states.
3. Published versions are immutable.
4. Existing snapshots keep their original template version.

## TP-R13: Safe structured templates

**Priority:** P0

### Acceptance Criteria

1. Templates use a structured schema or safe DSL, not executable JavaScript.
2. Supported sections include header, outlet, order, items, totals, payment, pickup, queue, QR, logo, and footer.
3. Unknown fields are rejected and customer-facing values sanitized.
4. Template rendering has snapshot and visual tests.

## TP-R14: Paper width and layout

**Priority:** P0

### Acceptance Criteria

1. 58 mm and 80 mm paper widths are supported.
2. Each profile defines paper width and characters per line.
3. Wrapping and alignment are deterministic.
4. Preview matches the selected paper profile.

## TP-R15: Encoding and typography

**Priority:** P0

### Acceptance Criteria

1. Encoding/code page is configurable per profile.
2. Unsupported characters use a safe fallback.
3. Width calculations account for multi-byte/wide characters where applicable.
4. A test page validates Indonesian text and symbols.

## TP-R16: Logo and QR capabilities

**Priority:** P1

### Acceptance Criteria

1. Logo, QR, and barcode output are capability driven.
2. Unsupported image/QR output falls back safely to text.
3. QR payloads contain no credentials or unrestricted PII.
4. Logo assets use approved Media/Storage references.

## TP-R17: Printer profile

**Priority:** P0

### Acceptance Criteria

1. Profile stores workspace, outlet, logical name, purpose, paper width, line width, encoding, capabilities, status, and version.
2. Profile never stores Bluetooth passwords or OS secrets.
3. Archived profiles preserve historical job references.
4. Mutations use optimistic concurrency and audit.

## TP-R18: Print station

**Priority:** P0

### Acceptance Criteria

1. A station represents one browser, Android device, desktop, or local agent.
2. It belongs to one workspace and outlet.
3. It stores platform, transport, generated device identifier, status, default flag, last seen, and version.
4. Device identification uses an application identifier rather than invasive hardware fingerprinting.

## TP-R19: Station-printer binding

**Priority:** P0

### Acceptance Criteria

1. A station can bind local printers to logical profiles.
2. Bindings store local printer name/identifier without treating it as a global identity.
3. Different bindings may serve customer receipt and kitchen purposes.
4. Missing binding returns PRINTER_NOT_CONFIGURED.

## TP-R20: Transport types

**Priority:** P0

### Acceptance Criteria

1. Supported active types are MOCK, BROWSER_PRINT, CLEANTER, QZ_TRAY, and LOCAL_AGENT.
2. MOCK is limited to development/approved test mode.
3. BROWSER_PRINT supports Linux and Windows.
4. CLEANTER supports Android via the local HTTP bridge.

## TP-R21: Desktop browser printing

**Priority:** P0

### Acceptance Criteria

1. Browser Print renders a dedicated printable HTML route and invokes window.print from a user gesture.
2. 58 mm and 80 mm print CSS are provided.
3. Invoking the dialog does not prove physical completion.
4. Preview and Save as PDF remain available without a printer.

## TP-R22: Desktop direct bridge

**Priority:** P1

### Acceptance Criteria

1. QZ Tray or an approved local agent may provide direct ESC/POS printing.
2. The bridge supports safe discovery, dispatch, health, and acknowledgment.
3. Bridge trust/signing is required before production.
4. If unavailable, an allowed configuration may fall back to Browser Print.

## TP-R23: Android Cleanter

**Priority:** P0

### Acceptance Criteria

1. Android supports Cleanter local HTTP bridge dispatch to `POST http://localhost:9100/print`.
2. The call originates from a user gesture.
3. Payload contains receipt output only and no auth tokens.
4. Payload size is bounded and Cleanter unavailable/CORS/local-network failures show setup guidance plus Preview.
5. HTTP 2xx from Cleanter means DISPATCHED with TRANSPORT_ACK, not physical completion.

## TP-R24: Experimental Web Bluetooth

**Priority:** P2

### Acceptance Criteria

1. Enabled only for a verified BLE/GATT printer with known service and writable characteristic.
2. No universal thermal-printer UUID is assumed.
3. Adapter supports chunking, timeout, reconnect, and browser capability checks.
4. Unsupported paths fall back to another configured transport.

## TP-R25: ESC/POS renderer

**Priority:** P0

### Acceptance Criteria

1. A versioned renderer outputs binary bytes.
2. It supports initialize, alignment, emphasis, columns, feed, optional cut, and capability-based images/QR.
3. Large jobs are chunkable.
4. Output is deterministic and covered by binary fixtures.

## TP-R26: HTML renderer

**Priority:** P0

### Acceptance Criteria

1. A versioned HTML/CSS renderer serves preview and Browser Print.
2. Print CSS isolates receipt content.
3. No arbitrary template code executes.
4. Preview and print use the same snapshot.

## TP-R27: Mock transport

**Priority:** P0

### Acceptance Criteria

1. Development includes mock success and configurable failure modes.
2. Mock records HTML, text, binary, metadata, and result.
3. Mock never claims real physical print.
4. Outputs may be downloadable for debugging.

## TP-R28: Print job model

**Priority:** P0

### Acceptance Criteria

1. Each print request creates a job with tenant, outlet, source, document, snapshot, template, profile, station, copies, status, idempotency, actor, and evidence.
2. Jobs can be created while a printer is offline.
3. Rendered snapshots are immutable.
4. Archived stations/profiles do not break history.

## TP-R29: Print job lifecycle

**Priority:** P0

### Acceptance Criteria

1. Statuses are QUEUED, RENDERING, READY, CLAIMED, DISPATCHED, COMPLETED, FAILED, CANCELLED, and EXPIRED.
2. Transitions are explicit, idempotent, versioned, and audited.
3. Retries create new attempts without overwriting history.
4. Cancelled/expired jobs cannot dispatch.

## TP-R30: Completion evidence

**Priority:** P0

### Acceptance Criteria

1. Dispatch and physical confirmation are separate.
2. Evidence types are NONE, USER_CONFIRMED, TRANSPORT_ACK, DEVICE_STATUS, and ADMIN_OVERRIDE.
3. Browser Print invocation alone remains DISPATCHED.
4. Cleanter transport acknowledgment alone remains DISPATCHED unless user confirmation/callback exists.

## TP-R31: Print attempts

**Priority:** P0

### Acceptance Criteria

1. Every dispatch/retry appends an attempt.
2. Attempt stores station, transport, renderer version, payload hash/size, timings, result, evidence, and safe error.
3. Attempts are append-only.
4. Attempt history is visible to authorized operations.

## TP-R32: Idempotency and accidental duplicates

**Priority:** P0

### Acceptance Criteria

1. Job creation accepts an idempotency key and request hash.
2. Same key and payload returns the existing job.
3. Same key with different payload fails.
4. Double-clicking Print does not create unintended duplicates.

## TP-R33: Reprint

**Priority:** P0

### Acceptance Criteria

1. Reprint is an explicit permissioned action.
2. It uses the original snapshot by default and links to the original job.
3. A REPRINT marker and reprint time may be shown.
4. Refund/correction uses a new document instead of rewriting the original.

## TP-R34: Copies

**Priority:** P1

### Acceptance Criteria

1. Jobs support bounded copies.
2. Elevated copy counts may require permission.
3. All copies use the same snapshot/template version.
4. Copy count is recorded.

## TP-R35: Manual print actions

**Priority:** P0

### Acceptance Criteria

1. Alpha supports Preview, Print Receipt, Reprint, Test Print, and Print History.
2. Manual dispatch requires a user gesture.
3. Users choose an eligible station when multiple are available.
4. Failures offer Retry and Preview fallback.

## TP-R36: Auto-print foundation

**Priority:** P1

### Acceptance Criteria

1. Auto-print is disabled by default in alpha.
2. Future policy is per outlet, document, trigger, and active station.
3. Only one station may claim an auto-print job.
4. Auto-print failure never changes order/payment truth.

## TP-R37: Claim and lease

**Priority:** P1

### Acceptance Criteria

1. Auto-print claims use a time-bounded lease.
2. Only one station holds an active claim.
3. Expired leases are reclaimable safely.
4. Claim, completion, and expiry are concurrency tested.

## TP-R38: Station health

**Priority:** P1

### Acceptance Criteria

1. Stations may report heartbeat and safe health metadata.
2. States are UNKNOWN, ONLINE, DEGRADED, OFFLINE, and DISABLED.
3. Health considers last seen, bridge availability, binding, and recent failures.
4. Unsupported paper/device status is not fabricated.

## TP-R39: Test print

**Priority:** P0

### Acceptance Criteria

1. Authorized users can generate a TEST_PAGE without an order.
2. It shows platform, transport, station, profile, width, line width, encoding, capabilities, and time.
3. Output is clearly marked TEST PAGE.
4. Test history is separate from live receipts.

## TP-R40: Setup workflow

**Priority:** P0

### Acceptance Criteria

1. UI includes platform-specific setup for Linux, Windows, and Android.
2. Desktop covers Browser Print and optional direct bridge.
3. Android covers Cleanter install/start, Bluetooth pairing, printer selection, registration, binding, and test.
4. Setup validates width and encoding without storing passwords.

## TP-R41: Preview

**Priority:** P0

### Acceptance Criteria

1. All printable documents are previewable.
2. Preview shows document type, mode, width, order/payment states, and content.
3. It uses the exact snapshot/template version of the job.
4. Preview works while the printer is offline.

## TP-R42: Orders sidebar integration

**Priority:** P0

### Acceptance Criteria

1. Order detail sidebar exposes printing eligibility, station, transport, profile, last job, evidence, and errors.
2. Actions include Preview, Print Receipt, Reprint, Test Printer, Print History, and Settings when authorized.
3. Controls are permission/capability driven.
4. The card does not obscure core order metadata.

## TP-R43: Print history

**Priority:** P0

### Acceptance Criteria

1. History filters by workspace, outlet, order, document, station, transport, status, actor, mode, and date.
2. Rows show requested time, copies, status, evidence, actor, and safe error.
3. Attempt detail is available.
4. Pagination and counts use the same authorization scope.

## TP-R44: Stable error model

**Priority:** P0

### Acceptance Criteria

1. Errors include PRINT_NOT_ELIGIBLE, PAYMENT_NOT_PAID, PRINTER_NOT_CONFIGURED, STATION_OFFLINE, TRANSPORT_UNSUPPORTED, BRIDGE_UNAVAILABLE, CLEANTER_UNAVAILABLE, CLEANTER_CORS_BLOCKED, CLEANTER_LOCAL_NETWORK_PERMISSION_DENIED, CLEANTER_TIMEOUT, CLEANTER_PRINT_REJECTED, PAYLOAD_TOO_LARGE, PAPER_WIDTH_UNSUPPORTED, ENCODING_UNSUPPORTED, PRINT_TIMEOUT, PRINT_DISPATCH_FAILED, PRINT_ALREADY_CLAIMED, VERSION_CONFLICT, and IDEMPOTENCY_CONFLICT.
2. Errors do not leak other tenants or outlets.
3. Raw OS/bridge errors are sanitized.
4. Errors map to actionable UI states.

## TP-R45: Authorization and RLS

**Priority:** P0

### Acceptance Criteria

1. Print actions require workspace membership and access to the order outlet.
2. Settings/station/template management require dedicated permissions.
3. Tenant-owned tables include workspace_id and outlet-bound records include outlet_id.
4. Repositories and Supabase RLS enforce the same scope.

## TP-R46: Privacy and data minimization

**Priority:** P0

### Acceptance Criteria

1. Snapshots contain only necessary customer/payment data.
2. Keys, webhook tokens, credentials, and raw provider payloads never appear.
3. Kitchen tickets omit payment details and unnecessary customer identifiers.
4. Logs avoid raw receipt payloads beyond approved snapshot storage.

## TP-R47: Local transport security

**Priority:** P0

### Acceptance Criteria

1. Local bridges and deep links receive no backend credentials.
2. Deep links contain no access tokens.
3. Direct bridges require an approved trust/signing model.
4. Web Bluetooth requires secure context and explicit permission.

## TP-R48: API contracts

**Priority:** P0

### Acceptance Criteria

1. APIs use strict schemas, stable errors, permissions, idempotency, and version checks.
2. Rendering responses are bounded and content-type correct.
3. Endpoints cover profiles, templates, stations, bindings, jobs, attempts, rendering, dispatch, completion, failure, retry, reprint, and test print.
4. API docs include platform expectations.

## TP-R49: Events, audit, and observability

**Priority:** P0

### Acceptance Criteria

1. Job, attempt, station, profile, template, reprint, test, and override actions emit versioned events and audit records.
2. Reliable outbox is used for critical consumers.
3. Metrics cover created, dispatched, completed, failed, retried, transport, health, render time, payload size, and errors.
4. Logs and metrics exclude secrets and unnecessary PII.

## TP-R50: Testing, rollout, and operational readiness

**Priority:** P0

### Acceptance Criteria

1. TDD includes unit, component, integration, security, property, concurrency, resilience, visual, binary, platform, and E2E tests.
2. Linux and Windows Browser Print and Android physical Cleanter/Inforce testing are required.
3. Phase 1 delivers snapshots, preview, Browser Print, Cleanter, Mock, manual jobs, test page, reprint, history, and sidebar.
4. Printing failure never blocks order completion, and all release gates plus runbooks are required.


---
# Alpha Slice

```text
canonical receipt snapshot
CUSTOMER_RECEIPT + TEST_PAGE
58 mm and 80 mm template
HTML preview
ESC/POS renderer
Mock transport
Browser Print for Linux/Windows
Cleanter for Android
printer profile
print station and local binding
manual print
reprint
test print
history
Orders sidebar card
authorization/RLS
idempotency and honest completion evidence
manual platform tests
```

# Definition of Done

1. Linux and Windows support Preview and Browser Print.
2. Android physically prints through Cleanter to the target Inforce printer.
3. Mock supports development without hardware.
4. Receipt uses immutable order snapshots and verified payment state.
5. Dispatch is not falsely reported as physical completion.
6. Reprint is explicit, linked, and audited.
7. Other outlets cannot access or print the job.
8. Printer failure never blocks order completion.
9. Release-gate tests and `npm run specs:check` pass.
