# Server — SelaluTeh Backend

Express + MongoDB backend untuk SelaluTeh Chatbot CRM & Telegram Marketplace.

## Folder Ownership Rules

| Folder | Isi | Ownership Rules |
|---|---|---|
| `src/config/` | Environment, CORS, logger, constants | Wajib load sebelum app bootstrap. Jangan import service/repository. |
| `src/db/` | Database connection, repositories | Hanya koneksi database dan persistence abstraction. |
| `src/db/repositories/` | Query contracts per domain | Terima `workspaceId`/`outletIds` scope. Jangan format HTTP response. |
| `src/integrations/` | Provider adapters (Telegram, Meta, AI, Payment) | Mapping request/response provider. Jangan putuskan tenant authorization. |
| `src/middleware/` | Auth, workspace context, validation, rate limit, error handler | Pipeline request. Jangan lakukan domain mutation. |
| `src/models/` | Mongoose schema, indexes, persistence mapping | Mapping database. Jangan contain complex workflow. |
| `src/routes/` | HTTP mapping, request extraction, response status | Tipis. Jangan panggil provider langsung atau query kompleks. |
| `src/routes/webhooks/` | Provider webhook receivers | Validasi signature/idempotency dulu, baru call service. |
| `src/services/` | Business rules, state transitions, orchestration | Terima verified context. Jangan format Express response. |
| `src/utils/` | Stateless helpers (dates, money, ids, errors) | Pure functions. Jangan akses database atau provider. |
| `src/validators/` | Request schema validation | Jangan contain business logic. |
| `src/workers/` | Deferred/background job handlers | Side effects eksplisit. Jangan tersembunyi. |
| `test/` | Automated tests | Mirror `src/` structure. |
| `scripts/` | Maintenance, debug, seed, testing tools | Manual only. Jangan dependency runtime. |
| `uploads/` | Runtime file storage | Di-ignore Git. Jangan hardcode path. |

## Canonical Call Chain

```
Route → Middleware → Service → Repository → Model/Database
```

## External Provider Chain

```
Service → Integration Adapter → External Provider
```

## Larangan Arsitektur

- Route → provider langsung ❌
- Route → query kompleks ❌
- Service → Express response formatting ❌
- Integration client → permission decision ❌
- Repository → HTTP response ❌

## Canonical Service Result Conventions

Service functions harus mengikuti kontrak berikut:

### Return Value
- Service mengembalikan domain object atau `null` (jika not found).
- Service tidak mengembalikan Express-specific object (`res`, `req`, `Response`).
- Service boleh mengembalikan `{ data, meta }` untuk list results.

### Error Handling
- Service melempar `AppError` (dari `server/src/utils/errors.js`) untuk business rule violation, authorization failure, atau domain error.
- `AppError` memiliki properti: `code`, `message`, `status`, optional `details`.
- Service tidak melempar raw `Error` atau `string` — gunakan `AppError`.
- Service tidak handle error di level sendiri kecuali untuk recovery/fallback; biarkan error handler middleware yang memformat response.

### Idempotency
- Service mutation harus idempotent atau mendeteksi duplicate request.
- Service yang membuat resource baru harus mendukung idempotency key.

### Side Effects
- Side effects (send message, create order, call provider) harus eksplisit.
- Jangan sembunyikan side effect di dalam helper dengan nama generik.

### Contoh

```js
// ✅ Good
async function addItem(cartId, item, context) {
  const cart = await cartsRepo.findById(cartId, context);
  if (!cart) throw new AppError('CART_NOT_FOUND', 'Cart not found.', 404);
  // ... business logic
  return cartsRepo.update(cartId, updated, context);
}

// ❌ Bad — throws raw Error
throw new Error('Cart not found');

// ❌ Bad — returns Express response
return res.status(200).json(cart);
```

## Repository Scope Contract

Setiap repository tenant-owned wajib menerima `QueryScope` sebagai parameter pertama atau parameter konteks:

```ts
type QueryScope = {
  workspaceId: string;   // required — tenant boundary
  outletIds?: string[];  // optional — filter by outlet(s)
};
```

### Aturan
- Repository tidak boleh melakukan query tanpa `workspaceId` untuk data tenant-owned.
- `workspaceId` harus diverifikasi oleh middleware/service sebelum sampai ke repository.
- `outletIds` opsional; jika diberikan, query harus difilter berdasarkan outlet.
- Repository tidak boleh menggunakan `req` atau `res` dari Express.
- Repository tidak boleh mengembalikan HTTP response.
- Repository tidak boleh mengasumsikan database tertentu (MongoDB/Mongoose saat ini, PostgreSQL masa depan).

### Contoh

```js
// ✅ Good
async function findActiveCart(scope) {
  return CartModel.findOne({
    workspaceId: scope.workspaceId,
    outletId: { $in: scope.outletIds },
    status: 'active',
  });
}

// ❌ Bad — no workspace scope
async function findActiveCart() {
  return CartModel.findOne({ status: 'active' });
}
```

## No-Empty-Folder Policy

- Jangan membuat folder baru sebelum ada file yang benar-benar akan ditempatkan di dalamnya.
- `.gitkeep` hanya digunakan untuk mempertahankan folder yang harus ada di filesystem (seperti `uploads/`) tetapi mungkin kosong.
- Hapus `.gitkeep` segera setelah folder memiliki setidaknya satu file real.
- Folder feature/domain dibuat saat task pertama domain tersebut dimulai, bukan sebelumnya.
- Folder saat ini yang sudah memiliki file real: `config/`, `db/`, `db/repositories/`, `integrations/`, `integrations/ai/`, `integrations/telegram/`, `integrations/meta/`, `integrations/payments/`, `middleware/`, `models/`, `routes/`, `routes/webhooks/`, `services/`, `utils/`, `validators/`, `workers/`, `test/`, `test/helpers/`.

## Architecture Boundary Review Checklist

Gunakan checklist ini saat code review untuk memastikan architecture boundaries tidak dilanggar:

### Routes
- [ ] Tidak memanggil provider HTTP langsung (Telegram/Meta/AI/Payment)
- [ ] Tidak berisi query database kompleks — delegasikan ke repository/service
- [ ] Tidak memformat ulang response yang sudah dibentuk service

### Middleware
- [ ] Tidak melakukan domain mutation — hanya context/validation/pipeline
- [ ] Tidak mengakses database langsung

### Services
- [ ] Tidak menerima unverified `workspace_id` — gunakan verified request context
- [ ] Tidak memformat Express response (`res.json`, `res.send`, dll)
- [ ] Tidak memanggil provider HTTP langsung tanpa melalui integration adapter

### Repositories
- [ ] Tidak membentuk atau mengembalikan HTTP response
- [ ] Menerima `workspaceId`/`outletIds` scope untuk tenant-owned query
- [ ] Tidak menggunakan `req` atau `res` dari Express

### Integrations
- [ ] Tidak memutuskan tenant authorization — terima dari service
- [ ] Tidak menjadi domain source of truth — mapping provider contract saja

### Workers
- [ ] Side effects eksplisit dan terdokumentasi
- [ ] Tidak memiliki unbounded hidden side effects

## Lihat Juga

- `specs/active/general-backend/design.md` — arsitektur lengkap
- `docs/backend/04-tech-spec/folder-structure.md`
- `docs/backend/09-ai-context/coding-guidelines.md`
- `specs/active/general-backend/tasks.md` — task `1.3`
