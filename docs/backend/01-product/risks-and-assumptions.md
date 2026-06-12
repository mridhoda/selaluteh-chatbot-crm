# Risks and Assumptions

## Product Assumptions

1. Customer target nyaman transaksi lewat Telegram.
2. Single merchant cukup untuk MVP.
3. Payment link sandbox cukup untuk validasi flow.
4. Existing CRM dashboard bisa menjadi base admin operations.
5. AI assistant meningkatkan conversion atau mengurangi beban CS.
6. Local storage cukup untuk phase awal.

## Technical Assumptions

1. Existing Telegram webhook bisa dipertahankan.
2. MongoDB → Supabase migration dilakukan bertahap.
3. Workspace scoping bisa diterapkan secara konsisten.
4. Payment provider mendukung sandbox webhook.
5. Local uploads bisa dipersist dan dibackup.
6. Backend dapat memakai service role Supabase secara aman.

## Product Risks

| Risk | Impact | Mitigation |
|---|---|---|
| Customer tidak mau checkout lewat Telegram | MVP adoption rendah | Test with small product set and real users |
| AI menjawab harga/stok salah | Trust menurun | AI wajib query product data, not invent |
| Admin bingung dengan terlalu banyak fitur | Operations lambat | Keep MVP UI simple |
| Payment link membuat user keluar dari chat | Drop-off | Clear instruction and confirmation message |
| Catalog tidak rapi | Conversion turun | Product form should enforce required fields |

## Technical Risks

| Risk | Impact | Mitigation |
|---|---|---|
| Duplicate webhook creates duplicate order | Data corruption | webhook_events + idempotency keys |
| Payment webhook spoofing | Fake paid order | signature verification mandatory |
| Workspace leak | Critical security issue | workspace filter + RLS + tests |
| Local uploads wiped during deploy | Data loss | persistent volume + backups |
| Migration corrupts ID references | Broken data | mongo_id_map + validation report |
| AI side effects too coupled | Hard to maintain | ai_actions + service validation layer |

## Migration Risks

- Mongo ObjectId cannot be reused as UUID.
- Existing workspace is implicit, target workspace is explicit.
- Agent nested arrays must be normalized carefully.
- Message attachments need file metadata mapping.
- Timestamps must be preserved for chat ordering.

## Business Risks

- Payment provider approval/production activation may take time.
- Telegram as first channel may not match all customer segments.
- Marketplace expectation may grow too fast beyond MVP.

## Risk Priority

Highest priority risks before MVP launch:

1. Payment webhook security.
2. Workspace data isolation.
3. Webhook idempotency.
4. Order/cart consistency.
5. Local file backup.
6. AI commerce guardrails.
