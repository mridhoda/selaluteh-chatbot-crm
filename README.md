# Chatbot CRM - React + Express + Mongo + Cloudflare Tunnel

> Starter project yang siap dijalankan untuk **Chatbot CRM seperti Cekat.ai** sesuai brief Anda: React (Vite) frontend, Express backend, MongoDB (Mongoose), OTP email verification, role Human Agent (Agent/Super Agent), AI Agents + test UI, Connected Platforms, Inbox/Chats, dan **webhook via Cloudflare Tunnel**.

## Arsitektur

- `web/` — Frontend React (Vite). UI putih-oranye, animasi halus, sidebar **expand on hover**.
- `server/` — Backend Express + MongoDB. Auth + OTP, JWT, AI Agents, Platforms, Chats/Messages, Webhooks, Analytics, Billing, Profile.
- `docker-compose.yml` — Opsional untuk MongoDB (dev).
- `CLOUDFLARE_TUNNEL_GUIDE.md` — Cara expose backend via Cloudflare Tunnel.

---

## 1) Prasyarat

- Node.js 18+ dan npm/yarn
- MongoDB (lokal/Atlas). Untuk cepat: pakai docker (lihat bagian Docker).
- (Opsional) SMTP untuk kirim OTP. **Jika tidak ada**, OTP ditampilkan di **console server**.
- (Opsional) OpenAI/Google Gemini API key. Jika tidak ada, AI **fallback echo**.

---

## 2) Setup Cepat (Local Dev)

### 2.1. Clone & Install
```bash
# masuk ke folder project
cd eskala-bot

# install backend
cd server
npm install
cp .env.example .env
# EDIT .env sesuai kebutuhan (lihat penjelasan variabel di file)
cd ..

# install frontend
cd web
npm install
cp .env.example .env
# EDIT VITE_API_BASE agar menunjuk ke server (default http://localhost:5000)
cd ..
```

### 2.2. Jalankan MongoDB

**Opsi A: Docker (disarankan untuk cepat)**
```bash
docker compose up -d mongo
```
Mongo akan aktif di `mongodb://localhost:27017`.

**Opsi B: MongoDB lokal** — pastikan service Anda aktif.

### 2.3. Jalankan Dev (root, lebih mudah)
```bash
npm run dev
```
Ini akan menjalankan backend (Express) dan frontend (Vite) secara bersamaan.

### 2.4. Jalankan Terpisah (opsional)
```bash
cd server
npm run dev
```
Jika `.env` kosong (tanpa SMTP), kode OTP akan tampil di **console** saat registrasi.

Di terminal lain:
```bash
cd web
npm run dev
```
Akses UI di URL yang ditampilkan (mis. `http://localhost:5173`).

---

## 3) Konfigurasi Cloudflare Tunnel (Webhook)

1. **Install Cloudflared**: https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/
2. **Quick Tunnel** (paling cepat):
   ```bash
   cloudflared tunnel --url http://localhost:5000
   ```
   Simpan URL `https://*.trycloudflare.com` yang muncul di log.
3. **Set `.env` backend**:
   ```env
   PUBLIC_BASE_URL=https://example.trycloudflare.com
   ```
4. **Webhook endpoint** bawaan:
   - Generic: `POST /webhook/:platform` (contoh: `/webhook/telegram`)
   - Telegram-style sample (opsional): `POST /webhooks/telegram/:botId/:secret?` (contoh path saja)

> Untuk setup Named Tunnel (URL stabil + kontrol akses), lihat `CLOUDFLARE_TUNNEL_GUIDE.md`.

---

## 4) Variabel Lingkungan (Backend `.env`)

```env
# MongoDB
MONGODB_URI=mongodb://localhost:27017/chatbot_crm

# JWT
JWT_SECRET=please_change_me

# app
PORT=5000
PUBLIC_BASE_URL=

# SMTP (opsional, jika kosong OTP di-console)
SMTP_URL=
SMTP_FROM="Chatbot CRM <no-reply@chatbot.local>"

# AI (opsional)
OPENAI_API_KEY=
GOOGLE_API_KEY=

# CORS
CORS_ORIGIN=http://localhost:5173
```

> **Tanpa SMTP**: OTP akan dicetak ke **console** server saat registrasi.
> **Tanpa API Key AI**: balasan AI akan **fallback echo** (meniru pesan user).

---

## 5) Alur Auth + OTP

1. **Register** → backend membuat OTP dan (a) mengirim via SMTP (jika ada), atau (b) mencetak di console (dev).  
2. **Verify** → masukkan email + OTP untuk verifikasi.  
3. **Login** → dapatkan JWT + profil. Centang **Remember me** agar token disimpan di `localStorage`.

Role Human Agent:
- **Super Agent**: akses penuh (kelola agen manusia, dll.).
- **Agent**: akses terbatas (read/chat takeover).

---

## 6) Fitur Utama

- **Landing Page** (sebelum login): ringkasan & daftar fitur.
- **Navbar**: kiri logo; kanan CS, Paket/Billing, Login, Daftar.
- **Login/Daftar + OTP Verify**.
- **Halaman utama** (setelah login):
  - Navbar kiri: sisa masa aktif paket; kanan: nama, email, status Online/Offline; menu **Sign out**.
  - **Inbox** default + Quick Actions (Hubungkan Platform, Buat AI Agent, Undang Agen Manusia, Tambahkan AI Agent ke Inbox).
  - **Sidebar expand-on-hover**: Chat, Analytics, Contacts, Connected Platforms, AI Agents (prompt/behavior/welcome + **test UI**), Human Agents (buat akun + status), Settings, Billing, Profile.
  - **Takeover**: tombol untuk mengambil alih chat sebagai Human Agent.
- **Analytics**: rata-rata chat per hari/minggu (dummy aggregate dari messages).
- **Connected Platforms**: simpan token/id akun; tampil daftar.
- **AI Agents**: CRUD + knowledge source URL/teks/PDF (metadata disimpan, implementasi retrieval sederhana).
- **Webhook (via Cloudflare Tunnel)**: `POST /webhook/:platform` → membuat contact/chat & balas via AI service/fallback.

---

## 7) Jalur Cepat Uji Coba

1. Jalankan server & web.
2. Register, catat OTP dari console (jika tanpa SMTP), kemudian Verify.
3. Login → Anda akan melihat **Inbox** + **Quick Actions**.
4. Buat **Connected Platform** dan **AI Agent**.
5. Ke halaman **AI Agents**, pilih agent, pakai **Test UI** untuk kirim pesan; lihat balasan AI (atau echo).

---

## 8) Docker (Mongo saja)

```yaml
# docker-compose up -d mongo
services:
  mongo:
    image: mongo:7
    restart: unless-stopped
    ports:
      - "27017:27017"
    volumes:
      - mongo_data:/data/db
volumes:
  mongo_data: {}
```

---

## 9) Catatan Penting

- **Ini adalah starter yang opiniated**—fokus P0 agar cepat jalan. Anda bisa menambah integrasi platform spesifik (WA/IG/FB/Telegram) di `server/src/routes/webhooks.js`.
- **Security**: ganti `JWT_SECRET`, atur CORS, audit input, enkripsi/secret management yang benar untuk produksi.
- **AI**: modul `services/ai.js` otomatis memilih OpenAI/Gemini jika API key tersedia, jika tidak **echo**.

---

## 10) Perintah Penting

```bash
# server
cd server
npm run dev        # mode development (nodemon)
npm start          # production
npm run seed       # buat user owner awal (lihat scripts/seed.js)

# web
cd web
npm run dev
npm run build
npm run preview
```
