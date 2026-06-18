# Pre-Cutover Checklist — Supabase Fresh Start

Use this before switching any backend runtime domain from legacy Mongo/Mongoose to Supabase/Postgres.

## Cutover Decisions

- [ ] End state is full Supabase/Postgres backend runtime.
- [ ] Cutover is staged domain-by-domain.
- [ ] MongoDB/Mongoose is legacy-only and must not be used for new features.
- [ ] No Mongo data backfill.
- [ ] No dual-write.
- [ ] No legacy data reconciliation.
- [ ] Custom backend auth remains in this cutover.
- [ ] Supabase Auth is deferred to a separate future spec.

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

## Supabase Readiness

- [ ] Supabase project created.
- [ ] SQL migrations run in Supabase local or dedicated non-production test project.
- [ ] SQL migrations reviewed before production.
- [ ] Phase 1 access model is backend service-role only.
- [ ] RLS policies reviewed as future preparation, not required for frontend direct reads yet.
- [ ] Service role key stored server-side only.
- [ ] `SUPABASE_DATABASE_URL` stored server-side only.
- [ ] Anon key is safe to expose only if frontend direct reads are intentionally enabled.
- [ ] Supabase Auth migration is deferred.
- [ ] Persistent local upload directory prepared.
- [ ] Docker/server deployment will not wipe uploads.
- [ ] Upload directory backup strategy prepared.
- [ ] Fresh dev/test seed data prepared.
- [ ] `sql/009_migration_validation_queries.sql` tested after migrations and seed data.

## Marketplace Readiness Before Enabling Commerce

- [ ] Product catalog admin flow exists or seed products are ready.
- [ ] Cart service is deterministic.
- [ ] Checkout confirmation exists.
- [ ] Order items are created from cart snapshot.
- [ ] Checkout items are created from cart snapshot where needed.
- [ ] AI is prevented from directly creating paid orders.
- [ ] Payment sandbox keys are configured server-side.
- [ ] Payment webhook signature verification is implemented.
- [ ] Telegram inline keyboard/callback idempotency is implemented.

## Testing Readiness

- [ ] Existing MongoMemory tests are retained only for legacy domains not yet cut over.
- [ ] No new Mongo tests are added.
- [ ] New repositories/features use Supabase tests.
- [ ] Supabase tests use Supabase local or a dedicated Supabase test project, not production.
- [ ] Each completed domain has repository tests, integration tests, and security/isolation tests.
