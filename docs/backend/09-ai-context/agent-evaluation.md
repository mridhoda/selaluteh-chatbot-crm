# Agent Evaluation

Dokumen ini membantu mengevaluasi apakah output AI coding agent layak dipakai.

## Good Output Signs

AI output bagus jika:

- memahami app existing sebagai CRM chatbot, bukan greenfield,
- menjaga Telegram webhook existing,
- menjaga human takeover,
- memakai workspace scope,
- tidak menaruh secret,
- tidak menjadikan AI sebagai source of truth payment/order,
- menambahkan validasi dan error handling,
- memperbarui docs terkait.

## Bad Output Signs

Hati-hati jika AI:

- menghapus fitur existing tanpa alasan,
- mengganti Mongo ke Supabase sekaligus tanpa repo layer/cutover plan,
- membuat payment paid dari input user,
- membuat order langsung dari prompt AI tanpa confirmation,
- mengekspos service role ke frontend,
- membuat route admin tanpa auth,
- menyimpan file binary di database,
- mengabaikan workspace_id.

## Review Checklist

- [ ] Apakah perubahan sesuai task?
- [ ] Apakah route protected?
- [ ] Apakah workspace scoped?
- [ ] Apakah idempotency dipikirkan?
- [ ] Apakah payment/signature aman?
- [ ] Apakah AI action tervalidasi?
- [ ] Apakah existing behavior masih aman?
- [ ] Apakah tests/manual checks tersedia?

## Merge Readiness

Jangan merge jika:

- test/smoke check belum jelas,
- perubahan terlalu besar tanpa alasan,
- ada secret di diff,
- ada breaking change API tanpa update docs,
- ada route publik yang bisa mengubah data tenant.
