# Current Task

Dokumen ini mendefinisikan prioritas kerja saat ini untuk AI coding agent.

## Current Objective

Mengubah backend existing dari **Chatbot CRM** menjadi fondasi aman untuk **Telegram-first Marketplace MVP**, tanpa merusak fitur existing.

## Recommended Current Sprint

### Sprint 0 — Stabilization & Marketplace Foundation

Goal:

```txt
Backend existing tetap berjalan, security risk utama dibereskan, dan data model/service boundary siap untuk product/cart/order/payment.
```

### Priority Tasks

1. Secure `orders` routes dengan auth dan workspace scope.
2. Secure `complaints` routes dengan auth dan workspace scope.
3. Remove/protect public diagnostic user routes.
4. Mount atau putuskan status `settings` route.
5. Tambahkan webhook idempotency plan/model.
6. Tambahkan repository layer skeleton.
7. Tambahkan product catalog module.
8. Tambahkan cart module.
9. Tambahkan Telegram inline keyboard helper.
10. Tambahkan payment provider abstraction untuk sandbox.

## Do First

Sebelum menambahkan fitur besar, pastikan:

- app masih bisa login,
- dashboard bisa load,
- Telegram webhook masih bisa menerima pesan,
- human takeover masih menghentikan AI,
- message history masih tersimpan.

## Do Not Do Yet

Jangan dulu implement:

- multi-seller,
- wallet seller,
- payout seller,
- voucher kompleks,
- shipping aggregator,
- refund automation,
- production payment live mode.

## Acceptance Criteria

Task dianggap selesai jika:

- existing CRM behavior tidak rusak,
- endpoint baru workspace-scoped,
- Telegram user bisa minimal melihat product list,
- cart bisa dibuat secara deterministic,
- order tidak dibuat langsung dari AI tanpa validasi backend,
- docs/API/schema yang berubah ikut diperbarui.
