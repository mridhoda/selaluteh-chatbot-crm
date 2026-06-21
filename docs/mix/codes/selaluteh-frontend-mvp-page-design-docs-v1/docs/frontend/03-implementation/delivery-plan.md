# Delivery Plan

## Phase 0 — Read and audit

- Read backend docs listed in README.
- Inspect current module implementations and routes.
- Confirm current build and lint baseline.
- Confirm existing API response shapes.
- Do not change backend contracts by assumption.

## Phase 1 — Shared UI behavior

- PageHeader pattern.
- Filter bar and active chips.
- Status badges with domain mapping.
- Drawer/modal states.
- Loading/empty/error patterns.

Do not redesign Orders page during this task unless shared extraction requires a safe, visual-equivalent change.

## Phase 2 — Connected Platforms

Reason: existing API and UI already exist.

- migrate/refine current platform UI;
- add honest connection/webhook/capability state;
- preserve Telegram setWebhook flow;
- mask secrets.

## Phase 3 — Chat Center

Reason: existing functionality is critical and already available.

- preserve current behavior;
- add outlet/order/payment context progressively;
- keep polling stable;
- do not break takeover.

## Phase 4 — Products

- implement catalog page and form against real API when available;
- if API is not ready, use a clearly isolated mock adapter only for visual development;
- no fake persistence presented as production-ready.

## Phase 5 — Settings

- mount/verify backend route first;
- implement section-level forms;
- payment provider configuration in sandbox mode;
- secrets write-only.

## Phase 6 — Payments

- implement after payment data model and gateway endpoints exist;
- list, detail, event timeline, link actions;
- no manual paid action.

## Phase 7 — Hardening

- role/outlet access checks;
- responsive states;
- accessibility;
- loading/error/empty states;
- build/lint/tests.

## Scope guard

Do not add in this delivery:

```txt
multi-seller
voucher engine
complex inventory reservation
shipping provider
refund automation
loyalty
public storefront
```
