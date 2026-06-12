# Backend Boundaries

Dokumen ini menjelaskan batas tanggung jawab backend agar AI coding agent tidak mencampur domain yang berbeda.

## Backend Owns

Backend bertanggung jawab untuk:

- auth dan session JWT,
- workspace ownership validation,
- platform integration credentials,
- webhook ingestion,
- chat/contact/message persistence,
- AI orchestration,
- product/catalog/cart/order/payment state,
- payment webhook validation,
- notification sending,
- file metadata dan local file serving,
- admin dashboard API.

## Backend Does Not Own

Backend tidak boleh:

- menyimpan file binary besar di Postgres,
- menyimpan service role key di frontend,
- membiarkan AI menentukan status payment,
- membiarkan Telegram user mengakses data workspace lain,
- menjalankan production migration otomatis dari request API biasa,
- menjadi UI layout decision source.

## Layer Boundaries

Recommended boundary:

```txt
routes/controllers
  -> services/use-cases
    -> repositories
      -> database client
```

Webhook route sebaiknya tipis:

```txt
receive payload
validate provider/event
store idempotency event
call platform service
return fast
```

AI service sebaiknya tidak langsung menulis order/payment. Ia harus mengembalikan intent/action proposal yang dieksekusi oleh service layer.

## External Provider Boundary

Gunakan adapter untuk:

```txt
Telegram provider
Meta provider
OpenAI provider
Gemini provider
Payment provider
Storage provider
```

Tujuannya agar provider bisa diganti tanpa rewrite domain logic.

## Database Boundary

Selama transisi Mongo -> Supabase:

- routes tidak boleh langsung mengikat diri ke Mongoose model baru,
- buat repository abstraction,
- pertahankan query contract existing,
- lakukan migration route-by-route.
