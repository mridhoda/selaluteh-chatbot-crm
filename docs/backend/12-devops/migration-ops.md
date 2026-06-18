# Migration Operations

## Scope

This document covers operational steps for the staged MongoDB/Mongoose to Supabase/Postgres runtime cutover.

Current rule: Supabase/Postgres is the final runtime end-state. Cut over domain-by-domain and start fresh from Supabase. Do not import Mongo data, dual-write, or reconcile legacy Mongo data.

## Migration Rule

Do not perform production cutover without:

- Supabase migrations applied and reviewed.
- Fresh Supabase seed data for dev/test validated.
- Supabase repository, integration, and security tests passing for completed domains.
- Service role key and database URL stored server-side only.
- Auth phase-1 decision: custom backend auth with service-role Supabase access.
- Rollback/stop plan for partially cut domains.
- Maintenance window if switching live webhook or payment paths.

## Pre-Cutover

- [ ] Freeze or pause writes if switching a live domain.
- [ ] Stop webhooks or point to maintenance endpoint if webhook domains are being switched.
- [ ] Stop background jobs if their domain is being switched.
- [ ] Confirm Supabase migrations applied.
- [ ] Confirm service role key server-side only.
- [ ] Confirm `SUPABASE_DATABASE_URL` server-side only.
- [ ] Confirm Supabase Auth is deferred unless separately approved.
- [ ] Confirm test target is Supabase local or a dedicated Supabase test project, not production.
- [ ] Confirm no Mongo backfill, dual-write, or legacy reconciliation will be performed.

## Staged Cutover Order

1. Supabase foundation.
2. Workspaces, users, memberships.
3. Outlets and user outlet access.
4. Platforms, integrations, webhook events.
5. Contacts, chats, messages.
6. Products and outlet availability.
7. Carts and checkout sessions.
8. Orders and order items.
9. Payments and payment events.
10. Complaints, files, settings.
11. Agents, AI actions, knowledge.
12. Remove MongoDB and Mongoose.

## Post-Cutover

- [ ] Start backend on Supabase env.
- [ ] Keep frontend direct table reads disabled unless explicitly approved.
- [ ] Run smoke tests.
- [ ] Re-enable webhooks.
- [ ] Monitor logs.
- [ ] Remove legacy Mongo path only after all domains are Supabase-backed and tests pass.

## Validation Gates

- `sql/009_migration_validation_queries.sql` returns no orphan/cross-workspace rows.
- Duplicate checks return no rows for webhook events, payment events, checkout idempotency keys, and order numbers.
- Payment sandbox webhook proves `orders.payment_status` and `payment_events.processing_status` updates work.
- Full regression/security test suite passes after Mongo removal.

## Rollback

Rollback/stop plan during staged cutover:

- revert only the not-yet-released code path for the current domain;
- do not dual-write as a rollback substitute;
- do not depend on Mongo as long-term runtime fallback;
- after final Mongo removal, rollback must be a normal application/database restore plan around Supabase backups and deployments.
