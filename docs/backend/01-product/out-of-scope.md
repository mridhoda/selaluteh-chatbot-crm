# Out of Scope

Dokumen ini menjelaskan fitur yang sengaja tidak masuk MVP agar implementasi tetap fokus.

## Not in MVP

### Multi-Seller Marketplace

Tidak termasuk:

- seller onboarding,
- seller profile/store page,
- seller dashboard,
- seller-specific catalog,
- seller wallet,
- commission,
- payout.

Reason:

- terlalu banyak complexity sebelum chat → cart → payment terbukti jalan.

### Logistics Integration

Tidak termasuk:

- RajaOngkir/Shipper/3PL integration,
- auto shipping label,
- courier tracking,
- shipping fee by API.

MVP boleh memakai manual fulfillment status.

### Refund Automation

Tidak termasuk:

- automated refund to payment gateway,
- refund request portal,
- partial refund.

MVP cukup manual admin process.

### Promo/Voucher

Tidak termasuk:

- coupon code,
- discount rules,
- campaign engine,
- bundle pricing.

Reason:

- promo akan mengubah order/payment calculations dan menambah edge cases.

### Public Web Storefront

Tidak termasuk:

- public product website,
- SEO storefront,
- customer web account.

MVP fokus ke Telegram.

### Advanced AI Agent

Tidak termasuk:

- autonomous sales agent tanpa guardrail,
- AI directly creating paid order,
- AI modifying stock/payment,
- custom model fine-tuning.

AI hanya assistant yang action-nya divalidasi backend.

### Advanced Inventory

Tidak termasuk:

- warehouse management,
- batch/lot tracking,
- stock reservation timeout kompleks,
- multi-warehouse.

MVP boleh menggunakan stock sederhana atau unlimited flag.

### Enterprise Features

Tidak termasuk:

- SSO,
- audit compliance export,
- complex role matrix,
- data warehouse,
- custom SLA.

## Revisit After MVP

Fitur yang bisa dievaluasi setelah MVP:

1. WhatsApp commerce.
2. Promo/voucher.
3. Delivery fee calculator.
4. Refund workflow.
5. Multi-seller foundation.
6. Seller payout.
7. Advanced analytics.
8. AI campaign generator.
