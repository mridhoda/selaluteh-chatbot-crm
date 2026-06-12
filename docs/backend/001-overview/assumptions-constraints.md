# Assumptions and Constraints

## Assumptions

### Product Assumptions

- MVP starts as single-merchant commerce.
- Telegram is the first customer-facing commerce channel.
- WhatsApp/Instagram remain CRM channels for now.
- Customer can use external payment link.
- Admin uses existing dashboard as the operations center.
- AI is helpful for product Q&A but deterministic buttons should drive checkout.

### Technical Assumptions

- Existing backend is Express-based.
- Existing frontend is React/Vite.
- Existing runtime database is MongoDB/Mongoose.
- Target data layer is Supabase/Postgres.
- Large media remains in local server storage.
- Payment gateway starts with sandbox mode.
- Backend controls payment creation and webhook validation.
- Telegram bot uses webhook.

### Data Assumptions

- Every workspace-owned row should have `workspace_id`.
- Current Mongo ObjectIds should not be reused as Postgres UUIDs.
- Migration requires ID mapping.
- File binaries remain outside Postgres.
- File metadata is stored in database.

## Constraints

### MVP Constraints

- Do not build multi-seller marketplace in MVP.
- Do not build wallet/payout in MVP.
- Do not build advanced logistics in MVP.
- Do not depend on AI for critical payment/order decisions.
- Do not require full frontend storefront.

### Security Constraints

- Payment webhook must be verified.
- Orders/complaints must require auth.
- Workspace isolation must be enforced.
- Service role key must remain server-side.
- Secrets must not be committed.
- Public file URLs must be intentionally accepted or replaced later with protected media endpoint.

### Operational Constraints

- Local uploads require persistent volume or backup.
- Webhooks require public HTTPS endpoint.
- Cutover from Mongo to Supabase requires maintenance window or dual-write strategy.
- Existing CRM behavior must not be broken by marketplace changes.

## Unknowns

- Final payment provider choice: Midtrans, Xendit, or manual sandbox abstraction.
- Whether Supabase Auth will replace custom JWT auth in first migration.
- Whether product images need protected access.
- Whether inventory is simple stock count or future reservation system.
- Whether WhatsApp commerce comes immediately after Telegram MVP or later.
