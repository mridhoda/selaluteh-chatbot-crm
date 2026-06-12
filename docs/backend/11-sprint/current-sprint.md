# Current Sprint

Use this file to define the active sprint.

## Sprint Name

Sprint 0 — Stabilize Existing CRM

## Goal

Make the existing backend safe enough to extend into Telegram Marketplace MVP.

## Why This Sprint First

Marketplace and payment cannot be safely added while existing order/complaint routes are public, webhook idempotency is missing, and AI side effects are too close to raw route/service logic.

## Tasks

- [ ] Secure orders routes.
- [ ] Secure complaints routes.
- [ ] Protect/remove diagnostic routes.
- [ ] Mount settings route or resolve UI dependency.
- [ ] Add smoke test checklist.
- [ ] Document current known issues.
- [ ] Confirm Telegram webhook still works after changes.

## Files Likely To Change

- `server/src/routes/orders.js`
- `server/src/routes/complaints.js`
- `server/src/routes/users.js`
- `server/src/index.js`
- `server/src/middleware/auth.js`
- `docs/backend/11-sprint/implementation-status.md`
- `docs/backend/11-sprint/progress-log.md`

## Acceptance Criteria

- Unauthenticated users cannot access orders.
- Unauthenticated users cannot access complaints.
- Workspace isolation is enforced.
- Existing dashboard/inbox/Telegram flow still works.
- Progress log is updated.
