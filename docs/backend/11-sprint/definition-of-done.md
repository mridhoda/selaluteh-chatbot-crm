# Definition of Done

Dokumen ini mendefinisikan standar selesai untuk setiap task/sprint.

## Global Definition of Done

Sebuah task dianggap selesai jika:

- [ ] Requirement utama terpenuhi.
- [ ] Tidak merusak login/dashboard/inbox existing.
- [ ] Tidak merusak Telegram webhook existing.
- [ ] Workspace isolation dipertahankan.
- [ ] Error handling jelas.
- [ ] File yang diubah disebutkan di task result.
- [ ] Manual atau automated test dilakukan/dicatat.
- [ ] Tidak ada secret baru yang hardcoded.
- [ ] Tidak ada endpoint publik berbahaya.
- [ ] Dokumentasi terkait diperbarui jika behavior berubah.

## Backend API DoD

- [ ] Auth requirement jelas.
- [ ] Workspace scope diterapkan.
- [ ] Request validation ada.
- [ ] Response format konsisten.
- [ ] Error format konsisten.
- [ ] Pagination/filtering dipertimbangkan untuk list endpoint.
- [ ] Cross-workspace access ditolak.

## Database DoD

- [ ] Migration bisa dijalankan di fresh database.
- [ ] Foreign key dan index penting ada.
- [ ] `workspace_id` ada untuk tenant-owned table.
- [ ] Created/updated timestamp ada.
- [ ] RLS policy dipertimbangkan.
- [ ] Backfill implication dicatat.

## Telegram Flow DoD

- [ ] Callback payload divalidasi.
- [ ] Duplicate webhook tidak membuat duplicate action.
- [ ] Message reply disimpan.
- [ ] Human takeover tidak rusak.
- [ ] AI skip saat takeover tetap bekerja.
- [ ] User mendapat feedback jelas.

## Payment DoD

- [ ] Payment link dibuat dari server.
- [ ] Payment row tersimpan.
- [ ] Webhook diverifikasi.
- [ ] Payment event dicatat.
- [ ] Duplicate webhook idempotent.
- [ ] Order status diupdate oleh backend, bukan AI.
- [ ] Telegram notification dikirim setelah status berubah.

## AI Feature DoD

- [ ] AI tidak menjadi source of truth untuk payment/order status.
- [ ] AI action divalidasi backend.
- [ ] Prompt injection risk dipertimbangkan.
- [ ] Human handoff tersedia untuk ambiguity.

## Sprint DoD

Sprint dianggap selesai jika:

- [ ] Semua P0 task sprint selesai.
- [ ] Acceptance criteria terpenuhi.
- [ ] Regression checklist minimal dijalankan.
- [ ] Progress log diperbarui.
- [ ] Risk log diperbarui.
- [ ] Next sprint recommendation ditulis.
