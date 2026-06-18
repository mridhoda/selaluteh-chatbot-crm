Berikut prompt yang tepat untuk menjalankan task perubahan MongoDB/Mongoose ke Supabase secara total, tapi tetap aman domain-by-domain.

Gunakan ini sebagai **master prompt** untuk agent/coding assistant:

```txt
Kita akan menjalankan Supabase/Postgres cutover sesuai keputusan final di `specs/active/general-backend/tasks.md` section 24.

Tujuan akhir:
- Seluruh backend runtime pindah ke Supabase/Postgres.
- MongoDB/Mongoose hanya legacy sementara.
- Tidak boleh ada MongoDB/Mongoose untuk fitur baru.
- Setelah semua domain selesai, hapus Mongo connection, Mongoose models, Mongoose dependency, MongoMemoryServer, `DATA_SOURCE=mongo` fallback, dan obsolete Mongo env variables.

Keputusan final yang wajib diikuti:
- Full Supabase end-state.
- Staged domain-by-domain cutover.
- Start fresh from Supabase.
- No Mongo data backfill.
- No dual-write.
- No legacy data reconciliation.
- Custom backend authentication tetap dipakai.
- Jangan migrasi ke Supabase Auth dalam cutover ini.
- Supabase Auth hanya boleh dibahas sebagai spec terpisah setelah database runtime stabil.
- Supabase service role key hanya boleh backend-only.
- Jangan expose `SUPABASE_SERVICE_ROLE_KEY` atau `SUPABASE_DATABASE_URL` ke frontend, Git, logs, test fixture, atau dokumentasi berisi secret asli.
- Automated tests harus memakai Supabase local atau dedicated Supabase test project, bukan production project.
- MongoMemory tests boleh dipertahankan sementara hanya untuk regression coverage domain legacy yang belum dipindah.
- Jangan menambah test Mongo baru.
- Semua repository/feature baru wajib memakai Supabase tests.

Sebelum mengubah kode:
1. Baca dan ikuti:
   - `specs/active/general-backend/tasks.md`
   - `specs/active/general-backend/requirements.md`
   - `specs/active/general-backend/design.md`
   - `docs/backend/06-data/repository-layer-contract.md`
   - `docs/backend/06-data/migration-plan.md`
   - `docs/backend/06-data/migrations/notes/cutover-plan.md`
   - `docs/backend/10-testing/migration-test-plan.md`
   - `docs/backend/09-ai-context/database-context.md`
   - `docs/backend/09-ai-context/testing-expectations.md`
   - `docs/backend/09-ai-context/security-rules-for-ai.md`
2. Inspect current repository/service/model structure.
3. Buat todo list rinci berdasarkan section 24.
4. Jangan langsung big-bang rewrite semua domain.
5. Mulai dari task 24.2 Supabase foundation jika belum lengkap.
6. Setelah foundation, lanjut domain priority ini:
   0. Supabase foundation
   1. workspaces / users / memberships
   2. outlets / user outlet access
   3. platforms / integrations / webhook events
   4. contacts / chats / messages
   5. products / outlet availability
   6. carts / checkout sessions
   7. orders / order items
   8. payments / payment events
   9. complaints / files / settings
   10. agents / AI actions / knowledge
   11. remove MongoDB and Mongoose

Scope implementasi untuk setiap domain:
- Buat/rapikan Supabase repository.
- Tambahkan mapper camelCase app object <-> snake_case DB row.
- Pastikan semua query tenant-owned menerima `workspaceId`.
- Pastikan outlet-scoped query menerima outlet scope/access.
- Jangan return raw Supabase SDK response ke service/route.
- Jangan return Mongoose document shape dari repository baru.
- Hapus direct Mongoose access untuk domain yang sudah cut over.
- Tambahkan Supabase repository tests.
- Tambahkan integration tests untuk route/service path domain tersebut.
- Tambahkan security/isolation tests untuk workspace/outlet isolation.
- Jalankan relevant tests.
- Update docs/spec jika ada perubahan kontrak.

Supabase foundation wajib mencakup:
- client setup
- environment validation
- SQL migrations readiness
- camelCase/snake_case mapping
- repository conventions
- error mapping
- transaction conventions
- workspace/outlet scoping
- Supabase test database setup

Environment expected:
```env
DATA_SOURCE=supabase
SUPABASE_URL=https://hxeljduldgynligjioff.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<server-only-service-role-key>
SUPABASE_DATABASE_URL=<server-only-postgres-connection-string>
```

Jangan meminta atau mencetak secret asli. Kalau secret tidak tersedia, implementasikan code/config/test scaffolding dengan placeholder aman dan jelaskan validasi live yang belum bisa dijalankan.

Validation minimum setelah setiap domain:
- relevant Supabase repository tests pass
- relevant integration tests pass
- relevant security/isolation tests pass
- `npm run specs:check` pass jika specs/docs berubah
- full backend test run jika perubahan cukup besar atau menyentuh shared runtime

Aturan final removal:
Jangan hapus Mongo connection, Mongoose models, Mongoose dependency, MongoMemoryServer, atau `DATA_SOURCE=mongo` fallback sampai semua domain runtime selesai Supabase-backed dan full regression/security tests pass.

Sekarang mulai dari task paling awal yang belum selesai di section 24. Jelaskan singkat plan eksekusi, lalu implementasikan secara bertahap sampai domain/foundation pertama selesai dan tervalidasi.
```

Untuk eksekusi yang lebih aman, pakai prompt per tahap seperti ini.

**Prompt Tahap 0: Supabase Foundation**

```txt
Jalankan task 24.2 Supabase foundation dari `specs/active/general-backend/tasks.md`.

Scope:
- Review existing Supabase client/config/runtime code.
- Pastikan env validation mendukung:
  - `DATA_SOURCE=supabase`
  - `SUPABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `SUPABASE_DATABASE_URL`
- Pastikan service role key dan database URL backend-only.
- Tambahkan/rapikan mapper conventions untuk camelCase <-> snake_case.
- Tambahkan repository conventions/helper jika belum ada.
- Tambahkan error mapping conventions untuk Supabase/Postgres errors.
- Tambahkan transaction conventions untuk mutation yang butuh atomicity.
- Tambahkan workspace/outlet scoping conventions.
- Siapkan Supabase test database setup menggunakan Supabase local atau dedicated test project, bukan production.
- Jangan implement Mongo backfill.
- Jangan dual-write.
- Jangan migrasi ke Supabase Auth.
- Jangan hapus Mongo/Mongoose dulu.

Sebelum edit, inspect struktur saat ini. Setelah edit:
- jalankan relevant tests
- jalankan `npm run specs:check` jika docs/spec berubah
- berikan ringkasan file berubah, validasi, dan blocker jika secret/test DB belum tersedia.
```

**Prompt Tahap 1: Workspaces / Users / Memberships**

```txt
Jalankan task 24.7: cut over workspaces / users / memberships ke Supabase.

Scope:
- Port persistence user, workspace, membership, OTP, dan password reset ke Supabase repositories.
- Custom backend auth tetap dipakai.
- Preserve login behavior, password hashing, JWT/session behavior, OTP/reset, role/membership authorization.
- Jangan migrasi ke Supabase Auth.
- Jangan membuat Mongo backfill.
- Jangan dual-write.
- Hapus direct Mongoose access untuk domain ini setelah Supabase path bekerja.
- Tambahkan Supabase repository tests.
- Tambahkan auth integration tests.
- Tambahkan workspace isolation/security tests.
- MongoMemory tests lama boleh tetap ada hanya untuk domain lain yang belum cut over.
- Jangan hapus Mongo/Mongoose global dependency dulu.

Ikuti repository contract di:
- `docs/backend/06-data/repository-layer-contract.md`
- `docs/backend/06-data/migrations/notes/repository-layer-contract.md`

Setelah implementasi:
- jalankan targeted tests
- jalankan full server tests jika feasible
- jalankan `npm run specs:check` jika docs/spec berubah
- ringkas perubahan, validasi, dan sisa risiko.
```

**Prompt Tahap 2: Outlets / User Outlet Access**

```txt
Jalankan task 24.8: cut over outlets / user outlet access ke Supabase.

Scope:
- Port outlet CRUD/listing dan user outlet access persistence ke Supabase repositories.
- Semua query harus workspace-scoped.
- Semua outlet-scoped operation harus enforce outlet access.
- Tambahkan mapper camelCase <-> snake_case.
- Jangan return raw Supabase response ke service/route.
- Hapus direct Mongoose access untuk outlets/user outlet access setelah Supabase path bekerja.
- Tambahkan Supabase repository tests.
- Tambahkan route/service integration tests.
- Tambahkan outlet access security/isolation tests.
- Jangan tambah Mongo tests baru.
- Jangan hapus Mongo/Mongoose global dependency dulu.

Setelah implementasi:
- jalankan targeted tests
- jalankan full server tests jika feasible
- jalankan `npm run specs:check` jika docs/spec berubah
- ringkas perubahan, validasi, dan sisa risiko.
```

**Prompt Tahap 3: Platforms / Integrations / Webhook Events**

```txt
Jalankan task 24.9: cut over platforms / integrations / webhook events ke Supabase.

Scope:
- Port platform configuration persistence ke Supabase repositories.
- Port webhook_events idempotency ke Supabase.
- Preserve Telegram/Meta webhook lookup behavior.
- Secrets/token/appSecret/webhookSecret harus backend-only dan redacted di logs/responses.
- Jangan expose service role key atau provider secrets.
- Tambahkan duplicate webhook event tests.
- Tambahkan provider lookup integration tests.
- Tambahkan secret exposure/security tests.
- Hapus direct Mongoose access untuk domain ini setelah Supabase path bekerja.
- Jangan Mongo backfill.
- Jangan dual-write.
- Jangan tambah Mongo tests baru.

Setelah implementasi:
- jalankan targeted tests
- jalankan relevant webhook tests
- jalankan `npm run specs:check` jika docs/spec berubah
- ringkas perubahan, validasi, dan sisa risiko.
```

**Prompt Tahap 4: Contacts / Chats / Messages**

```txt
Jalankan task 24.10: cut over contacts / chats / messages ke Supabase.

Scope:
- Port contact upsert, chat lookup/state, inbox queries, message inserts, unread state, human takeover state ke Supabase repositories.
- Preserve contact identity key:
  `workspace_id + platform_id + external_id`
- Preserve chat upsert:
  `workspace_id + platform_id + contact_id`
- Preserve inbox sorting:
  `last_message_at desc`
- Preserve message sorting:
  `created_at asc`
- Preserve webhook message idempotency.
- Tambahkan Supabase repository tests.
- Tambahkan inbox/chat integration tests.
- Tambahkan cross-workspace isolation tests.
- Hapus direct Mongoose access untuk domain ini setelah Supabase path bekerja.
- Jangan Mongo backfill.
- Jangan dual-write.
- Jangan tambah Mongo tests baru.

Setelah implementasi:
- jalankan targeted tests
- jalankan full server tests jika feasible
- jalankan `npm run specs:check` jika docs/spec berubah
- ringkas perubahan, validasi, dan sisa risiko.
```

**Prompt Tahap 5: Products / Outlet Availability**

```txt
Jalankan task 24.11: cut over products / outlet availability ke Supabase.

Scope:
- Port product, category, variant, dan outlet availability persistence ke Supabase repositories.
- Preserve slug/SKU partial uniqueness behavior.
- Preserve outlet availability rules.
- Enforce workspace and outlet isolation.
- Tambahkan product repository tests.
- Tambahkan Product API integration tests.
- Tambahkan workspace/outlet isolation tests.
- Hapus direct Mongoose access untuk products/outlet availability setelah Supabase path bekerja.
- Jangan Mongo backfill atau product backfill dari legacy Agent.
- Jangan tambah Mongo tests baru.

Setelah implementasi:
- jalankan targeted tests
- jalankan product-related integration tests
- jalankan `npm run specs:check` jika docs/spec berubah
- ringkas perubahan, validasi, dan sisa risiko.
```

**Prompt Tahap 6: Carts / Checkout Sessions**

```txt
Jalankan task 24.12: cut over carts / checkout sessions ke Supabase.

Scope:
- Port carts, cart_items, checkouts, checkout_items, idempotency keys, dan checkout state ke Supabase repositories.
- Ensure cart totals deterministic.
- Ensure checkout snapshots deterministic.
- Gunakan transaction conventions untuk checkout mutation paths.
- Tambahkan Supabase repository tests.
- Tambahkan checkout integration tests.
- Tambahkan duplicate/idempotency tests.
- Tambahkan workspace/outlet isolation tests.
- Hapus direct Mongoose access untuk carts/checkouts setelah Supabase path bekerja.
- Jangan Mongo backfill.
- Jangan dual-write.
- Jangan tambah Mongo tests baru.

Setelah implementasi:
- jalankan targeted tests
- jalankan checkout/cart integration tests
- jalankan `npm run specs:check` jika docs/spec berubah
- ringkas perubahan, validasi, dan sisa risiko.
```

**Prompt Tahap 7: Orders / Order Items**

```txt
Jalankan task 24.13: cut over orders / order items ke Supabase.

Scope:
- Port order creation, order item snapshots, lifecycle updates, order events, dan order queries ke Supabase repositories.
- Keep order lifecycle status separate from payment status and fulfillment status.
- Gunakan transaction untuk order creation from checkout.
- Tambahkan Supabase repository tests.
- Tambahkan order integration tests.
- Tambahkan lifecycle tests.
- Tambahkan workspace/outlet security tests.
- Hapus direct Mongoose access untuk orders setelah Supabase path bekerja.
- Jangan Mongo backfill.
- Jangan dual-write.
- Jangan tambah Mongo tests baru.

Setelah implementasi:
- jalankan targeted tests
- jalankan order-related integration tests
- jalankan `npm run specs:check` jika docs/spec berubah
- ringkas perubahan, validasi, dan sisa risiko.
```

**Prompt Tahap 8: Payments / Payment Events**

```txt
Jalankan task 24.14: cut over payments / payment events ke Supabase.

Scope:
- Port payments, payment attempts jika digunakan, payment events, provider identifiers, dan reconciliation status ke Supabase repositories.
- Provider webhook adalah payment authority.
- Enforce idempotency untuk duplicate provider events.
- Gunakan transaction untuk:
  - insert payment_event
  - update payment
  - update order payment_status
- Preserve separation antara `orders.status` dan `orders.payment_status`.
- Tambahkan Supabase repository tests.
- Tambahkan payment webhook integration tests.
- Tambahkan duplicate event tests.
- Tambahkan security/signature tests.
- Hapus direct Mongoose access untuk payments setelah Supabase path bekerja.
- Jangan Mongo backfill.
- Jangan dual-write.
- Jangan tambah Mongo tests baru.

Setelah implementasi:
- jalankan targeted tests
- jalankan payment/webhook tests
- jalankan `npm run specs:check` jika docs/spec berubah
- ringkas perubahan, validasi, dan sisa risiko.
```

**Prompt Tahap 9: Complaints / Files / Settings**

```txt
Jalankan task 24.15: cut over complaints / files / settings ke Supabase.

Scope:
- Port complaints, file metadata, dan workspace settings persistence ke Supabase repositories.
- Binary files tetap di local storage.
- Postgres hanya menyimpan metadata/path.
- Settings secrets harus server-only dan response harus redacted/configured state bila relevan.
- Tambahkan Supabase repository tests.
- Tambahkan upload/settings/complaint integration tests.
- Tambahkan workspace isolation/security tests.
- Hapus direct Mongoose access untuk complaints/files/settings setelah Supabase path bekerja.
- Jangan Mongo backfill.
- Jangan dual-write.
- Jangan tambah Mongo tests baru.

Setelah implementasi:
- jalankan targeted tests
- jalankan upload/settings/complaints tests
- jalankan `npm run specs:check` jika docs/spec berubah
- ringkas perubahan, validasi, dan sisa risiko.
```

**Prompt Tahap 10: Agents / AI Actions / Knowledge**

```txt
Jalankan task 24.16: cut over agents / AI actions / knowledge ke Supabase.

Scope:
- Port agents, agent outlet mapping, knowledge metadata, dan AI action persistence ke Supabase repositories.
- Preserve AI guardrails.
- AI tidak boleh menjadi transaction authority atau payment authority.
- Secrets tidak boleh masuk prompt AI.
- Tambahkan Supabase repository tests.
- Tambahkan AI service integration tests.
- Tambahkan workspace/outlet isolation tests.
- Hapus direct Mongoose access untuk agents/AI actions setelah Supabase path bekerja.
- Jangan Mongo backfill.
- Jangan dual-write.
- Jangan tambah Mongo tests baru.

Setelah implementasi:
- jalankan targeted tests
- jalankan AI-related tests
- jalankan `npm run specs:check` jika docs/spec berubah
- ringkas perubahan, validasi, dan sisa risiko.
```

**Prompt Tahap 11: Final Mongo Removal**

```txt
Jalankan task 24.18 dan 24.19: final MongoDB/Mongoose removal setelah semua domain runtime sudah Supabase-backed.

Sebelum menghapus, verifikasi:
- Tidak ada runtime path yang masih membutuhkan Mongoose model.
- Tidak ada direct Mongoose access di services/routes/repositories aktif.
- Semua domain sudah punya Supabase repository tests, integration tests, dan security/isolation tests.
- Full regression/security tests pass.
- Supabase test target bukan production.

Scope removal:
- Remove Mongo connection/bootstrap code.
- Remove Mongoose models.
- Remove Mongoose dependency dan lockfile entries.
- Remove MongoMemoryServer dependency.
- Remove Mongo-specific test setup.
- Remove `DATA_SOURCE=mongo` fallback.
- Remove obsolete Mongo environment variables dari runtime config dan `.env.example`.
- Update affected docs/specs.
- Regenerate generated combined docs jika tooling tersedia.
- Run full regression/security tests.
- Run `npm run specs:check`.

Jangan hapus apa pun sebelum dependency/runtime usage diverifikasi. Jika masih ada domain yang bergantung pada Mongo, stop dan laporkan blocker dengan file/line references.
```

Prompt yang paling aman untuk mulai sekarang adalah **Prompt Tahap 0: Supabase Foundation**, bukan langsung final removal.