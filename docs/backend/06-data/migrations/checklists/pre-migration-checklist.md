# Pre-Migration Checklist — v2

## Code Safety

- [ ] Orders routes require auth.
- [ ] Complaints routes require auth.
- [ ] Orders are workspace-scoped.
- [ ] Complaints are workspace-scoped.
- [ ] Settings route is mounted or frontend dependency is removed.
- [ ] Diagnostic routes are removed or protected.
- [ ] Webhook duplicate message handling is implemented or planned.
- [ ] File upload size/type limits are defined.
- [ ] Platform tokens/secrets are not logged.
- [ ] `.env` is not committed.
- [ ] Any exposed secret has been rotated.

## Data Safety

- [ ] Mongo backup exists.
- [ ] Local `uploads` backup exists.
- [ ] Database backup and uploads backup are from the same time window.
- [ ] Distinct workspace ids are counted.
- [ ] Orphan chats are identified.
- [ ] Orphan messages are identified.
- [ ] Missing contact/platform/agent references are identified.
- [ ] Legacy order statuses are mapped.
- [ ] Manual payment proof files are mapped.

## Supabase Readiness

- [ ] Supabase project created.
- [ ] SQL migrations run in staging.
- [ ] RLS policies reviewed.
- [ ] Service role key stored server-side only.
- [ ] Anon key is safe to expose only if frontend direct reads are intentionally enabled.
- [ ] Persistent local upload directory prepared.
- [ ] Docker/server deployment will not wipe uploads.
- [ ] Upload directory backup strategy prepared.
- [ ] Import script tested on sample data.
- [ ] `sql/009_migration_validation_queries.sql` tested.

## Marketplace Readiness Before Enabling Commerce

- [ ] Product catalog admin flow exists or seed products are ready.
- [ ] Cart service is deterministic.
- [ ] Checkout confirmation exists.
- [ ] Order items are created from cart snapshot.
- [ ] AI is prevented from directly creating paid orders.
- [ ] Payment sandbox keys are configured server-side.
- [ ] Payment webhook signature verification is implemented.
- [ ] Telegram inline keyboard/callback idempotency is implemented.
