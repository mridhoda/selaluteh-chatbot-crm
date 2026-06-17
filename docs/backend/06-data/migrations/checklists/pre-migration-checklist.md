# Pre-Migration Checklist — v3 Pre-MCP

Use this before any Supabase MCP write or staging import. The current runtime remains MongoDB/Mongoose until a staged cutover is explicitly approved.

## Code Safety

- [ ] Orders routes require auth.
- [ ] Complaints routes require auth.
- [ ] Orders are workspace-scoped.
- [ ] Complaints are workspace-scoped.
- [ ] Settings route is mounted or frontend dependency is removed.
- [ ] Diagnostic routes are removed or protected.
- [ ] Webhook duplicate message handling is implemented or planned.
- [ ] Webhook idempotency uses provider + platform + external event id.
- [ ] File upload size/type limits are defined.
- [ ] Platform tokens/secrets are not logged.
- [ ] `.env` is not committed.
- [ ] Any exposed secret has been rotated.
- [ ] Direct Mongoose access remaining outside repositories is documented for staged cutover.

## Data Safety

- [ ] Mongo backup exists.
- [ ] Local `uploads` backup exists.
- [ ] Database backup and uploads backup are from the same time window.
- [ ] Distinct workspace ids are counted.
- [ ] `mongo_id_map` strategy is approved and deterministic for every migrated collection.
- [ ] Orphan chats are identified.
- [ ] Orphan messages are identified.
- [ ] Missing contact/platform/agent references are identified.
- [ ] Legacy order statuses are mapped.
- [ ] Cart, checkout, order, and payment embedded arrays are mapped to relational rows.
- [ ] Payment embedded events are deduped against standalone `PaymentEvent` rows.
- [ ] Manual payment proof files are mapped.
- [ ] Sparse unique Mongo indexes are mapped to Postgres partial unique indexes.

## Supabase Readiness

- [ ] Supabase project created.
- [ ] SQL migrations run in staging.
- [ ] SQL migrations reviewed but not applied to production.
- [ ] Phase 1 access model is backend service-role only.
- [ ] RLS policies reviewed as future preparation, not required for frontend direct reads yet.
- [ ] Service role key stored server-side only.
- [ ] Anon key is safe to expose only if frontend direct reads are intentionally enabled.
- [ ] Supabase Auth migration is deferred or separately approved.
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
- [ ] Checkout items are created from cart snapshot for migration parity.
- [ ] AI is prevented from directly creating paid orders.
- [ ] Payment sandbox keys are configured server-side.
- [ ] Payment webhook signature verification is implemented.
- [ ] Telegram inline keyboard/callback idempotency is implemented.

## Manual Decisions Required Before MCP Write

- [ ] Confirm staging project target and credentials source.
- [ ] Confirm platform secret strategy: encrypt before import or rotate after import.
- [ ] Confirm whether optional missing outlet/contact/chat references are backfilled or rejected.
- [ ] Confirm `payments.events[]` handling: migrate all deduped events or only canonical standalone events.
- [ ] Confirm rollback window and whether writes are frozen during import.
