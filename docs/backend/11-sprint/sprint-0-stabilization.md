# Sprint 0 — Stabilization

## Objective

Secure and stabilize the existing CRM backend before adding marketplace features.

## Scope

- Auth hardening.
- Workspace isolation.
- Diagnostic route cleanup.
- Existing behavior preservation.

## Tasks

### 1. Secure Orders

- Add auth.
- Add workspace scope.
- Validate ownership on update/delete.
- Return safe errors.

### 2. Secure Complaints

- Add auth.
- Add workspace scope.
- Validate ownership on update/delete.

### 3. Diagnostic Routes

- Remove from production or protect behind owner/super + dev env.

### 4. Settings Route

- Mount existing route if still used.
- Or remove frontend dependency.

### 5. Regression Smoke Test

- Login.
- Dashboard.
- Inbox.
- Telegram webhook.
- Human takeover.
- AI reply.

## Definition of Done

- Security P0 risks reduced.
- No marketplace feature added yet.
- Existing CRM remains stable.
