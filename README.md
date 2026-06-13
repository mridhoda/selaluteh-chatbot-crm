# SelaluTeh Chatbot CRM

CRM chatbot untuk operasional customer service dan commerce SelaluTeh. Project ini berisi frontend React + Vite dan backend Express + MongoDB untuk mengelola inbox/chat, kontak, platform terhubung, AI agents, human agents, order, komplain, analytics, billing, dan webhook channel.

## Ringkasan Stack

- Frontend: React 19, Vite, React Router, Axios, Chart.js, Tailwind CSS.
- Backend: Node.js, Express, MongoDB, Mongoose, JWT, Nodemailer, OpenAI/Gemini optional.
- Database dev: MongoDB via Docker Compose atau MongoDB lokal/Atlas.
- Webhook dev: bisa diexpose dengan Cloudflare Tunnel.

## Struktur Project

```text
selaluteh-chatbot-crm/
├── web/                     # Frontend React + Vite
├── server/                  # Backend Express + MongoDB
├── docs/                    # Dokumentasi produk, backend, rules, security, testing, devops
├── scripts/dev.js           # Runner dev untuk web + server sekaligus
├── docker-compose.yml       # MongoDB lokal untuk development
├── CLOUDFLARE_TUNNEL_GUIDE.md
└── README.md
```

## Fitur Utama

- Auth: register, OTP verification, login, reset password, JWT session.
- Dashboard CRM: chat center/inbox, quick actions, analytics, contacts, orders, complaints.
- Multi area operasional: outlets, products, payments, reports, billing, profile, settings.
- Connected Platforms: konfigurasi channel/platform dan status webhook.
- AI Agents: prompt editor, knowledge files, test UI, integrasi OpenAI/Gemini bila API key tersedia.
- Human Agents: manajemen agent manusia dan takeover chat.
- Webhook: endpoint backend untuk menerima pesan dari platform eksternal.
- Follow-up service: background scheduler via `node-cron` dari backend.

## Prasyarat

- Node.js 18+.
- npm.
- MongoDB lokal, MongoDB Atlas, atau Docker untuk menjalankan MongoDB dev.
- Optional: SMTP untuk OTP email.
- Optional: OpenAI API key atau Google Gemini API key untuk fitur AI.
- Optional: Cloudflared untuk testing webhook publik.

## Setup Lokal

Install dependency root, backend, dan frontend:

```bash
npm install
npm --prefix server install
npm --prefix web install
```

Siapkan env frontend:

```bash
cp web/.env.example web/.env
```

Buat file env backend:

```bash
touch server/.env
```

Isi minimal `server/.env`:

```env
MONGODB_URI=mongodb://localhost:27017/chatbot_crm
JWT_SECRET=change_this_secret
PORT=5000
CORS_ORIGIN=http://localhost:5173
PUBLIC_BASE_URL=
SMTP_URL=
SMTP_FROM="SelaluTeh Chatbot CRM <no-reply@selaluteh.local>"
OPENAI_API_KEY=
GOOGLE_API_KEY=
```

Isi default `web/.env`:

```env
VITE_API_BASE=http://localhost:5000
VITE_APP_NAME=Chatbot CRM
```

## Menjalankan Development

Jalankan MongoDB dengan Docker:

```bash
docker compose up -d mongo
```

Jalankan frontend dan backend sekaligus dari root:

```bash
npm run dev
```

Akses aplikasi:

- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:5000`

Jika ingin menjalankan terpisah:

```bash
npm run dev:server
npm run dev:web
```

## Script Penting

Root project:

```bash
npm run dev          # Jalankan server dan web sekaligus
npm run dev:server   # Jalankan backend saja
npm run dev:web      # Jalankan frontend saja
npm run build        # Build frontend
npm run start        # Jalankan backend production mode
npm run seed         # Seed data/user awal dari server/scripts/seed.js
npm run cleanup      # Cleanup data dari server/scripts/cleanup.js
```

Backend (`server/`):

```bash
npm run dev
npm start
npm run seed
npm run cleanup
```

Frontend (`web/`):

```bash
npm run dev
npm run build
npm run preview
npm run lint
npm run format
```

## Endpoint Backend Utama

Backend mendaftarkan route berikut dari `server/src/index.js`:

```text
GET  /
/auth
/users
/platforms
/agents
/chats
/webhook
/analytics
/billing
/profile
/contacts
/integrations
/complaints
/orders
/files
```

Static file upload disajikan lewat `/files` dari folder `server/uploads`.

## Webhook Dan Cloudflare Tunnel

Untuk testing webhook dari platform eksternal, expose backend lokal:

```bash
cloudflared tunnel --url http://localhost:5000
```

Set URL publik yang muncul ke `server/.env`:

```env
PUBLIC_BASE_URL=https://example.trycloudflare.com
```

Endpoint webhook utama ada di prefix:

```text
POST /webhook/...
```

Panduan lebih detail ada di `CLOUDFLARE_TUNNEL_GUIDE.md`.

## Catatan AI Dan OTP

- Jika `SMTP_URL` kosong, flow OTP development dapat bergantung pada log/behavior backend yang tersedia di service email.
- Jika `OPENAI_API_KEY` dan `GOOGLE_API_KEY` kosong, fitur AI tetap bisa berjalan dengan fallback sesuai implementasi backend.
- Ganti `JWT_SECRET` sebelum dipakai di staging atau production.

## Dokumentasi Tambahan

Dokumentasi lengkap ada di folder `docs/backend`, termasuk:

- Overview dan product requirements.
- Business rules dan user flows.
- Tech spec, API spec, data model, migrations.
- Security, testing, ops, dan devops notes.

## Production Notes

Sebelum deploy production:

- Gunakan MongoDB managed atau server database yang dibackup.
- Set `JWT_SECRET` yang kuat dan jangan commit file `.env`.
- Batasi `CORS_ORIGIN` ke domain frontend resmi.
- Konfigurasi SMTP production untuk OTP/reset password.
- Simpan API key AI dan token platform di secret manager.
- Review security docs di `docs/backend/08-security`.
- Jalankan `npm --prefix web run build` untuk validasi build frontend.
