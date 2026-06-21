# Location Intelligence — Security

## SSRF Guard (URL Resolution)

- **Approved hosts only**: `google.com`, `www.google.com`, `maps.google.com`, `maps.app.goo.gl`, `goo.gl`
- **HTTPS required**: http, file, ftp, data → rejected
- **Credentials in URL**: `user:pass@host` → rejected
- **Private IP block**: 127.0.0.1, 10.x.x.x, 192.168.x.x, 169.254.x.x, ::1, fc00::, fe80::
- **Redirect limit**: max 5 redirects
- **Redirect validation**: setiap redirect divalidasi host + IP
- **No cookies/auth forwarding**: redirect client tanpa credentials

## Cross-Workspace Isolation

- Semua repository method menerima `workspaceId` dari verified request context
- `flow-repository.getById(flowId, workspaceId)` — return null jika workspace mismatch
- `context-merge.mergeLocationContext()` — return null jika workspace/contact/chat mismatch
- `outlet-locations.repository` — semua query di-scope by `workspace_id`
- UI tidak pernah mengirim `workspaceId` sebagai parameter

## Provider Key Protection

- `GOOGLE_MAPS_API_KEY` hanya di server `env.js`, tidak pernah ke client
- Nominatim (default) tidak pakai API key
- Keys diredact di logs oleh `privacy-redactor.js`
- `privacy-redactor.createSafeLogEntry()` hapus semua field: `latitude`, `longitude`, `apiKey`, `secret*`, `rawProviderPayload`

## Prompt Injection

- `location-parser.js`: scan injection markers (`abaikan`, `ignore`, `tampilkan`, `jangan`, `lupakan`) → instruction excluded dari query
- `query-normalizer.js`: injection text stripped sebelum dikirim ke provider
- Tool input divalidasi oleh `location-input.js`: forbidden fields (`customProviderEndpoint`, `rawProviderPayload`, `apiKey`, `arbitraryUrl`) → rejected

## Privacy — Customer Coordinates

- Coordinates hanya disimpan di temporary flow state (30 menit TTL)
- Field name: `protectedLatitude`, `protectedLongitude`
- Tidak pernah disimpan ke durable memory (contact memories, summaries, traces)
- `trace-service.js`: memanggil `createSafeLogEntry()` untuk menghapus koordinat
- Metrics tidak mengandung exact coordinate
- Setelah CONFIRMED / CANCELLED / EXPIRED → flow state dihapus

## Outlet Location Security

### Admin Preview → Confirm
- Memerlukan auth + workspace context
- Preview tidak mengubah canonical data
- Confirm memerlukan `previewToken` valid
- Optimistic concurrency via `expectedOutletVersion`
- Cross-workspace confirm → ditolak

### Auto-Selection Prevention
- `find_nearest_outlet` tool read-only (`mutation: false`)
- Tool result tidak melakukan `select_outlet`
- Hanya confirmation flow yang bisa mutate `selected_outlet_id`
- LLM tidak bisa invent outletId, harus lewat nearest result

## Rate Limiting

| Scope | Limit |
|---|---|
| Customer resolution | 5 req / 10 menit |
| Customer directions | 10 req / 10 menit |
| Admin resolution | 20 req / 10 menit |
| Scheduled verification | 50 req / 60 menit |

Cache hits tidak consume quota.

## Error Exposure

- 5xx errors → `{ expose: false }` → "Terjadi kesalahan. Silakan coba lagi."
- 4xx errors → `{ expose: true }` → pesan Bahasa Indonesia yang aman
- Stack trace tidak pernah di-expose ke client
