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

```
selaluteh-chatbot-crm
├─ .agents
├─ .codex
├─ CLOUDFLARE_TUNNEL_GUIDE.md
├─ Dockerfile.server
├─ Dockerfile.web
├─ README.md
├─ docker-compose-advanced.yml
├─ docker-compose-full.yml
├─ docker-compose-with-ngrok.yml
├─ docker-compose.yml
├─ docs
│  ├─ .obsidian
│  │  ├─ app.json
│  │  ├─ appearance.json
│  │  ├─ core-plugins.json
│  │  └─ workspace.json
│  ├─ backend
│  │  ├─ .obsidian
│  │  │  ├─ icons
│  │  │  └─ plugins
│  │  │     └─ obsidian-icon-folder
│  │  ├─ 00-overview
│  │  │  ├─ ALL_OVERVIEW_DOCS_COMBINED.md
│  │  │  ├─ README.md
│  │  │  ├─ assumptions-constraints.md
│  │  │  ├─ current-state.md
│  │  │  ├─ decision-summary.md
│  │  │  ├─ glossary.md
│  │  │  ├─ goals-kpi.md
│  │  │  ├─ mvp-principles.md
│  │  │  ├─ non-goals.md
│  │  │  ├─ overview-map.md
│  │  │  ├─ product-vision.md
│  │  │  ├─ project-summary.md
│  │  │  ├─ risks-overview.md
│  │  │  ├─ scope.md
│  │  │  ├─ stakeholders.md
│  │  │  ├─ success-metrics.md
│  │  │  └─ target-state.md
│  │  ├─ 00-research
│  │  │  ├─ 01.Pedagogy
│  │  │  └─ AI Interactive Learning Microsite Generator – Perplexity.md
│  │  ├─ 000-business
│  │  │  ├─ ALL_BUSINESS_DOCS_COMBINED.md
│  │  │  ├─ README.md
│  │  │  ├─ backup-docs
│  │  │  │  └─ backend-business-docs-v2.zip
│  │  │  ├─ brd.md
│  │  │  ├─ business-decision-log.md
│  │  │  ├─ business-metrics.md
│  │  │  ├─ business-model.md
│  │  │  ├─ business-risks.md
│  │  │  ├─ competitor-analysis.md
│  │  │  ├─ customer-segments.md
│  │  │  ├─ financial-assumptions.md
│  │  │  ├─ go-to-market.md
│  │  │  ├─ legal-business-notes.md
│  │  │  ├─ manifest.json
│  │  │  ├─ market-positioning.md
│  │  │  ├─ mvp-validation-plan.md
│  │  │  ├─ mvp-validation-scorecard.md
│  │  │  ├─ partnerships.md
│  │  │  ├─ pricing-strategy.md
│  │  │  ├─ revenue-model.md
│  │  │  ├─ roadmap-business.md
│  │  │  ├─ sales-discovery-questions.md
│  │  │  ├─ unit-economics.md
│  │  │  └─ value-proposition.md
│  │  ├─ 0000-business
│  │  │  ├─ ALL_BUSINESS_DOCS_COMBINED.md
│  │  │  ├─ README.md
│  │  │  ├─ brd.md
│  │  │  ├─ business-decision-log.md
│  │  │  ├─ business-metrics.md
│  │  │  ├─ business-model.md
│  │  │  ├─ business-risks.md
│  │  │  ├─ competitor-analysis.md
│  │  │  ├─ customer-segments.md
│  │  │  ├─ financial-assumptions.md
│  │  │  ├─ go-to-market.md
│  │  │  ├─ legal-business-notes.md
│  │  │  ├─ market-positioning.md
│  │  │  ├─ mvp-validation-plan.md
│  │  │  ├─ mvp-validation-scorecard.md
│  │  │  ├─ partnerships.md
│  │  │  ├─ pricing-strategy.md
│  │  │  ├─ revenue-model.md
│  │  │  ├─ roadmap-business.md
│  │  │  ├─ sales-discovery-questions.md
│  │  │  ├─ unit-economics.md
│  │  │  └─ value-proposition.md
│  │  ├─ 001-overview
│  │  │  ├─ ALL_OVERVIEW_DOCS_COMBINED.md
│  │  │  ├─ README.md
│  │  │  ├─ assumptions-constraints.md
│  │  │  ├─ backup-docs
│  │  │  │  └─ backend-overview-docs-v2.zip
│  │  │  ├─ current-state.md
│  │  │  ├─ decision-summary.md
│  │  │  ├─ glossary.md
│  │  │  ├─ goals-kpi.md
│  │  │  ├─ manifest.json
│  │  │  ├─ mvp-principles.md
│  │  │  ├─ non-goals.md
│  │  │  ├─ overview-map.md
│  │  │  ├─ product-vision.md
│  │  │  ├─ project-summary.md
│  │  │  ├─ risks-overview.md
│  │  │  ├─ scope.md
│  │  │  ├─ stakeholders.md
│  │  │  ├─ success-metrics.md
│  │  │  └─ target-state.md
│  │  ├─ 01-product
│  │  │  ├─ ALL_PRODUCT_DOCS_COMBINED.md
│  │  │  ├─ README.md
│  │  │  ├─ admin-experience.md
│  │  │  ├─ backup-docs
│  │  │  │  └─ brand-personality.zip
│  │  │  ├─ brand-personality.md
│  │  │  ├─ customer-journey.md
│  │  │  ├─ feature-list.md
│  │  │  ├─ logo-direction.md
│  │  │  ├─ logo-system.md
│  │  │  ├─ manifest.json
│  │  │  ├─ mvp-scope.md
│  │  │  ├─ out-of-scope.md
│  │  │  ├─ product-vision.md
│  │  │  ├─ release-plan.md
│  │  │  ├─ requirements.md
│  │  │  ├─ risks-and-assumptions.md
│  │  │  ├─ success-metrics.md
│  │  │  ├─ user-personas.md
│  │  │  └─ user-stories.md
│  │  ├─ 02-flows
│  │  │  ├─ README.md
│  │  │  ├─ admin-flow.md
│  │  │  ├─ auth-flow.md
│  │  │  ├─ backup-docs
│  │  │  │  └─ backend-flows-v2.zip
│  │  │  ├─ chatbot-ai-flow.md
│  │  │  ├─ checkout-flow.md
│  │  │  ├─ complaint-flow.md
│  │  │  ├─ edge-cases.md
│  │  │  ├─ human-takeover-flow.md
│  │  │  ├─ media-file-flow.md
│  │  │  ├─ order-fulfillment-flow.md
│  │  │  ├─ outlet-selection-flow.md
│  │  │  ├─ payment-flow.md
│  │  │  ├─ product-catalog-flow.md
│  │  │  ├─ telegram-commerce-flow.md
│  │  │  └─ webhook-message-flow.md
│  │  ├─ 03-business-rules
│  │  │  ├─ README.md
│  │  │  ├─ ai-agent-rules.md
│  │  │  ├─ audit-log-rules.md
│  │  │  ├─ backup-docs
│  │  │  │  └─ domain-rules.zip
│  │  │  ├─ cart-checkout-rules.md
│  │  │  ├─ complaint-rules.md
│  │  │  ├─ domain-rules.md
│  │  │  ├─ export-rules.md
│  │  │  ├─ generation-rules.md
│  │  │  ├─ human-takeover-rules.md
│  │  │  ├─ manifest.json
│  │  │  ├─ notification-rules.md
│  │  │  ├─ order-rules.md
│  │  │  ├─ outlet-access-rules.md
│  │  │  ├─ outlet-rules.md
│  │  │  ├─ payment-rules.md
│  │  │  ├─ permissions.md
│  │  │  ├─ product-catalog-rules.md
│  │  │  ├─ quota-rules.md
│  │  │  ├─ status-rules.md
│  │  │  ├─ storage-rules.md
│  │  │  ├─ telegram-commerce-rules.md
│  │  │  ├─ validations.md
│  │  │  ├─ webhook-rules.md
│  │  │  └─ workspace-tenant-rules.md
│  │  ├─ 04-tech-spec
│  │  │  ├─ README.md
│  │  │  ├─ ai-pipeline.md
│  │  │  ├─ architecture.md
│  │  │  ├─ backend-tech-spec-only-v2
│  │  │  │  └─ backend-tech-spec-only-v2.zip
│  │  │  ├─ background-jobs.md
│  │  │  ├─ coding-rules.md
│  │  │  ├─ database-access.md
│  │  │  ├─ decision-log.md
│  │  │  ├─ deployment.md
│  │  │  ├─ environment-config.md
│  │  │  ├─ folder-structure.md
│  │  │  ├─ observability.md
│  │  │  ├─ recommended-scalable-structure.md
│  │  │  ├─ rendering-export.md
│  │  │  ├─ runbook.md
│  │  │  ├─ storage-strategy.md
│  │  │  └─ tech-stack.md
│  │  ├─ 05-api-spec
│  │  │  ├─ README.md
│  │  │  ├─ agents-api.md
│  │  │  ├─ ai-actions-api.md
│  │  │  ├─ analytics-api.md
│  │  │  ├─ api-versioning.md
│  │  │  ├─ auth-api.md
│  │  │  ├─ backup-docs
│  │  │  │  └─ auth-api.zip
│  │  │  ├─ carts-api.md
│  │  │  ├─ chats-api.md
│  │  │  ├─ checkout-api.md
│  │  │  ├─ complaints-api.md
│  │  │  ├─ contacts-api.md
│  │  │  ├─ error-format.md
│  │  │  ├─ files-api.md
│  │  │  ├─ integrations-api.md
│  │  │  ├─ jobs-api.md
│  │  │  ├─ orders-api.md
│  │  │  ├─ outlet-access-api.md
│  │  │  ├─ outlets-api.md
│  │  │  ├─ overview.md
│  │  │  ├─ payments-api.md
│  │  │  ├─ platforms-api.md
│  │  │  ├─ products-api.md
│  │  │  ├─ rate-limits.md
│  │  │  ├─ settings-api.md
│  │  │  ├─ telegram-commerce-api.md
│  │  │  ├─ users-api.md
│  │  │  └─ webhooks-api.md
│  │  ├─ 06-data
│  │  │  ├─ ALL_DOCS_COMBINED.md
│  │  │  ├─ MANIFEST.json
│  │  │  ├─ README.md
│  │  │  ├─ ai-commerce-guardrails.md
│  │  │  ├─ backup-docs
│  │  │  │  ├─ telegram-marketplace-data-migrations-v2
│  │  │  │  ├─ telegram-marketplace-data-migrations-v2.zip
│  │  │  │  └─ updated-data-database-docs.zip
│  │  │  ├─ data-flow.md
│  │  │  ├─ database-schema.md
│  │  │  ├─ entities.md
│  │  │  ├─ erd.md
│  │  │  ├─ implementation-checklist.md
│  │  │  ├─ import-script-spec.md
│  │  │  ├─ indexes.md
│  │  │  ├─ marketplace-module.md
│  │  │  ├─ migration-plan.md
│  │  │  ├─ migrations
│  │  │  │  ├─ ALL_MIGRATIONS_COMBINED.md
│  │  │  │  ├─ README.md
│  │  │  │  ├─ checklists
│  │  │  │  │  ├─ marketplace-mvp-checklist.md
│  │  │  │  │  ├─ post-migration-checklist.md
│  │  │  │  │  └─ pre-migration-checklist.md
│  │  │  │  ├─ manifest.json
│  │  │  │  ├─ notes
│  │  │  │  │  ├─ cutover-plan.md
│  │  │  │  │  ├─ data-backfill-order.md
│  │  │  │  │  ├─ marketplace-schema-notes.md
│  │  │  │  │  ├─ mongo-to-postgres-mapping.md
│  │  │  │  │  ├─ payment-gateway-contract.md
│  │  │  │  │  ├─ repository-layer-contract.md
│  │  │  │  │  └─ telegram-commerce-flow.md
│  │  │  │  └─ sql
│  │  │  │     ├─ 001_extensions_and_enums.sql
│  │  │  │     ├─ 002_core_identity.sql
│  │  │  │     ├─ 003_platforms_agents.sql
│  │  │  │     ├─ 004_crm_chats_messages.sql
│  │  │  │     ├─ 005_orders_complaints_files.sql
│  │  │  │     ├─ 006_indexes.sql
│  │  │  │     ├─ 007_rls_policies.sql
│  │  │  │     ├─ 008_local_file_storage.sql
│  │  │  │     ├─ 009_migration_validation_queries.sql
│  │  │  │     └─ 009_multi_workspace_outlet_foundation.sql
│  │  │  ├─ payment-gateway.md
│  │  │  ├─ query-contracts.md
│  │  │  ├─ relationships.md
│  │  │  ├─ repository-layer-contract.md
│  │  │  ├─ rls-policies.md
│  │  │  ├─ seed-data.md
│  │  │  ├─ storage-model.md
│  │  │  └─ telegram-commerce-flow.md
│  │  ├─ 07-uiux
│  │  │  ├─ ALL_UIUX_DOCS_COMBINED.md
│  │  │  ├─ README.md
│  │  │  ├─ accessibility.md
│  │  │  ├─ admin-actions-matrix.md
│  │  │  ├─ backend-ui-contract.md
│  │  │  ├─ backup-docs
│  │  │  │  └─ backend-uiux-docs-v2.zip
│  │  │  ├─ btn-card-bdg-variants.md
│  │  │  ├─ btn-crd-bdg-variants.md
│  │  │  ├─ color-palette.md
│  │  │  ├─ components-backend-contract.md
│  │  │  ├─ components-list.md
│  │  │  ├─ darkmode-ui-component-style.md
│  │  │  ├─ data-table-actions.md
│  │  │  ├─ design-system.md
│  │  │  ├─ design.md
│  │  │  ├─ filters-search-sort.md
│  │  │  ├─ fontbrand-typography.md
│  │  │  ├─ forms-and-fields.md
│  │  │  ├─ inpt-txt-slct-tab-nav-variants.md
│  │  │  ├─ input-txt-slct-tab-nav-variants.md
│  │  │  ├─ manifest.json
│  │  │  ├─ mini-brand-guideline.md
│  │  │  ├─ mini-design-system.md
│  │  │  ├─ orders-page-multi-outlet.md
│  │  │  ├─ outlet-selector-pattern.md
│  │  │  ├─ outlet-ui-requirements.md
│  │  │  ├─ pages-backend-requirements.md
│  │  │  ├─ pages-list.md
│  │  │  ├─ payment-ui-requirements.md
│  │  │  ├─ responsive-admin-rules.md
│  │  │  ├─ telegram-bot-ux.md
│  │  │  ├─ ui-component-style.md
│  │  │  ├─ ui-states.md
│  │  │  ├─ visual-style.md
│  │  │  └─ workflow-buttons.md
│  │  ├─ 08-security
│  │  │  ├─ ALL_SECURITY_DOCS_COMBINED.md
│  │  │  ├─ README.md
│  │  │  ├─ admin-dashboard-security.md
│  │  │  ├─ ai-action-security.md
│  │  │  ├─ ai-prompt-security.md
│  │  │  ├─ api-security.md
│  │  │  ├─ asset-access-security.md
│  │  │  ├─ audit-logging-security.md
│  │  │  ├─ auth-authz.md
│  │  │  ├─ backup-docs
│  │  │  │  └─ backend-security-docs-v2.zip
│  │  │  ├─ backup-recovery-security.md
│  │  │  ├─ data-protection.md
│  │  │  ├─ dependency-supply-chain-security.md
│  │  │  ├─ file-storage-security.md
│  │  │  ├─ incident-response.md
│  │  │  ├─ manifest.json
│  │  │  ├─ meta-platform-security.md
│  │  │  ├─ outlet-access-security.md
│  │  │  ├─ payment-security.md
│  │  │  ├─ rate-limit-abuse.md
│  │  │  ├─ rls-security.md
│  │  │  ├─ secrets-env-policy.md
│  │  │  ├─ security-checklist.md
│  │  │  ├─ telegram-security.md
│  │  │  ├─ threat-model.md
│  │  │  ├─ vulnerability-management.md
│  │  │  ├─ webhook-security.md
│  │  │  └─ workspace-tenant-security.md
│  │  ├─ 09-ai-context
│  │  │  ├─ ALL_AI_CONTEXT_DOCS_COMBINED.md
│  │  │  ├─ README.md
│  │  │  ├─ agent-evaluation.md
│  │  │  ├─ agent-response-format.md
│  │  │  ├─ ai-action-contract.md
│  │  │  ├─ ai-pipeline-rules.md
│  │  │  ├─ backend-boundaries.md
│  │  │  ├─ backup-docs
│  │  │  │  └─ backend-ai-context-docs-v2.zip
│  │  │  ├─ coding-guidelines.md
│  │  │  ├─ commerce-agent-guardrails.md
│  │  │  ├─ context-packing.md
│  │  │  ├─ current-task.md
│  │  │  ├─ database-context.md
│  │  │  ├─ do-not-break.md
│  │  │  ├─ human-handoff-context.md
│  │  │  ├─ manifest.json
│  │  │  ├─ notification-context.md
│  │  │  ├─ outlet-context.md
│  │  │  ├─ payment-context.md
│  │  │  ├─ prompt-context.md
│  │  │  ├─ security-rules-for-ai.md
│  │  │  ├─ storage-context.md
│  │  │  ├─ telegram-bot-context.md
│  │  │  ├─ testing-expectations.md
│  │  │  └─ tool-calling-contract.md
│  │  ├─ 10-testing
│  │  │  ├─ ALL_TESTING_DOCS_COMBINED.md
│  │  │  ├─ README.md
│  │  │  ├─ acceptance-test-cases.md
│  │  │  ├─ ai-agent-evaluation.md
│  │  │  ├─ ai-output-qa-checklist.md
│  │  │  ├─ backup-docs
│  │  │  │  ├─ backend-testing-docs-v2
│  │  │  │  └─ testing.zip
│  │  │  ├─ ci-test-pipeline.md
│  │  │  ├─ e2e-test-plan.md
│  │  │  ├─ image-generation-qa-checklist.md
│  │  │  ├─ integration-test-plan.md
│  │  │  ├─ jobs-test-plan.md
│  │  │  ├─ local-storage-test-plan.md
│  │  │  ├─ manifest.json
│  │  │  ├─ manual-qa-cliproxy.md
│  │  │  ├─ migration-test-plan.md
│  │  │  ├─ observability-test-plan.md
│  │  │  ├─ outlet-test-plan.md
│  │  │  ├─ payment-test-plan.md
│  │  │  ├─ performance-test-plan.md
│  │  │  ├─ qa-process.md
│  │  │  ├─ regression-checklist.md
│  │  │  ├─ security-test-plan.md
│  │  │  ├─ smoke-test-checklist.md
│  │  │  ├─ tdd-rules.md
│  │  │  ├─ telegram-commerce-test-plan.md
│  │  │  ├─ test-data.md
│  │  │  ├─ test-strategy.md
│  │  │  ├─ unit-test-plan.md
│  │  │  └─ webhook-test-plan.md
│  │  ├─ 11-sprint
│  │  │  ├─ README.md
│  │  │  ├─ agent-response-format.md
│  │  │  ├─ backlog.md
│  │  │  ├─ backup-docs
│  │  │  │  └─ sprint.zip
│  │  │  ├─ current-sprint.md
│  │  │  ├─ definition-of-done.md
│  │  │  ├─ dependency-map.md
│  │  │  ├─ estimation-guide.md
│  │  │  ├─ implementation-status.md
│  │  │  ├─ milestones.md
│  │  │  ├─ multi-outlet-foundation-sprint.md
│  │  │  ├─ mvp-demo-script.md
│  │  │  ├─ progress-log.md
│  │  │  ├─ release-checklist.md
│  │  │  ├─ risk-log.md
│  │  │  ├─ sprint-0-stabilization.md
│  │  │  ├─ sprint-1-webhook-service-boundary.md
│  │  │  ├─ sprint-2-product-catalog.md
│  │  │  ├─ sprint-3-cart-telegram-commerce.md
│  │  │  ├─ sprint-4-checkout-payment.md
│  │  │  ├─ sprint-5-admin-ops.md
│  │  │  ├─ sprint-6-mvp-hardening.md
│  │  │  ├─ sprint-plan.md
│  │  │  └─ task-breakdown.md
│  │  ├─ 12-devops
│  │  │  ├─ ALL_OPS_DOCS_COMBINED.md
│  │  │  ├─ README.md
│  │  │  ├─ ai-ops.md
│  │  │  ├─ backup-docs
│  │  │  │  └─ backend-ops-docs-v2.zip
│  │  │  ├─ backup-restore-runbook.md
│  │  │  ├─ database-ops.md
│  │  │  ├─ deployment-runbook.md
│  │  │  ├─ disaster-recovery.md
│  │  │  ├─ environment-ops.md
│  │  │  ├─ health-checks.md
│  │  │  ├─ incident-response-runbook.md
│  │  │  ├─ job-ops.md
│  │  │  ├─ maintenance-window.md
│  │  │  ├─ manifest.json
│  │  │  ├─ migration-ops.md
│  │  │  ├─ monitoring-alerting.md
│  │  │  ├─ ops-checklists.md
│  │  │  ├─ ops-log.md
│  │  │  ├─ ops-overview.md
│  │  │  ├─ payment-ops.md
│  │  │  ├─ postmortem-template.md
│  │  │  ├─ production-readiness.md
│  │  │  ├─ release-runbook.md
│  │  │  ├─ rollback-runbook.md
│  │  │  ├─ security-ops.md
│  │  │  ├─ storage-ops.md
│  │  │  ├─ telegram-ops.md
│  │  │  ├─ troubleshooting.md
│  │  │  └─ webhook-ops.md
│  │  ├─ 12-ops
│  │  │  ├─ ALL_OPS_DOCS_COMBINED.md
│  │  │  ├─ README.md
│  │  │  ├─ ai-ops.md
│  │  │  ├─ backup-restore-runbook.md
│  │  │  ├─ database-ops.md
│  │  │  ├─ deployment-runbook.md
│  │  │  ├─ disaster-recovery.md
│  │  │  ├─ environment-ops.md
│  │  │  ├─ health-checks.md
│  │  │  ├─ incident-response-runbook.md
│  │  │  ├─ job-ops.md
│  │  │  ├─ maintenance-window.md
│  │  │  ├─ migration-ops.md
│  │  │  ├─ monitoring-alerting.md
│  │  │  ├─ ops-checklists.md
│  │  │  ├─ ops-log.md
│  │  │  ├─ ops-overview.md
│  │  │  ├─ payment-ops.md
│  │  │  ├─ postmortem-template.md
│  │  │  ├─ production-readiness.md
│  │  │  ├─ release-runbook.md
│  │  │  ├─ rollback-runbook.md
│  │  │  ├─ security-ops.md
│  │  │  ├─ storage-ops.md
│  │  │  ├─ telegram-ops.md
│  │  │  ├─ troubleshooting.md
│  │  │  └─ webhook-ops.md
│  │  ├─ ALL_MULTI_OUTLET_UPDATED_DOCS_COMBINED.md
│  │  ├─ CHANGED-FILES-MULTI-OUTLET-V3.md
│  │  ├─ READING-ORDER.md
│  │  ├─ README-MERGED-PACKAGE.md
│  │  ├─ REPLACE-SAFE-NOTES.md
│  │  ├─ brief
│  │  │  ├─ ALL_BRIEFS_COMBINED.md
│  │  │  ├─ README.md
│  │  │  ├─ Technical_Brief_v3.md
│  │  │  ├─ agent-handoff-brief.md
│  │  │  ├─ ai-agent-brief.md
│  │  │  ├─ backup-docs
│  │  │  │  └─ backend-brief-docs-v2.zip
│  │  │  ├─ current-priority-brief.md
│  │  │  ├─ current-system-brief.md
│  │  │  ├─ data-migration-brief.md
│  │  │  ├─ folder-map-brief.md
│  │  │  ├─ implementation-priority-brief.md
│  │  │  ├─ manifest.json
│  │  │  ├─ mvp-brief.md
│  │  │  ├─ payment-brief.md
│  │  │  ├─ project-brief.md
│  │  │  ├─ quick-prompt-for-ai-agent.md
│  │  │  ├─ security-brief.md
│  │  │  ├─ target-system-brief.md
│  │  │  ├─ task-brief-template.md
│  │  │  ├─ telegram-commerce-brief.md
│  │  │  └─ testing-brief.md
│  │  ├─ chatgpt-context
│  │  │  ├─ PROJECT_CONTEXT_REPORT.md
│  │  │  ├─ Untitled Document.txt
│  │  │  ├─ backend-docs-full-merged-multi-outlet-v3.zip
│  │  │  └─ backup-docs.zip
│  │  ├─ index.md
│  │  └─ manifest.json
│  └─ frontend
├─ foto masalah
│  ├─ contoh-landing.jsx
│  ├─ image.png
│  ├─ inbox ui.jpg
│  ├─ inbox.jsx
│  └─ ui image.jpg
├─ package.json
├─ scripts
│  └─ dev.js
├─ server
│  ├─ change_role.js
│  ├─ check_owners.js
│  ├─ fix_account.js
│  ├─ inspect_chat.js
│  ├─ inspect_users.js
│  ├─ package-lock.json
│  ├─ package.json
│  ├─ scripts
│  │  ├─ audit.js
│  │  ├─ check_platforms.js
│  │  ├─ cleanup.js
│  │  ├─ cleanup_platforms.js
│  │  ├─ create-user.js
│  │  ├─ debug-instagram-messages.mjs
│  │  ├─ debug-platforms.mjs
│  │  ├─ fixPlatformType.js
│  │  ├─ fixUser.js
│  │  ├─ seed.js
│  │  ├─ test.js
│  │  └─ test_webhook_route.js
│  ├─ simulate_webhook.js
│  ├─ src
│  │  ├─ index.js
│  │  ├─ middleware
│  │  │  └─ auth.js
│  │  ├─ models
│  │  │  ├─ Agent.js
│  │  │  ├─ Chat.js
│  │  │  ├─ Complaint.js
│  │  │  ├─ Contact.js
│  │  │  ├─ Knowledge.js
│  │  │  ├─ Message.js
│  │  │  ├─ OTP.js
│  │  │  ├─ Order.js
│  │  │  ├─ PasswordReset.js
│  │  │  ├─ Platform.js
│  │  │  ├─ Setting.js
│  │  │  └─ User.js
│  │  ├─ routes
│  │  │  ├─ agents.js
│  │  │  ├─ analytics.js
│  │  │  ├─ auth.js
│  │  │  ├─ billing.js
│  │  │  ├─ chats.js
│  │  │  ├─ complaints.js
│  │  │  ├─ contacts.js
│  │  │  ├─ integrations.js
│  │  │  ├─ orders.js
│  │  │  ├─ platforms.js
│  │  │  ├─ profile.js
│  │  │  ├─ settings.js
│  │  │  ├─ users.js
│  │  │  └─ webhooks
│  │  │     ├─ index.js
│  │  │     ├─ meta.js
│  │  │     ├─ metaTest.js
│  │  │     ├─ telegram.js
│  │  │     └─ telegram_buffer_helper.js
│  │  ├─ services
│  │  │  ├─ ai.js
│  │  │  ├─ aiClient.js
│  │  │  ├─ followups.js
│  │  │  ├─ mail.js
│  │  │  ├─ messageBuffer.js
│  │  │  └─ sender.js
│  │  └─ utils
│  │     ├─ downloader.js
│  │     ├─ fileMentions.js
│  │     └─ messageSplitter.js
│  └─ uploads
│     ├─ 1760322857296.pdf
│     ├─ 1760322871987.pdf
│     ├─ 1760324075471.pdf
│     ├─ 1760337060647.png
│     ├─ 1760343094763.png
│     ├─ 1760343101846.png
│     ├─ 1760946549814.png
│     ├─ 1761181713591.pdf
│     ├─ 1761181795053.pdf
│     ├─ 1761183958596.pdf
│     ├─ 1761184166977.pdf
│     ├─ 1761184224047.pdf
│     ├─ 1761185349154.pdf
│     ├─ 1761185566730-SURAT_DISPENSASI_SELVI.pdf
│     ├─ 1761186026727-SURAT_DISPENSASI_SELVI.pdf
│     ├─ 1761186102196-SURAT_DISPENSASI_SELVI.pdf
│     ├─ 1761186134344-SURAT_DISPENSASI_SELVI.pdf
│     ├─ 1761187398261-SURAT_DISPENSASI_SELVI.pdf
│     ├─ ChatGPT_Image_6_Agu_2025_15.01.54.png
│     ├─ SURAT_DISPENSASI_RAFIF.pdf
│     └─ SURAT_DISPENSASI_SELVI.pdf
├─ temp_meta.txt
└─ web
   ├─ .prettierrc
   ├─ eslint.config.js
   ├─ fix_sidebar.js
   ├─ index.html
   ├─ package-lock.json
   ├─ package.json
   ├─ src
   │  ├─ agents.css
   │  ├─ analytics.css
   │  ├─ api
   │  │  └─ index.js
   │  ├─ assets
   │  │  └─ Brand.png
   │  ├─ components
   │  │  ├─ AgentSales.jsx
   │  │  ├─ BrandIcon.jsx
   │  │  ├─ ChatPanel.jsx
   │  │  ├─ ContactPanel.jsx
   │  │  ├─ FileInput.jsx
   │  │  ├─ FilterPopup.jsx
   │  │  ├─ Navbar.jsx
   │  │  ├─ PlatformPickerModal.jsx
   │  │  ├─ QuickActions.jsx
   │  │  └─ Sidebar.jsx
   │  ├─ contacts.css
   │  ├─ demoState.js
   │  ├─ inbox-modern-backup.css
   │  ├─ inbox-modern-test.css
   │  ├─ inbox-modern.css
   │  ├─ main.jsx
   │  ├─ modal.css
   │  ├─ pages
   │  │  ├─ Complaints.jsx
   │  │  ├─ Dashboard.jsx
   │  │  ├─ ForgotPassword.jsx
   │  │  ├─ Landing.jsx
   │  │  ├─ Login.jsx
   │  │  ├─ Orders.jsx
   │  │  ├─ Platforms.jsx
   │  │  ├─ Register.jsx
   │  │  ├─ ResetPassword.jsx
   │  │  └─ Verify.jsx
   │  ├─ platforms.css
   │  └─ styles.css
   ├─ vite.config.js
   └─ widen_sidebar.js

```
```
selaluteh-chatbot-crm
├─ .agents
├─ .codex
├─ CLOUDFLARE_TUNNEL_GUIDE.md
├─ Dockerfile.server
├─ Dockerfile.web
├─ README.md
├─ docker-compose-advanced.yml
├─ docker-compose-full.yml
├─ docker-compose-with-ngrok.yml
├─ docker-compose.yml
├─ docs
│  ├─ .obsidian
│  │  ├─ app.json
│  │  ├─ appearance.json
│  │  ├─ core-plugins.json
│  │  └─ workspace.json
│  ├─ backend
│  │  ├─ .obsidian
│  │  │  ├─ icons
│  │  │  └─ plugins
│  │  │     └─ obsidian-icon-folder
│  │  ├─ 00-overview
│  │  │  ├─ ALL_OVERVIEW_DOCS_COMBINED.md
│  │  │  ├─ README.md
│  │  │  ├─ assumptions-constraints.md
│  │  │  ├─ current-state.md
│  │  │  ├─ decision-summary.md
│  │  │  ├─ glossary.md
│  │  │  ├─ goals-kpi.md
│  │  │  ├─ mvp-principles.md
│  │  │  ├─ non-goals.md
│  │  │  ├─ overview-map.md
│  │  │  ├─ product-vision.md
│  │  │  ├─ project-summary.md
│  │  │  ├─ risks-overview.md
│  │  │  ├─ scope.md
│  │  │  ├─ stakeholders.md
│  │  │  ├─ success-metrics.md
│  │  │  └─ target-state.md
│  │  ├─ 00-research
│  │  │  ├─ 01.Pedagogy
│  │  │  └─ AI Interactive Learning Microsite Generator – Perplexity.md
│  │  ├─ 000-business
│  │  │  ├─ ALL_BUSINESS_DOCS_COMBINED.md
│  │  │  ├─ README.md
│  │  │  ├─ backup-docs
│  │  │  │  └─ backend-business-docs-v2.zip
│  │  │  ├─ brd.md
│  │  │  ├─ business-decision-log.md
│  │  │  ├─ business-metrics.md
│  │  │  ├─ business-model.md
│  │  │  ├─ business-risks.md
│  │  │  ├─ competitor-analysis.md
│  │  │  ├─ customer-segments.md
│  │  │  ├─ financial-assumptions.md
│  │  │  ├─ go-to-market.md
│  │  │  ├─ legal-business-notes.md
│  │  │  ├─ manifest.json
│  │  │  ├─ market-positioning.md
│  │  │  ├─ mvp-validation-plan.md
│  │  │  ├─ mvp-validation-scorecard.md
│  │  │  ├─ partnerships.md
│  │  │  ├─ pricing-strategy.md
│  │  │  ├─ revenue-model.md
│  │  │  ├─ roadmap-business.md
│  │  │  ├─ sales-discovery-questions.md
│  │  │  ├─ unit-economics.md
│  │  │  └─ value-proposition.md
│  │  ├─ 0000-business
│  │  │  ├─ ALL_BUSINESS_DOCS_COMBINED.md
│  │  │  ├─ README.md
│  │  │  ├─ brd.md
│  │  │  ├─ business-decision-log.md
│  │  │  ├─ business-metrics.md
│  │  │  ├─ business-model.md
│  │  │  ├─ business-risks.md
│  │  │  ├─ competitor-analysis.md
│  │  │  ├─ customer-segments.md
│  │  │  ├─ financial-assumptions.md
│  │  │  ├─ go-to-market.md
│  │  │  ├─ legal-business-notes.md
│  │  │  ├─ market-positioning.md
│  │  │  ├─ mvp-validation-plan.md
│  │  │  ├─ mvp-validation-scorecard.md
│  │  │  ├─ partnerships.md
│  │  │  ├─ pricing-strategy.md
│  │  │  ├─ revenue-model.md
│  │  │  ├─ roadmap-business.md
│  │  │  ├─ sales-discovery-questions.md
│  │  │  ├─ unit-economics.md
│  │  │  └─ value-proposition.md
│  │  ├─ 001-overview
│  │  │  ├─ ALL_OVERVIEW_DOCS_COMBINED.md
│  │  │  ├─ README.md
│  │  │  ├─ assumptions-constraints.md
│  │  │  ├─ backup-docs
│  │  │  │  └─ backend-overview-docs-v2.zip
│  │  │  ├─ current-state.md
│  │  │  ├─ decision-summary.md
│  │  │  ├─ glossary.md
│  │  │  ├─ goals-kpi.md
│  │  │  ├─ manifest.json
│  │  │  ├─ mvp-principles.md
│  │  │  ├─ non-goals.md
│  │  │  ├─ overview-map.md
│  │  │  ├─ product-vision.md
│  │  │  ├─ project-summary.md
│  │  │  ├─ risks-overview.md
│  │  │  ├─ scope.md
│  │  │  ├─ stakeholders.md
│  │  │  ├─ success-metrics.md
│  │  │  └─ target-state.md
│  │  ├─ 01-product
│  │  │  ├─ ALL_PRODUCT_DOCS_COMBINED.md
│  │  │  ├─ README.md
│  │  │  ├─ admin-experience.md
│  │  │  ├─ backup-docs
│  │  │  │  └─ brand-personality.zip
│  │  │  ├─ brand-personality.md
│  │  │  ├─ customer-journey.md
│  │  │  ├─ feature-list.md
│  │  │  ├─ logo-direction.md
│  │  │  ├─ logo-system.md
│  │  │  ├─ manifest.json
│  │  │  ├─ mvp-scope.md
│  │  │  ├─ out-of-scope.md
│  │  │  ├─ product-vision.md
│  │  │  ├─ release-plan.md
│  │  │  ├─ requirements.md
│  │  │  ├─ risks-and-assumptions.md
│  │  │  ├─ success-metrics.md
│  │  │  ├─ user-personas.md
│  │  │  └─ user-stories.md
│  │  ├─ 02-flows
│  │  │  ├─ README.md
│  │  │  ├─ admin-flow.md
│  │  │  ├─ auth-flow.md
│  │  │  ├─ backup-docs
│  │  │  │  └─ backend-flows-v2.zip
│  │  │  ├─ chatbot-ai-flow.md
│  │  │  ├─ checkout-flow.md
│  │  │  ├─ complaint-flow.md
│  │  │  ├─ edge-cases.md
│  │  │  ├─ human-takeover-flow.md
│  │  │  ├─ media-file-flow.md
│  │  │  ├─ order-fulfillment-flow.md
│  │  │  ├─ outlet-selection-flow.md
│  │  │  ├─ payment-flow.md
│  │  │  ├─ product-catalog-flow.md
│  │  │  ├─ telegram-commerce-flow.md
│  │  │  └─ webhook-message-flow.md
│  │  ├─ 03-business-rules
│  │  │  ├─ README.md
│  │  │  ├─ ai-agent-rules.md
│  │  │  ├─ audit-log-rules.md
│  │  │  ├─ backup-docs
│  │  │  │  └─ domain-rules.zip
│  │  │  ├─ cart-checkout-rules.md
│  │  │  ├─ complaint-rules.md
│  │  │  ├─ domain-rules.md
│  │  │  ├─ export-rules.md
│  │  │  ├─ generation-rules.md
│  │  │  ├─ human-takeover-rules.md
│  │  │  ├─ manifest.json
│  │  │  ├─ notification-rules.md
│  │  │  ├─ order-rules.md
│  │  │  ├─ outlet-access-rules.md
│  │  │  ├─ outlet-rules.md
│  │  │  ├─ payment-rules.md
│  │  │  ├─ permissions.md
│  │  │  ├─ product-catalog-rules.md
│  │  │  ├─ quota-rules.md
│  │  │  ├─ status-rules.md
│  │  │  ├─ storage-rules.md
│  │  │  ├─ telegram-commerce-rules.md
│  │  │  ├─ validations.md
│  │  │  ├─ webhook-rules.md
│  │  │  └─ workspace-tenant-rules.md
│  │  ├─ 04-tech-spec
│  │  │  ├─ README.md
│  │  │  ├─ ai-pipeline.md
│  │  │  ├─ architecture.md
│  │  │  ├─ backend-tech-spec-only-v2
│  │  │  │  └─ backend-tech-spec-only-v2.zip
│  │  │  ├─ background-jobs.md
│  │  │  ├─ coding-rules.md
│  │  │  ├─ database-access.md
│  │  │  ├─ decision-log.md
│  │  │  ├─ deployment.md
│  │  │  ├─ environment-config.md
│  │  │  ├─ folder-structure.md
│  │  │  ├─ observability.md
│  │  │  ├─ recommended-scalable-structure.md
│  │  │  ├─ rendering-export.md
│  │  │  ├─ runbook.md
│  │  │  ├─ storage-strategy.md
│  │  │  └─ tech-stack.md
│  │  ├─ 05-api-spec
│  │  │  ├─ README.md
│  │  │  ├─ agents-api.md
│  │  │  ├─ ai-actions-api.md
│  │  │  ├─ analytics-api.md
│  │  │  ├─ api-versioning.md
│  │  │  ├─ auth-api.md
│  │  │  ├─ backup-docs
│  │  │  │  └─ auth-api.zip
│  │  │  ├─ carts-api.md
│  │  │  ├─ chats-api.md
│  │  │  ├─ checkout-api.md
│  │  │  ├─ complaints-api.md
│  │  │  ├─ contacts-api.md
│  │  │  ├─ error-format.md
│  │  │  ├─ files-api.md
│  │  │  ├─ integrations-api.md
│  │  │  ├─ jobs-api.md
│  │  │  ├─ orders-api.md
│  │  │  ├─ outlet-access-api.md
│  │  │  ├─ outlets-api.md
│  │  │  ├─ overview.md
│  │  │  ├─ payments-api.md
│  │  │  ├─ platforms-api.md
│  │  │  ├─ products-api.md
│  │  │  ├─ rate-limits.md
│  │  │  ├─ settings-api.md
│  │  │  ├─ telegram-commerce-api.md
│  │  │  ├─ users-api.md
│  │  │  └─ webhooks-api.md
│  │  ├─ 06-data
│  │  │  ├─ ALL_DOCS_COMBINED.md
│  │  │  ├─ MANIFEST.json
│  │  │  ├─ README.md
│  │  │  ├─ ai-commerce-guardrails.md
│  │  │  ├─ backup-docs
│  │  │  │  ├─ telegram-marketplace-data-migrations-v2
│  │  │  │  ├─ telegram-marketplace-data-migrations-v2.zip
│  │  │  │  └─ updated-data-database-docs.zip
│  │  │  ├─ data-flow.md
│  │  │  ├─ database-schema.md
│  │  │  ├─ entities.md
│  │  │  ├─ erd.md
│  │  │  ├─ implementation-checklist.md
│  │  │  ├─ import-script-spec.md
│  │  │  ├─ indexes.md
│  │  │  ├─ marketplace-module.md
│  │  │  ├─ migration-plan.md
│  │  │  ├─ migrations
│  │  │  │  ├─ ALL_MIGRATIONS_COMBINED.md
│  │  │  │  ├─ README.md
│  │  │  │  ├─ checklists
│  │  │  │  │  ├─ marketplace-mvp-checklist.md
│  │  │  │  │  ├─ post-migration-checklist.md
│  │  │  │  │  └─ pre-migration-checklist.md
│  │  │  │  ├─ manifest.json
│  │  │  │  ├─ notes
│  │  │  │  │  ├─ cutover-plan.md
│  │  │  │  │  ├─ data-backfill-order.md
│  │  │  │  │  ├─ marketplace-schema-notes.md
│  │  │  │  │  ├─ mongo-to-postgres-mapping.md
│  │  │  │  │  ├─ payment-gateway-contract.md
│  │  │  │  │  ├─ repository-layer-contract.md
│  │  │  │  │  └─ telegram-commerce-flow.md
│  │  │  │  └─ sql
│  │  │  │     ├─ 001_extensions_and_enums.sql
│  │  │  │     ├─ 002_core_identity.sql
│  │  │  │     ├─ 003_platforms_agents.sql
│  │  │  │     ├─ 004_crm_chats_messages.sql
│  │  │  │     ├─ 005_orders_complaints_files.sql
│  │  │  │     ├─ 006_indexes.sql
│  │  │  │     ├─ 007_rls_policies.sql
│  │  │  │     ├─ 008_local_file_storage.sql
│  │  │  │     ├─ 009_migration_validation_queries.sql
│  │  │  │     └─ 009_multi_workspace_outlet_foundation.sql
│  │  │  ├─ payment-gateway.md
│  │  │  ├─ query-contracts.md
│  │  │  ├─ relationships.md
│  │  │  ├─ repository-layer-contract.md
│  │  │  ├─ rls-policies.md
│  │  │  ├─ seed-data.md
│  │  │  ├─ storage-model.md
│  │  │  └─ telegram-commerce-flow.md
│  │  ├─ 07-uiux
│  │  │  ├─ ALL_UIUX_DOCS_COMBINED.md
│  │  │  ├─ README.md
│  │  │  ├─ accessibility.md
│  │  │  ├─ admin-actions-matrix.md
│  │  │  ├─ backend-ui-contract.md
│  │  │  ├─ backup-docs
│  │  │  │  └─ backend-uiux-docs-v2.zip
│  │  │  ├─ btn-card-bdg-variants.md
│  │  │  ├─ btn-crd-bdg-variants.md
│  │  │  ├─ color-palette.md
│  │  │  ├─ components-backend-contract.md
│  │  │  ├─ components-list.md
│  │  │  ├─ darkmode-ui-component-style.md
│  │  │  ├─ data-table-actions.md
│  │  │  ├─ design-system.md
│  │  │  ├─ design.md
│  │  │  ├─ filters-search-sort.md
│  │  │  ├─ fontbrand-typography.md
│  │  │  ├─ forms-and-fields.md
│  │  │  ├─ inpt-txt-slct-tab-nav-variants.md
│  │  │  ├─ input-txt-slct-tab-nav-variants.md
│  │  │  ├─ manifest.json
│  │  │  ├─ mini-brand-guideline.md
│  │  │  ├─ mini-design-system.md
│  │  │  ├─ orders-page-multi-outlet.md
│  │  │  ├─ outlet-selector-pattern.md
│  │  │  ├─ outlet-ui-requirements.md
│  │  │  ├─ pages-backend-requirements.md
│  │  │  ├─ pages-list.md
│  │  │  ├─ payment-ui-requirements.md
│  │  │  ├─ responsive-admin-rules.md
│  │  │  ├─ telegram-bot-ux.md
│  │  │  ├─ ui-component-style.md
│  │  │  ├─ ui-states.md
│  │  │  ├─ visual-style.md
│  │  │  └─ workflow-buttons.md
│  │  ├─ 08-security
│  │  │  ├─ ALL_SECURITY_DOCS_COMBINED.md
│  │  │  ├─ README.md
│  │  │  ├─ admin-dashboard-security.md
│  │  │  ├─ ai-action-security.md
│  │  │  ├─ ai-prompt-security.md
│  │  │  ├─ api-security.md
│  │  │  ├─ asset-access-security.md
│  │  │  ├─ audit-logging-security.md
│  │  │  ├─ auth-authz.md
│  │  │  ├─ backup-docs
│  │  │  │  └─ backend-security-docs-v2.zip
│  │  │  ├─ backup-recovery-security.md
│  │  │  ├─ data-protection.md
│  │  │  ├─ dependency-supply-chain-security.md
│  │  │  ├─ file-storage-security.md
│  │  │  ├─ incident-response.md
│  │  │  ├─ manifest.json
│  │  │  ├─ meta-platform-security.md
│  │  │  ├─ outlet-access-security.md
│  │  │  ├─ payment-security.md
│  │  │  ├─ rate-limit-abuse.md
│  │  │  ├─ rls-security.md
│  │  │  ├─ secrets-env-policy.md
│  │  │  ├─ security-checklist.md
│  │  │  ├─ telegram-security.md
│  │  │  ├─ threat-model.md
│  │  │  ├─ vulnerability-management.md
│  │  │  ├─ webhook-security.md
│  │  │  └─ workspace-tenant-security.md
│  │  ├─ 09-ai-context
│  │  │  ├─ ALL_AI_CONTEXT_DOCS_COMBINED.md
│  │  │  ├─ README.md
│  │  │  ├─ agent-evaluation.md
│  │  │  ├─ agent-response-format.md
│  │  │  ├─ ai-action-contract.md
│  │  │  ├─ ai-pipeline-rules.md
│  │  │  ├─ backend-boundaries.md
│  │  │  ├─ backup-docs
│  │  │  │  └─ backend-ai-context-docs-v2.zip
│  │  │  ├─ coding-guidelines.md
│  │  │  ├─ commerce-agent-guardrails.md
│  │  │  ├─ context-packing.md
│  │  │  ├─ current-task.md
│  │  │  ├─ database-context.md
│  │  │  ├─ do-not-break.md
│  │  │  ├─ human-handoff-context.md
│  │  │  ├─ manifest.json
│  │  │  ├─ notification-context.md
│  │  │  ├─ outlet-context.md
│  │  │  ├─ payment-context.md
│  │  │  ├─ prompt-context.md
│  │  │  ├─ security-rules-for-ai.md
│  │  │  ├─ storage-context.md
│  │  │  ├─ telegram-bot-context.md
│  │  │  ├─ testing-expectations.md
│  │  │  └─ tool-calling-contract.md
│  │  ├─ 10-testing
│  │  │  ├─ ALL_TESTING_DOCS_COMBINED.md
│  │  │  ├─ README.md
│  │  │  ├─ acceptance-test-cases.md
│  │  │  ├─ ai-agent-evaluation.md
│  │  │  ├─ ai-output-qa-checklist.md
│  │  │  ├─ backup-docs
│  │  │  │  ├─ backend-testing-docs-v2
│  │  │  │  └─ testing.zip
│  │  │  ├─ ci-test-pipeline.md
│  │  │  ├─ e2e-test-plan.md
│  │  │  ├─ image-generation-qa-checklist.md
│  │  │  ├─ integration-test-plan.md
│  │  │  ├─ jobs-test-plan.md
│  │  │  ├─ local-storage-test-plan.md
│  │  │  ├─ manifest.json
│  │  │  ├─ manual-qa-cliproxy.md
│  │  │  ├─ migration-test-plan.md
│  │  │  ├─ observability-test-plan.md
│  │  │  ├─ outlet-test-plan.md
│  │  │  ├─ payment-test-plan.md
│  │  │  ├─ performance-test-plan.md
│  │  │  ├─ qa-process.md
│  │  │  ├─ regression-checklist.md
│  │  │  ├─ security-test-plan.md
│  │  │  ├─ smoke-test-checklist.md
│  │  │  ├─ tdd-rules.md
│  │  │  ├─ telegram-commerce-test-plan.md
│  │  │  ├─ test-data.md
│  │  │  ├─ test-strategy.md
│  │  │  ├─ unit-test-plan.md
│  │  │  └─ webhook-test-plan.md
│  │  ├─ 11-sprint
│  │  │  ├─ README.md
│  │  │  ├─ agent-response-format.md
│  │  │  ├─ backlog.md
│  │  │  ├─ backup-docs
│  │  │  │  └─ sprint.zip
│  │  │  ├─ current-sprint.md
│  │  │  ├─ definition-of-done.md
│  │  │  ├─ dependency-map.md
│  │  │  ├─ estimation-guide.md
│  │  │  ├─ implementation-status.md
│  │  │  ├─ milestones.md
│  │  │  ├─ multi-outlet-foundation-sprint.md
│  │  │  ├─ mvp-demo-script.md
│  │  │  ├─ progress-log.md
│  │  │  ├─ release-checklist.md
│  │  │  ├─ risk-log.md
│  │  │  ├─ sprint-0-stabilization.md
│  │  │  ├─ sprint-1-webhook-service-boundary.md
│  │  │  ├─ sprint-2-product-catalog.md
│  │  │  ├─ sprint-3-cart-telegram-commerce.md
│  │  │  ├─ sprint-4-checkout-payment.md
│  │  │  ├─ sprint-5-admin-ops.md
│  │  │  ├─ sprint-6-mvp-hardening.md
│  │  │  ├─ sprint-plan.md
│  │  │  └─ task-breakdown.md
│  │  ├─ 12-devops
│  │  │  ├─ ALL_OPS_DOCS_COMBINED.md
│  │  │  ├─ README.md
│  │  │  ├─ ai-ops.md
│  │  │  ├─ backup-docs
│  │  │  │  └─ backend-ops-docs-v2.zip
│  │  │  ├─ backup-restore-runbook.md
│  │  │  ├─ database-ops.md
│  │  │  ├─ deployment-runbook.md
│  │  │  ├─ disaster-recovery.md
│  │  │  ├─ environment-ops.md
│  │  │  ├─ health-checks.md
│  │  │  ├─ incident-response-runbook.md
│  │  │  ├─ job-ops.md
│  │  │  ├─ maintenance-window.md
│  │  │  ├─ manifest.json
│  │  │  ├─ migration-ops.md
│  │  │  ├─ monitoring-alerting.md
│  │  │  ├─ ops-checklists.md
│  │  │  ├─ ops-log.md
│  │  │  ├─ ops-overview.md
│  │  │  ├─ payment-ops.md
│  │  │  ├─ postmortem-template.md
│  │  │  ├─ production-readiness.md
│  │  │  ├─ release-runbook.md
│  │  │  ├─ rollback-runbook.md
│  │  │  ├─ security-ops.md
│  │  │  ├─ storage-ops.md
│  │  │  ├─ telegram-ops.md
│  │  │  ├─ troubleshooting.md
│  │  │  └─ webhook-ops.md
│  │  ├─ 12-ops
│  │  │  ├─ ALL_OPS_DOCS_COMBINED.md
│  │  │  ├─ README.md
│  │  │  ├─ ai-ops.md
│  │  │  ├─ backup-restore-runbook.md
│  │  │  ├─ database-ops.md
│  │  │  ├─ deployment-runbook.md
│  │  │  ├─ disaster-recovery.md
│  │  │  ├─ environment-ops.md
│  │  │  ├─ health-checks.md
│  │  │  ├─ incident-response-runbook.md
│  │  │  ├─ job-ops.md
│  │  │  ├─ maintenance-window.md
│  │  │  ├─ migration-ops.md
│  │  │  ├─ monitoring-alerting.md
│  │  │  ├─ ops-checklists.md
│  │  │  ├─ ops-log.md
│  │  │  ├─ ops-overview.md
│  │  │  ├─ payment-ops.md
│  │  │  ├─ postmortem-template.md
│  │  │  ├─ production-readiness.md
│  │  │  ├─ release-runbook.md
│  │  │  ├─ rollback-runbook.md
│  │  │  ├─ security-ops.md
│  │  │  ├─ storage-ops.md
│  │  │  ├─ telegram-ops.md
│  │  │  ├─ troubleshooting.md
│  │  │  └─ webhook-ops.md
│  │  ├─ ALL_MULTI_OUTLET_UPDATED_DOCS_COMBINED.md
│  │  ├─ CHANGED-FILES-MULTI-OUTLET-V3.md
│  │  ├─ READING-ORDER.md
│  │  ├─ README-MERGED-PACKAGE.md
│  │  ├─ REPLACE-SAFE-NOTES.md
│  │  ├─ brief
│  │  │  ├─ ALL_BRIEFS_COMBINED.md
│  │  │  ├─ README.md
│  │  │  ├─ Technical_Brief_v3.md
│  │  │  ├─ agent-handoff-brief.md
│  │  │  ├─ ai-agent-brief.md
│  │  │  ├─ backup-docs
│  │  │  │  └─ backend-brief-docs-v2.zip
│  │  │  ├─ current-priority-brief.md
│  │  │  ├─ current-system-brief.md
│  │  │  ├─ data-migration-brief.md
│  │  │  ├─ folder-map-brief.md
│  │  │  ├─ implementation-priority-brief.md
│  │  │  ├─ manifest.json
│  │  │  ├─ mvp-brief.md
│  │  │  ├─ payment-brief.md
│  │  │  ├─ project-brief.md
│  │  │  ├─ quick-prompt-for-ai-agent.md
│  │  │  ├─ security-brief.md
│  │  │  ├─ target-system-brief.md
│  │  │  ├─ task-brief-template.md
│  │  │  ├─ telegram-commerce-brief.md
│  │  │  └─ testing-brief.md
│  │  ├─ chatgpt-context
│  │  │  ├─ PROJECT_CONTEXT_REPORT.md
│  │  │  ├─ Untitled Document.txt
│  │  │  ├─ backend-docs-full-merged-multi-outlet-v3.zip
│  │  │  └─ backup-docs.zip
│  │  ├─ index.md
│  │  └─ manifest.json
│  └─ frontend
├─ foto masalah
│  ├─ contoh-landing.jsx
│  ├─ image.png
│  ├─ inbox ui.jpg
│  ├─ inbox.jsx
│  └─ ui image.jpg
├─ package.json
├─ scripts
│  └─ dev.js
├─ server
│  ├─ change_role.js
│  ├─ check_owners.js
│  ├─ fix_account.js
│  ├─ inspect_chat.js
│  ├─ inspect_users.js
│  ├─ package-lock.json
│  ├─ package.json
│  ├─ scripts
│  │  ├─ audit.js
│  │  ├─ check_platforms.js
│  │  ├─ cleanup.js
│  │  ├─ cleanup_platforms.js
│  │  ├─ create-user.js
│  │  ├─ debug-instagram-messages.mjs
│  │  ├─ debug-platforms.mjs
│  │  ├─ fixPlatformType.js
│  │  ├─ fixUser.js
│  │  ├─ seed.js
│  │  ├─ test.js
│  │  └─ test_webhook_route.js
│  ├─ simulate_webhook.js
│  ├─ src
│  │  ├─ index.js
│  │  ├─ middleware
│  │  │  └─ auth.js
│  │  ├─ models
│  │  │  ├─ Agent.js
│  │  │  ├─ Chat.js
│  │  │  ├─ Complaint.js
│  │  │  ├─ Contact.js
│  │  │  ├─ Knowledge.js
│  │  │  ├─ Message.js
│  │  │  ├─ OTP.js
│  │  │  ├─ Order.js
│  │  │  ├─ PasswordReset.js
│  │  │  ├─ Platform.js
│  │  │  ├─ Setting.js
│  │  │  └─ User.js
│  │  ├─ routes
│  │  │  ├─ agents.js
│  │  │  ├─ analytics.js
│  │  │  ├─ auth.js
│  │  │  ├─ billing.js
│  │  │  ├─ chats.js
│  │  │  ├─ complaints.js
│  │  │  ├─ contacts.js
│  │  │  ├─ integrations.js
│  │  │  ├─ orders.js
│  │  │  ├─ platforms.js
│  │  │  ├─ profile.js
│  │  │  ├─ settings.js
│  │  │  ├─ users.js
│  │  │  └─ webhooks
│  │  │     ├─ index.js
│  │  │     ├─ meta.js
│  │  │     ├─ metaTest.js
│  │  │     ├─ telegram.js
│  │  │     └─ telegram_buffer_helper.js
│  │  ├─ services
│  │  │  ├─ ai.js
│  │  │  ├─ aiClient.js
│  │  │  ├─ followups.js
│  │  │  ├─ mail.js
│  │  │  ├─ messageBuffer.js
│  │  │  └─ sender.js
│  │  └─ utils
│  │     ├─ downloader.js
│  │     ├─ fileMentions.js
│  │     └─ messageSplitter.js
│  └─ uploads
│     ├─ 1760322857296.pdf
│     ├─ 1760322871987.pdf
│     ├─ 1760324075471.pdf
│     ├─ 1760337060647.png
│     ├─ 1760343094763.png
│     ├─ 1760343101846.png
│     ├─ 1760946549814.png
│     ├─ 1761181713591.pdf
│     ├─ 1761181795053.pdf
│     ├─ 1761183958596.pdf
│     ├─ 1761184166977.pdf
│     ├─ 1761184224047.pdf
│     ├─ 1761185349154.pdf
│     ├─ 1761185566730-SURAT_DISPENSASI_SELVI.pdf
│     ├─ 1761186026727-SURAT_DISPENSASI_SELVI.pdf
│     ├─ 1761186102196-SURAT_DISPENSASI_SELVI.pdf
│     ├─ 1761186134344-SURAT_DISPENSASI_SELVI.pdf
│     ├─ 1761187398261-SURAT_DISPENSASI_SELVI.pdf
│     ├─ ChatGPT_Image_6_Agu_2025_15.01.54.png
│     ├─ SURAT_DISPENSASI_RAFIF.pdf
│     └─ SURAT_DISPENSASI_SELVI.pdf
├─ temp_meta.txt
└─ web
   ├─ .prettierrc
   ├─ eslint.config.js
   ├─ fix_sidebar.js
   ├─ index.html
   ├─ package-lock.json
   ├─ package.json
   ├─ src
   │  ├─ agents.css
   │  ├─ analytics.css
   │  ├─ api
   │  │  └─ index.js
   │  ├─ assets
   │  │  └─ Brand.png
   │  ├─ components
   │  │  ├─ AgentSales.jsx
   │  │  ├─ BrandIcon.jsx
   │  │  ├─ ChatPanel.jsx
   │  │  ├─ ContactPanel.jsx
   │  │  ├─ FileInput.jsx
   │  │  ├─ FilterPopup.jsx
   │  │  ├─ Navbar.jsx
   │  │  ├─ PlatformPickerModal.jsx
   │  │  ├─ QuickActions.jsx
   │  │  └─ Sidebar.jsx
   │  ├─ contacts.css
   │  ├─ demoState.js
   │  ├─ inbox-modern-backup.css
   │  ├─ inbox-modern-test.css
   │  ├─ inbox-modern.css
   │  ├─ main.jsx
   │  ├─ modal.css
   │  ├─ pages
   │  │  ├─ Complaints.jsx
   │  │  ├─ Dashboard.jsx
   │  │  ├─ ForgotPassword.jsx
   │  │  ├─ Landing.jsx
   │  │  ├─ Login.jsx
   │  │  ├─ Orders.jsx
   │  │  ├─ Platforms.jsx
   │  │  ├─ Register.jsx
   │  │  ├─ ResetPassword.jsx
   │  │  └─ Verify.jsx
   │  ├─ platforms.css
   │  └─ styles.css
   ├─ vite.config.js
   └─ widen_sidebar.js

```
```
selaluteh-chatbot-crm
├─ .agents
├─ .codex
├─ CLOUDFLARE_TUNNEL_GUIDE.md
├─ Dockerfile.server
├─ Dockerfile.web
├─ README.md
├─ docker-compose-advanced.yml
├─ docker-compose-full.yml
├─ docker-compose-with-ngrok.yml
├─ docker-compose.yml
├─ docs
│  ├─ .obsidian
│  │  ├─ app.json
│  │  ├─ appearance.json
│  │  ├─ core-plugins.json
│  │  └─ workspace.json
│  ├─ backend
│  │  ├─ .obsidian
│  │  │  ├─ icons
│  │  │  └─ plugins
│  │  │     └─ obsidian-icon-folder
│  │  ├─ 00-overview
│  │  │  ├─ ALL_OVERVIEW_DOCS_COMBINED.md
│  │  │  ├─ README.md
│  │  │  ├─ assumptions-constraints.md
│  │  │  ├─ current-state.md
│  │  │  ├─ decision-summary.md
│  │  │  ├─ glossary.md
│  │  │  ├─ goals-kpi.md
│  │  │  ├─ mvp-principles.md
│  │  │  ├─ non-goals.md
│  │  │  ├─ overview-map.md
│  │  │  ├─ product-vision.md
│  │  │  ├─ project-summary.md
│  │  │  ├─ risks-overview.md
│  │  │  ├─ scope.md
│  │  │  ├─ stakeholders.md
│  │  │  ├─ success-metrics.md
│  │  │  └─ target-state.md
│  │  ├─ 00-research
│  │  │  ├─ 01.Pedagogy
│  │  │  └─ AI Interactive Learning Microsite Generator – Perplexity.md
│  │  ├─ 000-business
│  │  │  ├─ ALL_BUSINESS_DOCS_COMBINED.md
│  │  │  ├─ README.md
│  │  │  ├─ backup-docs
│  │  │  │  └─ backend-business-docs-v2.zip
│  │  │  ├─ brd.md
│  │  │  ├─ business-decision-log.md
│  │  │  ├─ business-metrics.md
│  │  │  ├─ business-model.md
│  │  │  ├─ business-risks.md
│  │  │  ├─ competitor-analysis.md
│  │  │  ├─ customer-segments.md
│  │  │  ├─ financial-assumptions.md
│  │  │  ├─ go-to-market.md
│  │  │  ├─ legal-business-notes.md
│  │  │  ├─ manifest.json
│  │  │  ├─ market-positioning.md
│  │  │  ├─ mvp-validation-plan.md
│  │  │  ├─ mvp-validation-scorecard.md
│  │  │  ├─ partnerships.md
│  │  │  ├─ pricing-strategy.md
│  │  │  ├─ revenue-model.md
│  │  │  ├─ roadmap-business.md
│  │  │  ├─ sales-discovery-questions.md
│  │  │  ├─ unit-economics.md
│  │  │  └─ value-proposition.md
│  │  ├─ 0000-business
│  │  │  ├─ ALL_BUSINESS_DOCS_COMBINED.md
│  │  │  ├─ README.md
│  │  │  ├─ brd.md
│  │  │  ├─ business-decision-log.md
│  │  │  ├─ business-metrics.md
│  │  │  ├─ business-model.md
│  │  │  ├─ business-risks.md
│  │  │  ├─ competitor-analysis.md
│  │  │  ├─ customer-segments.md
│  │  │  ├─ financial-assumptions.md
│  │  │  ├─ go-to-market.md
│  │  │  ├─ legal-business-notes.md
│  │  │  ├─ market-positioning.md
│  │  │  ├─ mvp-validation-plan.md
│  │  │  ├─ mvp-validation-scorecard.md
│  │  │  ├─ partnerships.md
│  │  │  ├─ pricing-strategy.md
│  │  │  ├─ revenue-model.md
│  │  │  ├─ roadmap-business.md
│  │  │  ├─ sales-discovery-questions.md
│  │  │  ├─ unit-economics.md
│  │  │  └─ value-proposition.md
│  │  ├─ 001-overview
│  │  │  ├─ ALL_OVERVIEW_DOCS_COMBINED.md
│  │  │  ├─ README.md
│  │  │  ├─ assumptions-constraints.md
│  │  │  ├─ backup-docs
│  │  │  │  └─ backend-overview-docs-v2.zip
│  │  │  ├─ current-state.md
│  │  │  ├─ decision-summary.md
│  │  │  ├─ glossary.md
│  │  │  ├─ goals-kpi.md
│  │  │  ├─ manifest.json
│  │  │  ├─ mvp-principles.md
│  │  │  ├─ non-goals.md
│  │  │  ├─ overview-map.md
│  │  │  ├─ product-vision.md
│  │  │  ├─ project-summary.md
│  │  │  ├─ risks-overview.md
│  │  │  ├─ scope.md
│  │  │  ├─ stakeholders.md
│  │  │  ├─ success-metrics.md
│  │  │  └─ target-state.md
│  │  ├─ 01-product
│  │  │  ├─ ALL_PRODUCT_DOCS_COMBINED.md
│  │  │  ├─ README.md
│  │  │  ├─ admin-experience.md
│  │  │  ├─ backup-docs
│  │  │  │  └─ brand-personality.zip
│  │  │  ├─ brand-personality.md
│  │  │  ├─ customer-journey.md
│  │  │  ├─ feature-list.md
│  │  │  ├─ logo-direction.md
│  │  │  ├─ logo-system.md
│  │  │  ├─ manifest.json
│  │  │  ├─ mvp-scope.md
│  │  │  ├─ out-of-scope.md
│  │  │  ├─ product-vision.md
│  │  │  ├─ release-plan.md
│  │  │  ├─ requirements.md
│  │  │  ├─ risks-and-assumptions.md
│  │  │  ├─ success-metrics.md
│  │  │  ├─ user-personas.md
│  │  │  └─ user-stories.md
│  │  ├─ 02-flows
│  │  │  ├─ README.md
│  │  │  ├─ admin-flow.md
│  │  │  ├─ auth-flow.md
│  │  │  ├─ backup-docs
│  │  │  │  └─ backend-flows-v2.zip
│  │  │  ├─ chatbot-ai-flow.md
│  │  │  ├─ checkout-flow.md
│  │  │  ├─ complaint-flow.md
│  │  │  ├─ edge-cases.md
│  │  │  ├─ human-takeover-flow.md
│  │  │  ├─ media-file-flow.md
│  │  │  ├─ order-fulfillment-flow.md
│  │  │  ├─ outlet-selection-flow.md
│  │  │  ├─ payment-flow.md
│  │  │  ├─ product-catalog-flow.md
│  │  │  ├─ telegram-commerce-flow.md
│  │  │  └─ webhook-message-flow.md
│  │  ├─ 03-business-rules
│  │  │  ├─ README.md
│  │  │  ├─ ai-agent-rules.md
│  │  │  ├─ audit-log-rules.md
│  │  │  ├─ backup-docs
│  │  │  │  └─ domain-rules.zip
│  │  │  ├─ cart-checkout-rules.md
│  │  │  ├─ complaint-rules.md
│  │  │  ├─ domain-rules.md
│  │  │  ├─ export-rules.md
│  │  │  ├─ generation-rules.md
│  │  │  ├─ human-takeover-rules.md
│  │  │  ├─ manifest.json
│  │  │  ├─ notification-rules.md
│  │  │  ├─ order-rules.md
│  │  │  ├─ outlet-access-rules.md
│  │  │  ├─ outlet-rules.md
│  │  │  ├─ payment-rules.md
│  │  │  ├─ permissions.md
│  │  │  ├─ product-catalog-rules.md
│  │  │  ├─ quota-rules.md
│  │  │  ├─ status-rules.md
│  │  │  ├─ storage-rules.md
│  │  │  ├─ telegram-commerce-rules.md
│  │  │  ├─ validations.md
│  │  │  ├─ webhook-rules.md
│  │  │  └─ workspace-tenant-rules.md
│  │  ├─ 04-tech-spec
│  │  │  ├─ README.md
│  │  │  ├─ ai-pipeline.md
│  │  │  ├─ architecture.md
│  │  │  ├─ backend-tech-spec-only-v2
│  │  │  │  └─ backend-tech-spec-only-v2.zip
│  │  │  ├─ background-jobs.md
│  │  │  ├─ coding-rules.md
│  │  │  ├─ database-access.md
│  │  │  ├─ decision-log.md
│  │  │  ├─ deployment.md
│  │  │  ├─ environment-config.md
│  │  │  ├─ folder-structure.md
│  │  │  ├─ observability.md
│  │  │  ├─ recommended-scalable-structure.md
│  │  │  ├─ rendering-export.md
│  │  │  ├─ runbook.md
│  │  │  ├─ storage-strategy.md
│  │  │  └─ tech-stack.md
│  │  ├─ 05-api-spec
│  │  │  ├─ README.md
│  │  │  ├─ agents-api.md
│  │  │  ├─ ai-actions-api.md
│  │  │  ├─ analytics-api.md
│  │  │  ├─ api-versioning.md
│  │  │  ├─ auth-api.md
│  │  │  ├─ backup-docs
│  │  │  │  └─ auth-api.zip
│  │  │  ├─ carts-api.md
│  │  │  ├─ chats-api.md
│  │  │  ├─ checkout-api.md
│  │  │  ├─ complaints-api.md
│  │  │  ├─ contacts-api.md
│  │  │  ├─ error-format.md
│  │  │  ├─ files-api.md
│  │  │  ├─ integrations-api.md
│  │  │  ├─ jobs-api.md
│  │  │  ├─ orders-api.md
│  │  │  ├─ outlet-access-api.md
│  │  │  ├─ outlets-api.md
│  │  │  ├─ overview.md
│  │  │  ├─ payments-api.md
│  │  │  ├─ platforms-api.md
│  │  │  ├─ products-api.md
│  │  │  ├─ rate-limits.md
│  │  │  ├─ settings-api.md
│  │  │  ├─ telegram-commerce-api.md
│  │  │  ├─ users-api.md
│  │  │  └─ webhooks-api.md
│  │  ├─ 06-data
│  │  │  ├─ ALL_DOCS_COMBINED.md
│  │  │  ├─ MANIFEST.json
│  │  │  ├─ README.md
│  │  │  ├─ ai-commerce-guardrails.md
│  │  │  ├─ backup-docs
│  │  │  │  ├─ telegram-marketplace-data-migrations-v2
│  │  │  │  ├─ telegram-marketplace-data-migrations-v2.zip
│  │  │  │  └─ updated-data-database-docs.zip
│  │  │  ├─ data-flow.md
│  │  │  ├─ database-schema.md
│  │  │  ├─ entities.md
│  │  │  ├─ erd.md
│  │  │  ├─ implementation-checklist.md
│  │  │  ├─ import-script-spec.md
│  │  │  ├─ indexes.md
│  │  │  ├─ marketplace-module.md
│  │  │  ├─ migration-plan.md
│  │  │  ├─ migrations
│  │  │  │  ├─ ALL_MIGRATIONS_COMBINED.md
│  │  │  │  ├─ README.md
│  │  │  │  ├─ checklists
│  │  │  │  │  ├─ marketplace-mvp-checklist.md
│  │  │  │  │  ├─ post-migration-checklist.md
│  │  │  │  │  └─ pre-migration-checklist.md
│  │  │  │  ├─ manifest.json
│  │  │  │  ├─ notes
│  │  │  │  │  ├─ cutover-plan.md
│  │  │  │  │  ├─ data-backfill-order.md
│  │  │  │  │  ├─ marketplace-schema-notes.md
│  │  │  │  │  ├─ mongo-to-postgres-mapping.md
│  │  │  │  │  ├─ payment-gateway-contract.md
│  │  │  │  │  ├─ repository-layer-contract.md
│  │  │  │  │  └─ telegram-commerce-flow.md
│  │  │  │  └─ sql
│  │  │  │     ├─ 001_extensions_and_enums.sql
│  │  │  │     ├─ 002_core_identity.sql
│  │  │  │     ├─ 003_platforms_agents.sql
│  │  │  │     ├─ 004_crm_chats_messages.sql
│  │  │  │     ├─ 005_orders_complaints_files.sql
│  │  │  │     ├─ 006_indexes.sql
│  │  │  │     ├─ 007_rls_policies.sql
│  │  │  │     ├─ 008_local_file_storage.sql
│  │  │  │     ├─ 009_migration_validation_queries.sql
│  │  │  │     └─ 009_multi_workspace_outlet_foundation.sql
│  │  │  ├─ payment-gateway.md
│  │  │  ├─ query-contracts.md
│  │  │  ├─ relationships.md
│  │  │  ├─ repository-layer-contract.md
│  │  │  ├─ rls-policies.md
│  │  │  ├─ seed-data.md
│  │  │  ├─ storage-model.md
│  │  │  └─ telegram-commerce-flow.md
│  │  ├─ 07-uiux
│  │  │  ├─ ALL_UIUX_DOCS_COMBINED.md
│  │  │  ├─ README.md
│  │  │  ├─ accessibility.md
│  │  │  ├─ admin-actions-matrix.md
│  │  │  ├─ backend-ui-contract.md
│  │  │  ├─ backup-docs
│  │  │  │  └─ backend-uiux-docs-v2.zip
│  │  │  ├─ btn-card-bdg-variants.md
│  │  │  ├─ btn-crd-bdg-variants.md
│  │  │  ├─ color-palette.md
│  │  │  ├─ components-backend-contract.md
│  │  │  ├─ components-list.md
│  │  │  ├─ darkmode-ui-component-style.md
│  │  │  ├─ data-table-actions.md
│  │  │  ├─ design-system.md
│  │  │  ├─ design.md
│  │  │  ├─ filters-search-sort.md
│  │  │  ├─ fontbrand-typography.md
│  │  │  ├─ forms-and-fields.md
│  │  │  ├─ inpt-txt-slct-tab-nav-variants.md
│  │  │  ├─ input-txt-slct-tab-nav-variants.md
│  │  │  ├─ manifest.json
│  │  │  ├─ mini-brand-guideline.md
│  │  │  ├─ mini-design-system.md
│  │  │  ├─ orders-page-multi-outlet.md
│  │  │  ├─ outlet-selector-pattern.md
│  │  │  ├─ outlet-ui-requirements.md
│  │  │  ├─ pages-backend-requirements.md
│  │  │  ├─ pages-list.md
│  │  │  ├─ payment-ui-requirements.md
│  │  │  ├─ responsive-admin-rules.md
│  │  │  ├─ telegram-bot-ux.md
│  │  │  ├─ ui-component-style.md
│  │  │  ├─ ui-states.md
│  │  │  ├─ visual-style.md
│  │  │  └─ workflow-buttons.md
│  │  ├─ 08-security
│  │  │  ├─ ALL_SECURITY_DOCS_COMBINED.md
│  │  │  ├─ README.md
│  │  │  ├─ admin-dashboard-security.md
│  │  │  ├─ ai-action-security.md
│  │  │  ├─ ai-prompt-security.md
│  │  │  ├─ api-security.md
│  │  │  ├─ asset-access-security.md
│  │  │  ├─ audit-logging-security.md
│  │  │  ├─ auth-authz.md
│  │  │  ├─ backup-docs
│  │  │  │  └─ backend-security-docs-v2.zip
│  │  │  ├─ backup-recovery-security.md
│  │  │  ├─ data-protection.md
│  │  │  ├─ dependency-supply-chain-security.md
│  │  │  ├─ file-storage-security.md
│  │  │  ├─ incident-response.md
│  │  │  ├─ manifest.json
│  │  │  ├─ meta-platform-security.md
│  │  │  ├─ outlet-access-security.md
│  │  │  ├─ payment-security.md
│  │  │  ├─ rate-limit-abuse.md
│  │  │  ├─ rls-security.md
│  │  │  ├─ secrets-env-policy.md
│  │  │  ├─ security-checklist.md
│  │  │  ├─ telegram-security.md
│  │  │  ├─ threat-model.md
│  │  │  ├─ vulnerability-management.md
│  │  │  ├─ webhook-security.md
│  │  │  └─ workspace-tenant-security.md
│  │  ├─ 09-ai-context
│  │  │  ├─ ALL_AI_CONTEXT_DOCS_COMBINED.md
│  │  │  ├─ README.md
│  │  │  ├─ agent-evaluation.md
│  │  │  ├─ agent-response-format.md
│  │  │  ├─ ai-action-contract.md
│  │  │  ├─ ai-pipeline-rules.md
│  │  │  ├─ backend-boundaries.md
│  │  │  ├─ backup-docs
│  │  │  │  └─ backend-ai-context-docs-v2.zip
│  │  │  ├─ coding-guidelines.md
│  │  │  ├─ commerce-agent-guardrails.md
│  │  │  ├─ context-packing.md
│  │  │  ├─ current-task.md
│  │  │  ├─ database-context.md
│  │  │  ├─ do-not-break.md
│  │  │  ├─ human-handoff-context.md
│  │  │  ├─ manifest.json
│  │  │  ├─ notification-context.md
│  │  │  ├─ outlet-context.md
│  │  │  ├─ payment-context.md
│  │  │  ├─ prompt-context.md
│  │  │  ├─ security-rules-for-ai.md
│  │  │  ├─ storage-context.md
│  │  │  ├─ telegram-bot-context.md
│  │  │  ├─ testing-expectations.md
│  │  │  └─ tool-calling-contract.md
│  │  ├─ 10-testing
│  │  │  ├─ ALL_TESTING_DOCS_COMBINED.md
│  │  │  ├─ README.md
│  │  │  ├─ acceptance-test-cases.md
│  │  │  ├─ ai-agent-evaluation.md
│  │  │  ├─ ai-output-qa-checklist.md
│  │  │  ├─ backup-docs
│  │  │  │  ├─ backend-testing-docs-v2
│  │  │  │  └─ testing.zip
│  │  │  ├─ ci-test-pipeline.md
│  │  │  ├─ e2e-test-plan.md
│  │  │  ├─ image-generation-qa-checklist.md
│  │  │  ├─ integration-test-plan.md
│  │  │  ├─ jobs-test-plan.md
│  │  │  ├─ local-storage-test-plan.md
│  │  │  ├─ manifest.json
│  │  │  ├─ manual-qa-cliproxy.md
│  │  │  ├─ migration-test-plan.md
│  │  │  ├─ observability-test-plan.md
│  │  │  ├─ outlet-test-plan.md
│  │  │  ├─ payment-test-plan.md
│  │  │  ├─ performance-test-plan.md
│  │  │  ├─ qa-process.md
│  │  │  ├─ regression-checklist.md
│  │  │  ├─ security-test-plan.md
│  │  │  ├─ smoke-test-checklist.md
│  │  │  ├─ tdd-rules.md
│  │  │  ├─ telegram-commerce-test-plan.md
│  │  │  ├─ test-data.md
│  │  │  ├─ test-strategy.md
│  │  │  ├─ unit-test-plan.md
│  │  │  └─ webhook-test-plan.md
│  │  ├─ 11-sprint
│  │  │  ├─ README.md
│  │  │  ├─ agent-response-format.md
│  │  │  ├─ backlog.md
│  │  │  ├─ backup-docs
│  │  │  │  └─ sprint.zip
│  │  │  ├─ current-sprint.md
│  │  │  ├─ definition-of-done.md
│  │  │  ├─ dependency-map.md
│  │  │  ├─ estimation-guide.md
│  │  │  ├─ implementation-status.md
│  │  │  ├─ milestones.md
│  │  │  ├─ multi-outlet-foundation-sprint.md
│  │  │  ├─ mvp-demo-script.md
│  │  │  ├─ progress-log.md
│  │  │  ├─ release-checklist.md
│  │  │  ├─ risk-log.md
│  │  │  ├─ sprint-0-stabilization.md
│  │  │  ├─ sprint-1-webhook-service-boundary.md
│  │  │  ├─ sprint-2-product-catalog.md
│  │  │  ├─ sprint-3-cart-telegram-commerce.md
│  │  │  ├─ sprint-4-checkout-payment.md
│  │  │  ├─ sprint-5-admin-ops.md
│  │  │  ├─ sprint-6-mvp-hardening.md
│  │  │  ├─ sprint-plan.md
│  │  │  └─ task-breakdown.md
│  │  ├─ 12-devops
│  │  │  ├─ ALL_OPS_DOCS_COMBINED.md
│  │  │  ├─ README.md
│  │  │  ├─ ai-ops.md
│  │  │  ├─ backup-docs
│  │  │  │  └─ backend-ops-docs-v2.zip
│  │  │  ├─ backup-restore-runbook.md
│  │  │  ├─ database-ops.md
│  │  │  ├─ deployment-runbook.md
│  │  │  ├─ disaster-recovery.md
│  │  │  ├─ environment-ops.md
│  │  │  ├─ health-checks.md
│  │  │  ├─ incident-response-runbook.md
│  │  │  ├─ job-ops.md
│  │  │  ├─ maintenance-window.md
│  │  │  ├─ manifest.json
│  │  │  ├─ migration-ops.md
│  │  │  ├─ monitoring-alerting.md
│  │  │  ├─ ops-checklists.md
│  │  │  ├─ ops-log.md
│  │  │  ├─ ops-overview.md
│  │  │  ├─ payment-ops.md
│  │  │  ├─ postmortem-template.md
│  │  │  ├─ production-readiness.md
│  │  │  ├─ release-runbook.md
│  │  │  ├─ rollback-runbook.md
│  │  │  ├─ security-ops.md
│  │  │  ├─ storage-ops.md
│  │  │  ├─ telegram-ops.md
│  │  │  ├─ troubleshooting.md
│  │  │  └─ webhook-ops.md
│  │  ├─ 12-ops
│  │  │  ├─ ALL_OPS_DOCS_COMBINED.md
│  │  │  ├─ README.md
│  │  │  ├─ ai-ops.md
│  │  │  ├─ backup-restore-runbook.md
│  │  │  ├─ database-ops.md
│  │  │  ├─ deployment-runbook.md
│  │  │  ├─ disaster-recovery.md
│  │  │  ├─ environment-ops.md
│  │  │  ├─ health-checks.md
│  │  │  ├─ incident-response-runbook.md
│  │  │  ├─ job-ops.md
│  │  │  ├─ maintenance-window.md
│  │  │  ├─ migration-ops.md
│  │  │  ├─ monitoring-alerting.md
│  │  │  ├─ ops-checklists.md
│  │  │  ├─ ops-log.md
│  │  │  ├─ ops-overview.md
│  │  │  ├─ payment-ops.md
│  │  │  ├─ postmortem-template.md
│  │  │  ├─ production-readiness.md
│  │  │  ├─ release-runbook.md
│  │  │  ├─ rollback-runbook.md
│  │  │  ├─ security-ops.md
│  │  │  ├─ storage-ops.md
│  │  │  ├─ telegram-ops.md
│  │  │  ├─ troubleshooting.md
│  │  │  └─ webhook-ops.md
│  │  ├─ ALL_MULTI_OUTLET_UPDATED_DOCS_COMBINED.md
│  │  ├─ CHANGED-FILES-MULTI-OUTLET-V3.md
│  │  ├─ READING-ORDER.md
│  │  ├─ README-MERGED-PACKAGE.md
│  │  ├─ REPLACE-SAFE-NOTES.md
│  │  ├─ brief
│  │  │  ├─ ALL_BRIEFS_COMBINED.md
│  │  │  ├─ README.md
│  │  │  ├─ Technical_Brief_v3.md
│  │  │  ├─ agent-handoff-brief.md
│  │  │  ├─ ai-agent-brief.md
│  │  │  ├─ backup-docs
│  │  │  │  └─ backend-brief-docs-v2.zip
│  │  │  ├─ current-priority-brief.md
│  │  │  ├─ current-system-brief.md
│  │  │  ├─ data-migration-brief.md
│  │  │  ├─ folder-map-brief.md
│  │  │  ├─ implementation-priority-brief.md
│  │  │  ├─ manifest.json
│  │  │  ├─ mvp-brief.md
│  │  │  ├─ payment-brief.md
│  │  │  ├─ project-brief.md
│  │  │  ├─ quick-prompt-for-ai-agent.md
│  │  │  ├─ security-brief.md
│  │  │  ├─ target-system-brief.md
│  │  │  ├─ task-brief-template.md
│  │  │  ├─ telegram-commerce-brief.md
│  │  │  └─ testing-brief.md
│  │  ├─ chatgpt-context
│  │  │  ├─ PROJECT_CONTEXT_REPORT.md
│  │  │  ├─ Untitled Document.txt
│  │  │  ├─ backend-docs-full-merged-multi-outlet-v3.zip
│  │  │  └─ backup-docs.zip
│  │  ├─ index.md
│  │  └─ manifest.json
│  └─ frontend
├─ foto masalah
│  ├─ contoh-landing.jsx
│  ├─ image.png
│  ├─ inbox ui.jpg
│  ├─ inbox.jsx
│  └─ ui image.jpg
├─ package.json
├─ scripts
│  └─ dev.js
├─ server
│  ├─ change_role.js
│  ├─ check_owners.js
│  ├─ fix_account.js
│  ├─ inspect_chat.js
│  ├─ inspect_users.js
│  ├─ package-lock.json
│  ├─ package.json
│  ├─ scripts
│  │  ├─ audit.js
│  │  ├─ check_platforms.js
│  │  ├─ cleanup.js
│  │  ├─ cleanup_platforms.js
│  │  ├─ create-user.js
│  │  ├─ debug-instagram-messages.mjs
│  │  ├─ debug-platforms.mjs
│  │  ├─ fixPlatformType.js
│  │  ├─ fixUser.js
│  │  ├─ seed.js
│  │  ├─ test.js
│  │  └─ test_webhook_route.js
│  ├─ simulate_webhook.js
│  ├─ src
│  │  ├─ index.js
│  │  ├─ middleware
│  │  │  └─ auth.js
│  │  ├─ models
│  │  │  ├─ Agent.js
│  │  │  ├─ Chat.js
│  │  │  ├─ Complaint.js
│  │  │  ├─ Contact.js
│  │  │  ├─ Knowledge.js
│  │  │  ├─ Message.js
│  │  │  ├─ OTP.js
│  │  │  ├─ Order.js
│  │  │  ├─ PasswordReset.js
│  │  │  ├─ Platform.js
│  │  │  ├─ Setting.js
│  │  │  └─ User.js
│  │  ├─ routes
│  │  │  ├─ agents.js
│  │  │  ├─ analytics.js
│  │  │  ├─ auth.js
│  │  │  ├─ billing.js
│  │  │  ├─ chats.js
│  │  │  ├─ complaints.js
│  │  │  ├─ contacts.js
│  │  │  ├─ integrations.js
│  │  │  ├─ orders.js
│  │  │  ├─ platforms.js
│  │  │  ├─ profile.js
│  │  │  ├─ settings.js
│  │  │  ├─ users.js
│  │  │  └─ webhooks
│  │  │     ├─ index.js
│  │  │     ├─ meta.js
│  │  │     ├─ metaTest.js
│  │  │     ├─ telegram.js
│  │  │     └─ telegram_buffer_helper.js
│  │  ├─ services
│  │  │  ├─ ai.js
│  │  │  ├─ aiClient.js
│  │  │  ├─ followups.js
│  │  │  ├─ mail.js
│  │  │  ├─ messageBuffer.js
│  │  │  └─ sender.js
│  │  └─ utils
│  │     ├─ downloader.js
│  │     ├─ fileMentions.js
│  │     └─ messageSplitter.js
│  └─ uploads
│     ├─ 1760322857296.pdf
│     ├─ 1760322871987.pdf
│     ├─ 1760324075471.pdf
│     ├─ 1760337060647.png
│     ├─ 1760343094763.png
│     ├─ 1760343101846.png
│     ├─ 1760946549814.png
│     ├─ 1761181713591.pdf
│     ├─ 1761181795053.pdf
│     ├─ 1761183958596.pdf
│     ├─ 1761184166977.pdf
│     ├─ 1761184224047.pdf
│     ├─ 1761185349154.pdf
│     ├─ 1761185566730-SURAT_DISPENSASI_SELVI.pdf
│     ├─ 1761186026727-SURAT_DISPENSASI_SELVI.pdf
│     ├─ 1761186102196-SURAT_DISPENSASI_SELVI.pdf
│     ├─ 1761186134344-SURAT_DISPENSASI_SELVI.pdf
│     ├─ 1761187398261-SURAT_DISPENSASI_SELVI.pdf
│     ├─ ChatGPT_Image_6_Agu_2025_15.01.54.png
│     ├─ SURAT_DISPENSASI_RAFIF.pdf
│     └─ SURAT_DISPENSASI_SELVI.pdf
├─ temp_meta.txt
└─ web
   ├─ .prettierrc
   ├─ eslint.config.js
   ├─ fix_sidebar.js
   ├─ index.html
   ├─ package-lock.json
   ├─ package.json
   ├─ src
   │  ├─ agents.css
   │  ├─ analytics.css
   │  ├─ api
   │  │  └─ index.js
   │  ├─ assets
   │  │  └─ Brand.png
   │  ├─ components
   │  │  ├─ AgentSales.jsx
   │  │  ├─ BrandIcon.jsx
   │  │  ├─ ChatPanel.jsx
   │  │  ├─ ContactPanel.jsx
   │  │  ├─ FileInput.jsx
   │  │  ├─ FilterPopup.jsx
   │  │  ├─ Navbar.jsx
   │  │  ├─ PlatformPickerModal.jsx
   │  │  ├─ QuickActions.jsx
   │  │  └─ Sidebar.jsx
   │  ├─ contacts.css
   │  ├─ demoState.js
   │  ├─ inbox-modern-backup.css
   │  ├─ inbox-modern-test.css
   │  ├─ inbox-modern.css
   │  ├─ main.jsx
   │  ├─ modal.css
   │  ├─ pages
   │  │  ├─ Complaints.jsx
   │  │  ├─ Dashboard.jsx
   │  │  ├─ ForgotPassword.jsx
   │  │  ├─ Landing.jsx
   │  │  ├─ Login.jsx
   │  │  ├─ Orders.jsx
   │  │  ├─ Platforms.jsx
   │  │  ├─ Register.jsx
   │  │  ├─ ResetPassword.jsx
   │  │  └─ Verify.jsx
   │  ├─ platforms.css
   │  └─ styles.css
   ├─ vite.config.js
   └─ widen_sidebar.js

```
```
selaluteh-chatbot-crm
├─ .agents
├─ .claude
│  └─ worktrees
├─ .codex
├─ CLOUDFLARE_TUNNEL_GUIDE.md
├─ Dockerfile.server
├─ Dockerfile.web
├─ README.md
├─ docker-compose-advanced.yml
├─ docker-compose-full.yml
├─ docker-compose-with-ngrok.yml
├─ docker-compose.yml
├─ docs
│  ├─ .obsidian
│  │  ├─ app.json
│  │  ├─ appearance.json
│  │  ├─ core-plugins.json
│  │  └─ workspace.json
│  ├─ backend
│  │  ├─ .obsidian
│  │  │  ├─ icons
│  │  │  └─ plugins
│  │  │     └─ obsidian-icon-folder
│  │  ├─ 00-overview
│  │  │  ├─ ALL_OVERVIEW_DOCS_COMBINED.md
│  │  │  ├─ README.md
│  │  │  ├─ assumptions-constraints.md
│  │  │  ├─ current-state.md
│  │  │  ├─ decision-summary.md
│  │  │  ├─ glossary.md
│  │  │  ├─ goals-kpi.md
│  │  │  ├─ mvp-principles.md
│  │  │  ├─ non-goals.md
│  │  │  ├─ overview-map.md
│  │  │  ├─ product-vision.md
│  │  │  ├─ project-summary.md
│  │  │  ├─ risks-overview.md
│  │  │  ├─ scope.md
│  │  │  ├─ stakeholders.md
│  │  │  ├─ success-metrics.md
│  │  │  └─ target-state.md
│  │  ├─ 00-research
│  │  │  ├─ 01.Pedagogy
│  │  │  └─ AI Interactive Learning Microsite Generator – Perplexity.md
│  │  ├─ 000-business
│  │  │  ├─ ALL_BUSINESS_DOCS_COMBINED.md
│  │  │  ├─ README.md
│  │  │  ├─ backup-docs
│  │  │  │  └─ backend-business-docs-v2.zip
│  │  │  ├─ brd.md
│  │  │  ├─ business-decision-log.md
│  │  │  ├─ business-metrics.md
│  │  │  ├─ business-model.md
│  │  │  ├─ business-risks.md
│  │  │  ├─ competitor-analysis.md
│  │  │  ├─ customer-segments.md
│  │  │  ├─ financial-assumptions.md
│  │  │  ├─ go-to-market.md
│  │  │  ├─ legal-business-notes.md
│  │  │  ├─ manifest.json
│  │  │  ├─ market-positioning.md
│  │  │  ├─ mvp-validation-plan.md
│  │  │  ├─ mvp-validation-scorecard.md
│  │  │  ├─ partnerships.md
│  │  │  ├─ pricing-strategy.md
│  │  │  ├─ revenue-model.md
│  │  │  ├─ roadmap-business.md
│  │  │  ├─ sales-discovery-questions.md
│  │  │  ├─ unit-economics.md
│  │  │  └─ value-proposition.md
│  │  ├─ 0000-business
│  │  │  ├─ ALL_BUSINESS_DOCS_COMBINED.md
│  │  │  ├─ README.md
│  │  │  ├─ brd.md
│  │  │  ├─ business-decision-log.md
│  │  │  ├─ business-metrics.md
│  │  │  ├─ business-model.md
│  │  │  ├─ business-risks.md
│  │  │  ├─ competitor-analysis.md
│  │  │  ├─ customer-segments.md
│  │  │  ├─ financial-assumptions.md
│  │  │  ├─ go-to-market.md
│  │  │  ├─ legal-business-notes.md
│  │  │  ├─ market-positioning.md
│  │  │  ├─ mvp-validation-plan.md
│  │  │  ├─ mvp-validation-scorecard.md
│  │  │  ├─ partnerships.md
│  │  │  ├─ pricing-strategy.md
│  │  │  ├─ revenue-model.md
│  │  │  ├─ roadmap-business.md
│  │  │  ├─ sales-discovery-questions.md
│  │  │  ├─ unit-economics.md
│  │  │  └─ value-proposition.md
│  │  ├─ 001-overview
│  │  │  ├─ ALL_OVERVIEW_DOCS_COMBINED.md
│  │  │  ├─ README.md
│  │  │  ├─ assumptions-constraints.md
│  │  │  ├─ backup-docs
│  │  │  │  └─ backend-overview-docs-v2.zip
│  │  │  ├─ current-state.md
│  │  │  ├─ decision-summary.md
│  │  │  ├─ glossary.md
│  │  │  ├─ goals-kpi.md
│  │  │  ├─ manifest.json
│  │  │  ├─ mvp-principles.md
│  │  │  ├─ non-goals.md
│  │  │  ├─ overview-map.md
│  │  │  ├─ product-vision.md
│  │  │  ├─ project-summary.md
│  │  │  ├─ risks-overview.md
│  │  │  ├─ scope.md
│  │  │  ├─ stakeholders.md
│  │  │  ├─ success-metrics.md
│  │  │  └─ target-state.md
│  │  ├─ 01-product
│  │  │  ├─ ALL_PRODUCT_DOCS_COMBINED.md
│  │  │  ├─ README.md
│  │  │  ├─ admin-experience.md
│  │  │  ├─ backup-docs
│  │  │  │  └─ brand-personality.zip
│  │  │  ├─ brand-personality.md
│  │  │  ├─ customer-journey.md
│  │  │  ├─ feature-list.md
│  │  │  ├─ logo-direction.md
│  │  │  ├─ logo-system.md
│  │  │  ├─ manifest.json
│  │  │  ├─ mvp-scope.md
│  │  │  ├─ out-of-scope.md
│  │  │  ├─ product-vision.md
│  │  │  ├─ release-plan.md
│  │  │  ├─ requirements.md
│  │  │  ├─ risks-and-assumptions.md
│  │  │  ├─ success-metrics.md
│  │  │  ├─ user-personas.md
│  │  │  └─ user-stories.md
│  │  ├─ 02-flows
│  │  │  ├─ README.md
│  │  │  ├─ admin-flow.md
│  │  │  ├─ auth-flow.md
│  │  │  ├─ backup-docs
│  │  │  │  └─ backend-flows-v2.zip
│  │  │  ├─ chatbot-ai-flow.md
│  │  │  ├─ checkout-flow.md
│  │  │  ├─ complaint-flow.md
│  │  │  ├─ edge-cases.md
│  │  │  ├─ human-takeover-flow.md
│  │  │  ├─ media-file-flow.md
│  │  │  ├─ order-fulfillment-flow.md
│  │  │  ├─ outlet-selection-flow.md
│  │  │  ├─ payment-flow.md
│  │  │  ├─ product-catalog-flow.md
│  │  │  ├─ telegram-commerce-flow.md
│  │  │  └─ webhook-message-flow.md
│  │  ├─ 03-business-rules
│  │  │  ├─ README.md
│  │  │  ├─ ai-agent-rules.md
│  │  │  ├─ audit-log-rules.md
│  │  │  ├─ backup-docs
│  │  │  │  └─ domain-rules.zip
│  │  │  ├─ cart-checkout-rules.md
│  │  │  ├─ complaint-rules.md
│  │  │  ├─ domain-rules.md
│  │  │  ├─ export-rules.md
│  │  │  ├─ generation-rules.md
│  │  │  ├─ human-takeover-rules.md
│  │  │  ├─ manifest.json
│  │  │  ├─ notification-rules.md
│  │  │  ├─ order-rules.md
│  │  │  ├─ outlet-access-rules.md
│  │  │  ├─ outlet-rules.md
│  │  │  ├─ payment-rules.md
│  │  │  ├─ permissions.md
│  │  │  ├─ product-catalog-rules.md
│  │  │  ├─ quota-rules.md
│  │  │  ├─ status-rules.md
│  │  │  ├─ storage-rules.md
│  │  │  ├─ telegram-commerce-rules.md
│  │  │  ├─ validations.md
│  │  │  ├─ webhook-rules.md
│  │  │  └─ workspace-tenant-rules.md
│  │  ├─ 04-tech-spec
│  │  │  ├─ README.md
│  │  │  ├─ ai-pipeline.md
│  │  │  ├─ architecture.md
│  │  │  ├─ backend-tech-spec-only-v2
│  │  │  │  └─ backend-tech-spec-only-v2.zip
│  │  │  ├─ background-jobs.md
│  │  │  ├─ coding-rules.md
│  │  │  ├─ database-access.md
│  │  │  ├─ decision-log.md
│  │  │  ├─ deployment.md
│  │  │  ├─ environment-config.md
│  │  │  ├─ folder-structure.md
│  │  │  ├─ observability.md
│  │  │  ├─ recommended-scalable-structure.md
│  │  │  ├─ rendering-export.md
│  │  │  ├─ runbook.md
│  │  │  ├─ storage-strategy.md
│  │  │  └─ tech-stack.md
│  │  ├─ 05-api-spec
│  │  │  ├─ README.md
│  │  │  ├─ agents-api.md
│  │  │  ├─ ai-actions-api.md
│  │  │  ├─ analytics-api.md
│  │  │  ├─ api-versioning.md
│  │  │  ├─ auth-api.md
│  │  │  ├─ backup-docs
│  │  │  │  └─ auth-api.zip
│  │  │  ├─ carts-api.md
│  │  │  ├─ chats-api.md
│  │  │  ├─ checkout-api.md
│  │  │  ├─ complaints-api.md
│  │  │  ├─ contacts-api.md
│  │  │  ├─ error-format.md
│  │  │  ├─ files-api.md
│  │  │  ├─ integrations-api.md
│  │  │  ├─ jobs-api.md
│  │  │  ├─ orders-api.md
│  │  │  ├─ outlet-access-api.md
│  │  │  ├─ outlets-api.md
│  │  │  ├─ overview.md
│  │  │  ├─ payments-api.md
│  │  │  ├─ platforms-api.md
│  │  │  ├─ products-api.md
│  │  │  ├─ rate-limits.md
│  │  │  ├─ settings-api.md
│  │  │  ├─ telegram-commerce-api.md
│  │  │  ├─ users-api.md
│  │  │  └─ webhooks-api.md
│  │  ├─ 06-data
│  │  │  ├─ ALL_DOCS_COMBINED.md
│  │  │  ├─ MANIFEST.json
│  │  │  ├─ README.md
│  │  │  ├─ ai-commerce-guardrails.md
│  │  │  ├─ backup-docs
│  │  │  │  ├─ telegram-marketplace-data-migrations-v2
│  │  │  │  ├─ telegram-marketplace-data-migrations-v2.zip
│  │  │  │  └─ updated-data-database-docs.zip
│  │  │  ├─ data-flow.md
│  │  │  ├─ database-schema.md
│  │  │  ├─ entities.md
│  │  │  ├─ erd.md
│  │  │  ├─ implementation-checklist.md
│  │  │  ├─ import-script-spec.md
│  │  │  ├─ indexes.md
│  │  │  ├─ marketplace-module.md
│  │  │  ├─ migration-plan.md
│  │  │  ├─ migrations
│  │  │  │  ├─ ALL_MIGRATIONS_COMBINED.md
│  │  │  │  ├─ README.md
│  │  │  │  ├─ checklists
│  │  │  │  │  ├─ marketplace-mvp-checklist.md
│  │  │  │  │  ├─ post-migration-checklist.md
│  │  │  │  │  └─ pre-migration-checklist.md
│  │  │  │  ├─ manifest.json
│  │  │  │  ├─ notes
│  │  │  │  │  ├─ cutover-plan.md
│  │  │  │  │  ├─ data-backfill-order.md
│  │  │  │  │  ├─ marketplace-schema-notes.md
│  │  │  │  │  ├─ mongo-to-postgres-mapping.md
│  │  │  │  │  ├─ payment-gateway-contract.md
│  │  │  │  │  ├─ repository-layer-contract.md
│  │  │  │  │  └─ telegram-commerce-flow.md
│  │  │  │  └─ sql
│  │  │  │     ├─ 001_extensions_and_enums.sql
│  │  │  │     ├─ 002_core_identity.sql
│  │  │  │     ├─ 003_platforms_agents.sql
│  │  │  │     ├─ 004_crm_chats_messages.sql
│  │  │  │     ├─ 005_orders_complaints_files.sql
│  │  │  │     ├─ 006_indexes.sql
│  │  │  │     ├─ 007_rls_policies.sql
│  │  │  │     ├─ 008_local_file_storage.sql
│  │  │  │     ├─ 009_migration_validation_queries.sql
│  │  │  │     └─ 009_multi_workspace_outlet_foundation.sql
│  │  │  ├─ payment-gateway.md
│  │  │  ├─ query-contracts.md
│  │  │  ├─ relationships.md
│  │  │  ├─ repository-layer-contract.md
│  │  │  ├─ rls-policies.md
│  │  │  ├─ seed-data.md
│  │  │  ├─ storage-model.md
│  │  │  └─ telegram-commerce-flow.md
│  │  ├─ 07-uiux
│  │  │  ├─ ALL_UIUX_DOCS_COMBINED.md
│  │  │  ├─ README.md
│  │  │  ├─ accessibility.md
│  │  │  ├─ admin-actions-matrix.md
│  │  │  ├─ backend-ui-contract.md
│  │  │  ├─ backup-docs
│  │  │  │  └─ backend-uiux-docs-v2.zip
│  │  │  ├─ btn-card-bdg-variants.md
│  │  │  ├─ btn-crd-bdg-variants.md
│  │  │  ├─ color-palette.md
│  │  │  ├─ components-backend-contract.md
│  │  │  ├─ components-list.md
│  │  │  ├─ darkmode-ui-component-style.md
│  │  │  ├─ data-table-actions.md
│  │  │  ├─ design-system.md
│  │  │  ├─ design.md
│  │  │  ├─ filters-search-sort.md
│  │  │  ├─ fontbrand-typography.md
│  │  │  ├─ forms-and-fields.md
│  │  │  ├─ inpt-txt-slct-tab-nav-variants.md
│  │  │  ├─ input-txt-slct-tab-nav-variants.md
│  │  │  ├─ manifest.json
│  │  │  ├─ mini-brand-guideline.md
│  │  │  ├─ mini-design-system.md
│  │  │  ├─ orders-page-multi-outlet.md
│  │  │  ├─ outlet-selector-pattern.md
│  │  │  ├─ outlet-ui-requirements.md
│  │  │  ├─ pages-backend-requirements.md
│  │  │  ├─ pages-list.md
│  │  │  ├─ payment-ui-requirements.md
│  │  │  ├─ responsive-admin-rules.md
│  │  │  ├─ telegram-bot-ux.md
│  │  │  ├─ ui-component-style.md
│  │  │  ├─ ui-states.md
│  │  │  ├─ visual-style.md
│  │  │  └─ workflow-buttons.md
│  │  ├─ 08-security
│  │  │  ├─ ALL_SECURITY_DOCS_COMBINED.md
│  │  │  ├─ README.md
│  │  │  ├─ admin-dashboard-security.md
│  │  │  ├─ ai-action-security.md
│  │  │  ├─ ai-prompt-security.md
│  │  │  ├─ api-security.md
│  │  │  ├─ asset-access-security.md
│  │  │  ├─ audit-logging-security.md
│  │  │  ├─ auth-authz.md
│  │  │  ├─ backup-docs
│  │  │  │  └─ backend-security-docs-v2.zip
│  │  │  ├─ backup-recovery-security.md
│  │  │  ├─ data-protection.md
│  │  │  ├─ dependency-supply-chain-security.md
│  │  │  ├─ file-storage-security.md
│  │  │  ├─ incident-response.md
│  │  │  ├─ manifest.json
│  │  │  ├─ meta-platform-security.md
│  │  │  ├─ outlet-access-security.md
│  │  │  ├─ payment-security.md
│  │  │  ├─ rate-limit-abuse.md
│  │  │  ├─ rls-security.md
│  │  │  ├─ secrets-env-policy.md
│  │  │  ├─ security-checklist.md
│  │  │  ├─ telegram-security.md
│  │  │  ├─ threat-model.md
│  │  │  ├─ vulnerability-management.md
│  │  │  ├─ webhook-security.md
│  │  │  └─ workspace-tenant-security.md
│  │  ├─ 09-ai-context
│  │  │  ├─ ALL_AI_CONTEXT_DOCS_COMBINED.md
│  │  │  ├─ README.md
│  │  │  ├─ agent-evaluation.md
│  │  │  ├─ agent-response-format.md
│  │  │  ├─ ai-action-contract.md
│  │  │  ├─ ai-pipeline-rules.md
│  │  │  ├─ backend-boundaries.md
│  │  │  ├─ backup-docs
│  │  │  │  └─ backend-ai-context-docs-v2.zip
│  │  │  ├─ coding-guidelines.md
│  │  │  ├─ commerce-agent-guardrails.md
│  │  │  ├─ context-packing.md
│  │  │  ├─ current-task.md
│  │  │  ├─ database-context.md
│  │  │  ├─ do-not-break.md
│  │  │  ├─ human-handoff-context.md
│  │  │  ├─ manifest.json
│  │  │  ├─ notification-context.md
│  │  │  ├─ outlet-context.md
│  │  │  ├─ payment-context.md
│  │  │  ├─ prompt-context.md
│  │  │  ├─ security-rules-for-ai.md
│  │  │  ├─ storage-context.md
│  │  │  ├─ telegram-bot-context.md
│  │  │  ├─ testing-expectations.md
│  │  │  └─ tool-calling-contract.md
│  │  ├─ 10-testing
│  │  │  ├─ ALL_TESTING_DOCS_COMBINED.md
│  │  │  ├─ README.md
│  │  │  ├─ acceptance-test-cases.md
│  │  │  ├─ ai-agent-evaluation.md
│  │  │  ├─ ai-output-qa-checklist.md
│  │  │  ├─ backup-docs
│  │  │  │  ├─ backend-testing-docs-v2
│  │  │  │  └─ testing.zip
│  │  │  ├─ ci-test-pipeline.md
│  │  │  ├─ e2e-test-plan.md
│  │  │  ├─ image-generation-qa-checklist.md
│  │  │  ├─ integration-test-plan.md
│  │  │  ├─ jobs-test-plan.md
│  │  │  ├─ local-storage-test-plan.md
│  │  │  ├─ manifest.json
│  │  │  ├─ manual-qa-cliproxy.md
│  │  │  ├─ migration-test-plan.md
│  │  │  ├─ observability-test-plan.md
│  │  │  ├─ outlet-test-plan.md
│  │  │  ├─ payment-test-plan.md
│  │  │  ├─ performance-test-plan.md
│  │  │  ├─ qa-process.md
│  │  │  ├─ regression-checklist.md
│  │  │  ├─ security-test-plan.md
│  │  │  ├─ smoke-test-checklist.md
│  │  │  ├─ tdd-rules.md
│  │  │  ├─ telegram-commerce-test-plan.md
│  │  │  ├─ test-data.md
│  │  │  ├─ test-strategy.md
│  │  │  ├─ unit-test-plan.md
│  │  │  └─ webhook-test-plan.md
│  │  ├─ 11-sprint
│  │  │  ├─ README.md
│  │  │  ├─ agent-response-format.md
│  │  │  ├─ backlog.md
│  │  │  ├─ backup-docs
│  │  │  │  └─ sprint.zip
│  │  │  ├─ current-sprint.md
│  │  │  ├─ definition-of-done.md
│  │  │  ├─ dependency-map.md
│  │  │  ├─ estimation-guide.md
│  │  │  ├─ implementation-status.md
│  │  │  ├─ milestones.md
│  │  │  ├─ multi-outlet-foundation-sprint.md
│  │  │  ├─ mvp-demo-script.md
│  │  │  ├─ progress-log.md
│  │  │  ├─ release-checklist.md
│  │  │  ├─ risk-log.md
│  │  │  ├─ sprint-0-stabilization.md
│  │  │  ├─ sprint-1-webhook-service-boundary.md
│  │  │  ├─ sprint-2-product-catalog.md
│  │  │  ├─ sprint-3-cart-telegram-commerce.md
│  │  │  ├─ sprint-4-checkout-payment.md
│  │  │  ├─ sprint-5-admin-ops.md
│  │  │  ├─ sprint-6-mvp-hardening.md
│  │  │  ├─ sprint-plan.md
│  │  │  └─ task-breakdown.md
│  │  ├─ 12-devops
│  │  │  ├─ ALL_OPS_DOCS_COMBINED.md
│  │  │  ├─ README.md
│  │  │  ├─ ai-ops.md
│  │  │  ├─ backup-docs
│  │  │  │  └─ backend-ops-docs-v2.zip
│  │  │  ├─ backup-restore-runbook.md
│  │  │  ├─ database-ops.md
│  │  │  ├─ deployment-runbook.md
│  │  │  ├─ disaster-recovery.md
│  │  │  ├─ environment-ops.md
│  │  │  ├─ health-checks.md
│  │  │  ├─ incident-response-runbook.md
│  │  │  ├─ job-ops.md
│  │  │  ├─ maintenance-window.md
│  │  │  ├─ manifest.json
│  │  │  ├─ migration-ops.md
│  │  │  ├─ monitoring-alerting.md
│  │  │  ├─ ops-checklists.md
│  │  │  ├─ ops-log.md
│  │  │  ├─ ops-overview.md
│  │  │  ├─ payment-ops.md
│  │  │  ├─ postmortem-template.md
│  │  │  ├─ production-readiness.md
│  │  │  ├─ release-runbook.md
│  │  │  ├─ rollback-runbook.md
│  │  │  ├─ security-ops.md
│  │  │  ├─ storage-ops.md
│  │  │  ├─ telegram-ops.md
│  │  │  ├─ troubleshooting.md
│  │  │  └─ webhook-ops.md
│  │  ├─ 12-ops
│  │  │  ├─ ALL_OPS_DOCS_COMBINED.md
│  │  │  ├─ README.md
│  │  │  ├─ ai-ops.md
│  │  │  ├─ backup-restore-runbook.md
│  │  │  ├─ database-ops.md
│  │  │  ├─ deployment-runbook.md
│  │  │  ├─ disaster-recovery.md
│  │  │  ├─ environment-ops.md
│  │  │  ├─ health-checks.md
│  │  │  ├─ incident-response-runbook.md
│  │  │  ├─ job-ops.md
│  │  │  ├─ maintenance-window.md
│  │  │  ├─ migration-ops.md
│  │  │  ├─ monitoring-alerting.md
│  │  │  ├─ ops-checklists.md
│  │  │  ├─ ops-log.md
│  │  │  ├─ ops-overview.md
│  │  │  ├─ payment-ops.md
│  │  │  ├─ postmortem-template.md
│  │  │  ├─ production-readiness.md
│  │  │  ├─ release-runbook.md
│  │  │  ├─ rollback-runbook.md
│  │  │  ├─ security-ops.md
│  │  │  ├─ storage-ops.md
│  │  │  ├─ telegram-ops.md
│  │  │  ├─ troubleshooting.md
│  │  │  └─ webhook-ops.md
│  │  ├─ ALL_MULTI_OUTLET_UPDATED_DOCS_COMBINED.md
│  │  ├─ CHANGED-FILES-MULTI-OUTLET-V3.md
│  │  ├─ READING-ORDER.md
│  │  ├─ README-MERGED-PACKAGE.md
│  │  ├─ REPLACE-SAFE-NOTES.md
│  │  ├─ brief
│  │  │  ├─ ALL_BRIEFS_COMBINED.md
│  │  │  ├─ README.md
│  │  │  ├─ Technical_Brief_v3.md
│  │  │  ├─ agent-handoff-brief.md
│  │  │  ├─ ai-agent-brief.md
│  │  │  ├─ backup-docs
│  │  │  │  └─ backend-brief-docs-v2.zip
│  │  │  ├─ current-priority-brief.md
│  │  │  ├─ current-system-brief.md
│  │  │  ├─ data-migration-brief.md
│  │  │  ├─ folder-map-brief.md
│  │  │  ├─ implementation-priority-brief.md
│  │  │  ├─ manifest.json
│  │  │  ├─ mvp-brief.md
│  │  │  ├─ payment-brief.md
│  │  │  ├─ project-brief.md
│  │  │  ├─ quick-prompt-for-ai-agent.md
│  │  │  ├─ security-brief.md
│  │  │  ├─ target-system-brief.md
│  │  │  ├─ task-brief-template.md
│  │  │  ├─ telegram-commerce-brief.md
│  │  │  └─ testing-brief.md
│  │  ├─ chatgpt-context
│  │  │  ├─ PROJECT_CONTEXT_REPORT.md
│  │  │  ├─ Untitled Document.txt
│  │  │  ├─ backend-docs-full-merged-multi-outlet-v3.zip
│  │  │  └─ backup-docs.zip
│  │  ├─ index.md
│  │  └─ manifest.json
│  └─ frontend
├─ foto masalah
│  ├─ contoh-landing.jsx
│  ├─ image.png
│  ├─ inbox ui.jpg
│  ├─ inbox.jsx
│  └─ ui image.jpg
├─ package.json
├─ scripts
│  └─ dev.js
├─ server
│  ├─ change_role.js
│  ├─ check_owners.js
│  ├─ fix_account.js
│  ├─ inspect_chat.js
│  ├─ inspect_users.js
│  ├─ package-lock.json
│  ├─ package.json
│  ├─ scripts
│  │  ├─ audit.js
│  │  ├─ check_platforms.js
│  │  ├─ cleanup.js
│  │  ├─ cleanup_platforms.js
│  │  ├─ create-user.js
│  │  ├─ debug-instagram-messages.mjs
│  │  ├─ debug-platforms.mjs
│  │  ├─ fixPlatformType.js
│  │  ├─ fixUser.js
│  │  ├─ seed.js
│  │  ├─ test.js
│  │  └─ test_webhook_route.js
│  ├─ simulate_webhook.js
│  ├─ src
│  │  ├─ index.js
│  │  ├─ middleware
│  │  │  └─ auth.js
│  │  ├─ models
│  │  │  ├─ Agent.js
│  │  │  ├─ Chat.js
│  │  │  ├─ Complaint.js
│  │  │  ├─ Contact.js
│  │  │  ├─ Knowledge.js
│  │  │  ├─ Message.js
│  │  │  ├─ OTP.js
│  │  │  ├─ Order.js
│  │  │  ├─ PasswordReset.js
│  │  │  ├─ Platform.js
│  │  │  ├─ Setting.js
│  │  │  └─ User.js
│  │  ├─ routes
│  │  │  ├─ agents.js
│  │  │  ├─ analytics.js
│  │  │  ├─ auth.js
│  │  │  ├─ billing.js
│  │  │  ├─ chats.js
│  │  │  ├─ complaints.js
│  │  │  ├─ contacts.js
│  │  │  ├─ integrations.js
│  │  │  ├─ orders.js
│  │  │  ├─ platforms.js
│  │  │  ├─ profile.js
│  │  │  ├─ settings.js
│  │  │  ├─ users.js
│  │  │  └─ webhooks
│  │  │     ├─ index.js
│  │  │     ├─ meta.js
│  │  │     ├─ metaTest.js
│  │  │     ├─ telegram.js
│  │  │     └─ telegram_buffer_helper.js
│  │  ├─ services
│  │  │  ├─ ai.js
│  │  │  ├─ aiClient.js
│  │  │  ├─ followups.js
│  │  │  ├─ mail.js
│  │  │  ├─ messageBuffer.js
│  │  │  └─ sender.js
│  │  └─ utils
│  │     ├─ downloader.js
│  │     ├─ fileMentions.js
│  │     └─ messageSplitter.js
│  └─ uploads
│     ├─ 1760322857296.pdf
│     ├─ 1760322871987.pdf
│     ├─ 1760324075471.pdf
│     ├─ 1760337060647.png
│     ├─ 1760343094763.png
│     ├─ 1760343101846.png
│     ├─ 1760946549814.png
│     ├─ 1761181713591.pdf
│     ├─ 1761181795053.pdf
│     ├─ 1761183958596.pdf
│     ├─ 1761184166977.pdf
│     ├─ 1761184224047.pdf
│     ├─ 1761185349154.pdf
│     ├─ 1761185566730-SURAT_DISPENSASI_SELVI.pdf
│     ├─ 1761186026727-SURAT_DISPENSASI_SELVI.pdf
│     ├─ 1761186102196-SURAT_DISPENSASI_SELVI.pdf
│     ├─ 1761186134344-SURAT_DISPENSASI_SELVI.pdf
│     ├─ 1761187398261-SURAT_DISPENSASI_SELVI.pdf
│     ├─ ChatGPT_Image_6_Agu_2025_15.01.54.png
│     ├─ SURAT_DISPENSASI_RAFIF.pdf
│     └─ SURAT_DISPENSASI_SELVI.pdf
├─ temp_meta.txt
└─ web
   ├─ .prettierrc
   ├─ eslint.config.js
   ├─ fix_sidebar.js
   ├─ index.html
   ├─ package-lock.json
   ├─ package.json
   ├─ src
   │  ├─ api
   │  │  └─ index.js
   │  ├─ app
   │  │  ├─ App.jsx
   │  │  ├─ config.js
   │  │  ├─ providers.jsx
   │  │  ├─ router.jsx
   │  │  └─ routes.jsx
   │  ├─ assets
   │  │  ├─ icons
   │  │  ├─ images
   │  │  └─ logos
   │  │     └─ Brand.png
   │  ├─ components
   │  │  ├─ AgentSales.jsx
   │  │  ├─ BrandIcon.jsx
   │  │  ├─ ChatPanel.jsx
   │  │  ├─ ContactPanel.jsx
   │  │  ├─ FileInput.jsx
   │  │  ├─ FilterPopup.jsx
   │  │  ├─ Navbar.jsx
   │  │  ├─ PlatformPickerModal.jsx
   │  │  ├─ QuickActions.jsx
   │  │  └─ Sidebar.jsx
   │  ├─ demoState.js
   │  ├─ layouts
   │  │  ├─ AppLayout.jsx
   │  │  ├─ AuthLayout.jsx
   │  │  ├─ DashboardLayout.jsx
   │  │  └─ components
   │  │     ├─ OutletSelector.jsx
   │  │     ├─ Sidebar.jsx
   │  │     ├─ Topbar.jsx
   │  │     ├─ UserMenu.jsx
   │  │     └─ WorkspaceSwitcher.jsx
   │  ├─ main.jsx
   │  ├─ mocks
   │  │  ├─ demoState.js
   │  │  ├─ orders.mock.js
   │  │  ├─ outlets.mock.js
   │  │  └─ products.mock.js
   │  ├─ modules
   │  │  ├─ agents
   │  │  │  ├─ api
   │  │  │  │  └─ agentsApi.js
   │  │  │  ├─ components
   │  │  │  │  ├─ AgentForm.jsx
   │  │  │  │  ├─ AgentKnowledgeFiles.jsx
   │  │  │  │  ├─ AgentPromptEditor.jsx
   │  │  │  │  ├─ AgentSales.jsx
   │  │  │  │  └─ AgentsTable.jsx
   │  │  │  ├─ hooks
   │  │  │  ├─ pages
   │  │  │  │  └─ AgentsPage.jsx
   │  │  │  ├─ styles
   │  │  │  │  └─ agents.css
   │  │  │  └─ utils
   │  │  ├─ analytics
   │  │  │  ├─ api
   │  │  │  ├─ components
   │  │  │  ├─ hooks
   │  │  │  ├─ pages
   │  │  │  │  └─ AnalyticsPage.jsx
   │  │  │  ├─ styles
   │  │  │  │  └─ analytics.css
   │  │  │  └─ utils
   │  │  ├─ auth
   │  │  │  ├─ api
   │  │  │  │  └─ authApi.js
   │  │  │  ├─ auth.store.js
   │  │  │  ├─ components
   │  │  │  ├─ hooks
   │  │  │  │  └─ useAuth.js
   │  │  │  ├─ pages
   │  │  │  │  ├─ ForgotPasswordPage.jsx
   │  │  │  │  ├─ LoginPage.jsx
   │  │  │  │  ├─ RegisterPage.jsx
   │  │  │  │  ├─ ResetPasswordPage.jsx
   │  │  │  │  └─ VerifyPage.jsx
   │  │  │  ├─ styles
   │  │  │  └─ utils
   │  │  ├─ billing
   │  │  │  ├─ api
   │  │  │  ├─ components
   │  │  │  ├─ hooks
   │  │  │  ├─ pages
   │  │  │  │  └─ BillingPage.jsx
   │  │  │  ├─ styles
   │  │  │  └─ utils
   │  │  ├─ chats
   │  │  │  ├─ api
   │  │  │  │  └─ chatsApi.js
   │  │  │  ├─ components
   │  │  │  │  ├─ ChatList.jsx
   │  │  │  │  ├─ ChatPanel.jsx
   │  │  │  │  ├─ MessageBubble.jsx
   │  │  │  │  ├─ MessageComposer.jsx
   │  │  │  │  ├─ QuickActions.jsx
   │  │  │  │  └─ TakeoverButton.jsx
   │  │  │  ├─ hooks
   │  │  │  │  ├─ useChatPolling.js
   │  │  │  │  ├─ useChats.js
   │  │  │  │  └─ useMessages.js
   │  │  │  ├─ pages
   │  │  │  │  └─ ChatCenterPage.jsx
   │  │  │  ├─ styles
   │  │  │  │  ├─ inbox-modern-backup.css
   │  │  │  │  ├─ inbox-modern-test.css
   │  │  │  │  └─ inbox-modern.css
   │  │  │  └─ utils
   │  │  ├─ complaints
   │  │  │  ├─ api
   │  │  │  │  └─ complaintsApi.js
   │  │  │  ├─ components
   │  │  │  │  ├─ ComplaintDetailDrawer.jsx
   │  │  │  │  └─ ComplaintsTable.jsx
   │  │  │  ├─ hooks
   │  │  │  ├─ pages
   │  │  │  │  └─ ComplaintsPage.jsx
   │  │  │  ├─ styles
   │  │  │  └─ utils
   │  │  ├─ contacts
   │  │  │  ├─ api
   │  │  │  │  └─ contactsApi.js
   │  │  │  ├─ components
   │  │  │  │  ├─ ContactDetailDrawer.jsx
   │  │  │  │  ├─ ContactPanel.jsx
   │  │  │  │  └─ ContactsTable.jsx
   │  │  │  ├─ hooks
   │  │  │  ├─ pages
   │  │  │  │  └─ ContactsPage.jsx
   │  │  │  ├─ styles
   │  │  │  │  └─ contacts.css
   │  │  │  └─ utils
   │  │  ├─ dashboard
   │  │  │  ├─ api
   │  │  │  │  └─ dashboardApi.js
   │  │  │  ├─ components
   │  │  │  ├─ hooks
   │  │  │  ├─ pages
   │  │  │  │  ├─ DashboardPage.jsx
   │  │  │  │  └─ LandingPage.jsx
   │  │  │  ├─ styles
   │  │  │  └─ utils
   │  │  ├─ human-agents
   │  │  │  ├─ api
   │  │  │  ├─ components
   │  │  │  ├─ hooks
   │  │  │  ├─ pages
   │  │  │  │  └─ HumanAgentsPage.jsx
   │  │  │  ├─ styles
   │  │  │  └─ utils
   │  │  ├─ orders
   │  │  │  ├─ api
   │  │  │  │  └─ ordersApi.js
   │  │  │  ├─ components
   │  │  │  │  ├─ OrderDetailDrawer.jsx
   │  │  │  │  ├─ OrderItemsList.jsx
   │  │  │  │  ├─ OrderQuickActions.jsx
   │  │  │  │  ├─ OrderStatusBadge.jsx
   │  │  │  │  ├─ OrderTimeline.jsx
   │  │  │  │  ├─ OrdersStatusTabs.jsx
   │  │  │  │  ├─ OrdersSummaryCards.jsx
   │  │  │  │  ├─ OrdersTable.jsx
   │  │  │  │  └─ OrdersToolbar.jsx
   │  │  │  ├─ hooks
   │  │  │  │  ├─ useOrderDetail.js
   │  │  │  │  ├─ useOrderFilters.js
   │  │  │  │  └─ useOrders.js
   │  │  │  ├─ orders.types.js
   │  │  │  ├─ pages
   │  │  │  │  └─ OrdersPage.jsx
   │  │  │  ├─ styles
   │  │  │  └─ utils
   │  │  │     └─ orderStatus.js
   │  │  ├─ outlets
   │  │  │  ├─ api
   │  │  │  ├─ components
   │  │  │  ├─ hooks
   │  │  │  ├─ pages
   │  │  │  │  └─ OutletsPage.jsx
   │  │  │  ├─ styles
   │  │  │  └─ utils
   │  │  ├─ payments
   │  │  │  ├─ api
   │  │  │  ├─ components
   │  │  │  ├─ hooks
   │  │  │  ├─ pages
   │  │  │  │  └─ PaymentsPage.jsx
   │  │  │  ├─ styles
   │  │  │  └─ utils
   │  │  ├─ platforms
   │  │  │  ├─ api
   │  │  │  │  └─ platformsApi.js
   │  │  │  ├─ components
   │  │  │  │  ├─ PlatformForm.jsx
   │  │  │  │  ├─ PlatformPickerModal.jsx
   │  │  │  │  ├─ PlatformsTable.jsx
   │  │  │  │  └─ WebhookStatusCard.jsx
   │  │  │  ├─ hooks
   │  │  │  ├─ pages
   │  │  │  │  └─ PlatformsPage.jsx
   │  │  │  ├─ styles
   │  │  │  │  └─ platforms.css
   │  │  │  └─ utils
   │  │  ├─ products
   │  │  │  ├─ api
   │  │  │  ├─ components
   │  │  │  ├─ hooks
   │  │  │  ├─ pages
   │  │  │  │  └─ ProductsPage.jsx
   │  │  │  ├─ styles
   │  │  │  └─ utils
   │  │  ├─ profile
   │  │  │  ├─ api
   │  │  │  ├─ components
   │  │  │  ├─ hooks
   │  │  │  ├─ pages
   │  │  │  │  └─ ProfilePage.jsx
   │  │  │  ├─ styles
   │  │  │  └─ utils
   │  │  ├─ reports
   │  │  │  ├─ api
   │  │  │  ├─ components
   │  │  │  ├─ hooks
   │  │  │  ├─ pages
   │  │  │  │  └─ ReportsPage.jsx
   │  │  │  ├─ styles
   │  │  │  └─ utils
   │  │  └─ settings
   │  │     ├─ api
   │  │     ├─ components
   │  │     ├─ hooks
   │  │     ├─ pages
   │  │     │  └─ SettingsPage.jsx
   │  │     ├─ styles
   │  │     └─ utils
   │  ├─ pages
   │  ├─ routes
   │  │  ├─ navigation.config.js
   │  │  ├─ privateRoutes.jsx
   │  │  ├─ publicRoutes.jsx
   │  │  └─ routeGuards.jsx
   │  ├─ shared
   │  │  ├─ api
   │  │  │  ├─ apiError.js
   │  │  │  ├─ endpoints.js
   │  │  │  ├─ httpClient.js
   │  │  │  └─ index.js
   │  │  ├─ components
   │  │  │  ├─ brand
   │  │  │  │  └─ BrandIcon.jsx
   │  │  │  ├─ data-display
   │  │  │  ├─ feedback
   │  │  │  └─ ui
   │  │  │     ├─ FileInput.jsx
   │  │  │     └─ FilterPopup.jsx
   │  │  ├─ constants
   │  │  ├─ hooks
   │  │  ├─ lib
   │  │  └─ styles
   │  │     ├─ globals.css
   │  │     └─ modal.css
   │  └─ stores
   │     ├─ authStore.js
   │     ├─ outletStore.js
   │     ├─ uiStore.js
   │     └─ workspaceStore.js
   ├─ vite.config.js
   └─ widen_sidebar.js

```
```
selaluteh-chatbot-crm
├─ .agents
├─ .claude
│  └─ worktrees
├─ .codex
├─ CLOUDFLARE_TUNNEL_GUIDE.md
├─ Dockerfile.server
├─ Dockerfile.web
├─ README.md
├─ docker-compose-advanced.yml
├─ docker-compose-full.yml
├─ docker-compose-with-ngrok.yml
├─ docker-compose.yml
├─ docs
│  ├─ .obsidian
│  │  ├─ app.json
│  │  ├─ appearance.json
│  │  ├─ core-plugins.json
│  │  └─ workspace.json
│  ├─ backend
│  │  ├─ .obsidian
│  │  │  ├─ icons
│  │  │  └─ plugins
│  │  │     └─ obsidian-icon-folder
│  │  ├─ 00-overview
│  │  │  ├─ ALL_OVERVIEW_DOCS_COMBINED.md
│  │  │  ├─ README.md
│  │  │  ├─ assumptions-constraints.md
│  │  │  ├─ current-state.md
│  │  │  ├─ decision-summary.md
│  │  │  ├─ glossary.md
│  │  │  ├─ goals-kpi.md
│  │  │  ├─ mvp-principles.md
│  │  │  ├─ non-goals.md
│  │  │  ├─ overview-map.md
│  │  │  ├─ product-vision.md
│  │  │  ├─ project-summary.md
│  │  │  ├─ risks-overview.md
│  │  │  ├─ scope.md
│  │  │  ├─ stakeholders.md
│  │  │  ├─ success-metrics.md
│  │  │  └─ target-state.md
│  │  ├─ 00-research
│  │  │  ├─ 01.Pedagogy
│  │  │  └─ AI Interactive Learning Microsite Generator – Perplexity.md
│  │  ├─ 000-business
│  │  │  ├─ ALL_BUSINESS_DOCS_COMBINED.md
│  │  │  ├─ README.md
│  │  │  ├─ backup-docs
│  │  │  │  └─ backend-business-docs-v2.zip
│  │  │  ├─ brd.md
│  │  │  ├─ business-decision-log.md
│  │  │  ├─ business-metrics.md
│  │  │  ├─ business-model.md
│  │  │  ├─ business-risks.md
│  │  │  ├─ competitor-analysis.md
│  │  │  ├─ customer-segments.md
│  │  │  ├─ financial-assumptions.md
│  │  │  ├─ go-to-market.md
│  │  │  ├─ legal-business-notes.md
│  │  │  ├─ manifest.json
│  │  │  ├─ market-positioning.md
│  │  │  ├─ mvp-validation-plan.md
│  │  │  ├─ mvp-validation-scorecard.md
│  │  │  ├─ partnerships.md
│  │  │  ├─ pricing-strategy.md
│  │  │  ├─ revenue-model.md
│  │  │  ├─ roadmap-business.md
│  │  │  ├─ sales-discovery-questions.md
│  │  │  ├─ unit-economics.md
│  │  │  └─ value-proposition.md
│  │  ├─ 0000-business
│  │  │  ├─ ALL_BUSINESS_DOCS_COMBINED.md
│  │  │  ├─ README.md
│  │  │  ├─ brd.md
│  │  │  ├─ business-decision-log.md
│  │  │  ├─ business-metrics.md
│  │  │  ├─ business-model.md
│  │  │  ├─ business-risks.md
│  │  │  ├─ competitor-analysis.md
│  │  │  ├─ customer-segments.md
│  │  │  ├─ financial-assumptions.md
│  │  │  ├─ go-to-market.md
│  │  │  ├─ legal-business-notes.md
│  │  │  ├─ market-positioning.md
│  │  │  ├─ mvp-validation-plan.md
│  │  │  ├─ mvp-validation-scorecard.md
│  │  │  ├─ partnerships.md
│  │  │  ├─ pricing-strategy.md
│  │  │  ├─ revenue-model.md
│  │  │  ├─ roadmap-business.md
│  │  │  ├─ sales-discovery-questions.md
│  │  │  ├─ unit-economics.md
│  │  │  └─ value-proposition.md
│  │  ├─ 001-overview
│  │  │  ├─ ALL_OVERVIEW_DOCS_COMBINED.md
│  │  │  ├─ README.md
│  │  │  ├─ assumptions-constraints.md
│  │  │  ├─ backup-docs
│  │  │  │  └─ backend-overview-docs-v2.zip
│  │  │  ├─ current-state.md
│  │  │  ├─ decision-summary.md
│  │  │  ├─ glossary.md
│  │  │  ├─ goals-kpi.md
│  │  │  ├─ manifest.json
│  │  │  ├─ mvp-principles.md
│  │  │  ├─ non-goals.md
│  │  │  ├─ overview-map.md
│  │  │  ├─ product-vision.md
│  │  │  ├─ project-summary.md
│  │  │  ├─ risks-overview.md
│  │  │  ├─ scope.md
│  │  │  ├─ stakeholders.md
│  │  │  ├─ success-metrics.md
│  │  │  └─ target-state.md
│  │  ├─ 01-product
│  │  │  ├─ ALL_PRODUCT_DOCS_COMBINED.md
│  │  │  ├─ README.md
│  │  │  ├─ admin-experience.md
│  │  │  ├─ backup-docs
│  │  │  │  └─ brand-personality.zip
│  │  │  ├─ brand-personality.md
│  │  │  ├─ customer-journey.md
│  │  │  ├─ feature-list.md
│  │  │  ├─ logo-direction.md
│  │  │  ├─ logo-system.md
│  │  │  ├─ manifest.json
│  │  │  ├─ mvp-scope.md
│  │  │  ├─ out-of-scope.md
│  │  │  ├─ product-vision.md
│  │  │  ├─ release-plan.md
│  │  │  ├─ requirements.md
│  │  │  ├─ risks-and-assumptions.md
│  │  │  ├─ success-metrics.md
│  │  │  ├─ user-personas.md
│  │  │  └─ user-stories.md
│  │  ├─ 02-flows
│  │  │  ├─ README.md
│  │  │  ├─ admin-flow.md
│  │  │  ├─ auth-flow.md
│  │  │  ├─ backup-docs
│  │  │  │  └─ backend-flows-v2.zip
│  │  │  ├─ chatbot-ai-flow.md
│  │  │  ├─ checkout-flow.md
│  │  │  ├─ complaint-flow.md
│  │  │  ├─ edge-cases.md
│  │  │  ├─ human-takeover-flow.md
│  │  │  ├─ media-file-flow.md
│  │  │  ├─ order-fulfillment-flow.md
│  │  │  ├─ outlet-selection-flow.md
│  │  │  ├─ payment-flow.md
│  │  │  ├─ product-catalog-flow.md
│  │  │  ├─ telegram-commerce-flow.md
│  │  │  └─ webhook-message-flow.md
│  │  ├─ 03-business-rules
│  │  │  ├─ README.md
│  │  │  ├─ ai-agent-rules.md
│  │  │  ├─ audit-log-rules.md
│  │  │  ├─ backup-docs
│  │  │  │  └─ domain-rules.zip
│  │  │  ├─ cart-checkout-rules.md
│  │  │  ├─ complaint-rules.md
│  │  │  ├─ domain-rules.md
│  │  │  ├─ export-rules.md
│  │  │  ├─ generation-rules.md
│  │  │  ├─ human-takeover-rules.md
│  │  │  ├─ manifest.json
│  │  │  ├─ notification-rules.md
│  │  │  ├─ order-rules.md
│  │  │  ├─ outlet-access-rules.md
│  │  │  ├─ outlet-rules.md
│  │  │  ├─ payment-rules.md
│  │  │  ├─ permissions.md
│  │  │  ├─ product-catalog-rules.md
│  │  │  ├─ quota-rules.md
│  │  │  ├─ status-rules.md
│  │  │  ├─ storage-rules.md
│  │  │  ├─ telegram-commerce-rules.md
│  │  │  ├─ validations.md
│  │  │  ├─ webhook-rules.md
│  │  │  └─ workspace-tenant-rules.md
│  │  ├─ 04-tech-spec
│  │  │  ├─ README.md
│  │  │  ├─ ai-pipeline.md
│  │  │  ├─ architecture.md
│  │  │  ├─ backend-tech-spec-only-v2
│  │  │  │  └─ backend-tech-spec-only-v2.zip
│  │  │  ├─ background-jobs.md
│  │  │  ├─ coding-rules.md
│  │  │  ├─ database-access.md
│  │  │  ├─ decision-log.md
│  │  │  ├─ deployment.md
│  │  │  ├─ environment-config.md
│  │  │  ├─ folder-structure.md
│  │  │  ├─ observability.md
│  │  │  ├─ recommended-scalable-structure.md
│  │  │  ├─ rendering-export.md
│  │  │  ├─ runbook.md
│  │  │  ├─ storage-strategy.md
│  │  │  └─ tech-stack.md
│  │  ├─ 05-api-spec
│  │  │  ├─ README.md
│  │  │  ├─ agents-api.md
│  │  │  ├─ ai-actions-api.md
│  │  │  ├─ analytics-api.md
│  │  │  ├─ api-versioning.md
│  │  │  ├─ auth-api.md
│  │  │  ├─ backup-docs
│  │  │  │  └─ auth-api.zip
│  │  │  ├─ carts-api.md
│  │  │  ├─ chats-api.md
│  │  │  ├─ checkout-api.md
│  │  │  ├─ complaints-api.md
│  │  │  ├─ contacts-api.md
│  │  │  ├─ error-format.md
│  │  │  ├─ files-api.md
│  │  │  ├─ integrations-api.md
│  │  │  ├─ jobs-api.md
│  │  │  ├─ orders-api.md
│  │  │  ├─ outlet-access-api.md
│  │  │  ├─ outlets-api.md
│  │  │  ├─ overview.md
│  │  │  ├─ payments-api.md
│  │  │  ├─ platforms-api.md
│  │  │  ├─ products-api.md
│  │  │  ├─ rate-limits.md
│  │  │  ├─ settings-api.md
│  │  │  ├─ telegram-commerce-api.md
│  │  │  ├─ users-api.md
│  │  │  └─ webhooks-api.md
│  │  ├─ 06-data
│  │  │  ├─ ALL_DOCS_COMBINED.md
│  │  │  ├─ MANIFEST.json
│  │  │  ├─ README.md
│  │  │  ├─ ai-commerce-guardrails.md
│  │  │  ├─ backup-docs
│  │  │  │  ├─ telegram-marketplace-data-migrations-v2
│  │  │  │  ├─ telegram-marketplace-data-migrations-v2.zip
│  │  │  │  └─ updated-data-database-docs.zip
│  │  │  ├─ data-flow.md
│  │  │  ├─ database-schema.md
│  │  │  ├─ entities.md
│  │  │  ├─ erd.md
│  │  │  ├─ implementation-checklist.md
│  │  │  ├─ import-script-spec.md
│  │  │  ├─ indexes.md
│  │  │  ├─ marketplace-module.md
│  │  │  ├─ migration-plan.md
│  │  │  ├─ migrations
│  │  │  │  ├─ ALL_MIGRATIONS_COMBINED.md
│  │  │  │  ├─ README.md
│  │  │  │  ├─ checklists
│  │  │  │  │  ├─ marketplace-mvp-checklist.md
│  │  │  │  │  ├─ post-migration-checklist.md
│  │  │  │  │  └─ pre-migration-checklist.md
│  │  │  │  ├─ manifest.json
│  │  │  │  ├─ notes
│  │  │  │  │  ├─ cutover-plan.md
│  │  │  │  │  ├─ data-backfill-order.md
│  │  │  │  │  ├─ marketplace-schema-notes.md
│  │  │  │  │  ├─ mongo-to-postgres-mapping.md
│  │  │  │  │  ├─ payment-gateway-contract.md
│  │  │  │  │  ├─ repository-layer-contract.md
│  │  │  │  │  └─ telegram-commerce-flow.md
│  │  │  │  └─ sql
│  │  │  │     ├─ 001_extensions_and_enums.sql
│  │  │  │     ├─ 002_core_identity.sql
│  │  │  │     ├─ 003_platforms_agents.sql
│  │  │  │     ├─ 004_crm_chats_messages.sql
│  │  │  │     ├─ 005_orders_complaints_files.sql
│  │  │  │     ├─ 006_indexes.sql
│  │  │  │     ├─ 007_rls_policies.sql
│  │  │  │     ├─ 008_local_file_storage.sql
│  │  │  │     ├─ 009_migration_validation_queries.sql
│  │  │  │     └─ 009_multi_workspace_outlet_foundation.sql
│  │  │  ├─ payment-gateway.md
│  │  │  ├─ query-contracts.md
│  │  │  ├─ relationships.md
│  │  │  ├─ repository-layer-contract.md
│  │  │  ├─ rls-policies.md
│  │  │  ├─ seed-data.md
│  │  │  ├─ storage-model.md
│  │  │  └─ telegram-commerce-flow.md
│  │  ├─ 07-uiux
│  │  │  ├─ ALL_UIUX_DOCS_COMBINED.md
│  │  │  ├─ README.md
│  │  │  ├─ accessibility.md
│  │  │  ├─ admin-actions-matrix.md
│  │  │  ├─ backend-ui-contract.md
│  │  │  ├─ backup-docs
│  │  │  │  └─ backend-uiux-docs-v2.zip
│  │  │  ├─ btn-card-bdg-variants.md
│  │  │  ├─ btn-crd-bdg-variants.md
│  │  │  ├─ color-palette.md
│  │  │  ├─ components-backend-contract.md
│  │  │  ├─ components-list.md
│  │  │  ├─ darkmode-ui-component-style.md
│  │  │  ├─ data-table-actions.md
│  │  │  ├─ design-system.md
│  │  │  ├─ design.md
│  │  │  ├─ filters-search-sort.md
│  │  │  ├─ fontbrand-typography.md
│  │  │  ├─ forms-and-fields.md
│  │  │  ├─ inpt-txt-slct-tab-nav-variants.md
│  │  │  ├─ input-txt-slct-tab-nav-variants.md
│  │  │  ├─ manifest.json
│  │  │  ├─ mini-brand-guideline.md
│  │  │  ├─ mini-design-system.md
│  │  │  ├─ orders-page-multi-outlet.md
│  │  │  ├─ outlet-selector-pattern.md
│  │  │  ├─ outlet-ui-requirements.md
│  │  │  ├─ pages-backend-requirements.md
│  │  │  ├─ pages-list.md
│  │  │  ├─ payment-ui-requirements.md
│  │  │  ├─ responsive-admin-rules.md
│  │  │  ├─ telegram-bot-ux.md
│  │  │  ├─ ui-component-style.md
│  │  │  ├─ ui-states.md
│  │  │  ├─ visual-style.md
│  │  │  └─ workflow-buttons.md
│  │  ├─ 08-security
│  │  │  ├─ ALL_SECURITY_DOCS_COMBINED.md
│  │  │  ├─ README.md
│  │  │  ├─ admin-dashboard-security.md
│  │  │  ├─ ai-action-security.md
│  │  │  ├─ ai-prompt-security.md
│  │  │  ├─ api-security.md
│  │  │  ├─ asset-access-security.md
│  │  │  ├─ audit-logging-security.md
│  │  │  ├─ auth-authz.md
│  │  │  ├─ backup-docs
│  │  │  │  └─ backend-security-docs-v2.zip
│  │  │  ├─ backup-recovery-security.md
│  │  │  ├─ data-protection.md
│  │  │  ├─ dependency-supply-chain-security.md
│  │  │  ├─ file-storage-security.md
│  │  │  ├─ incident-response.md
│  │  │  ├─ manifest.json
│  │  │  ├─ meta-platform-security.md
│  │  │  ├─ outlet-access-security.md
│  │  │  ├─ payment-security.md
│  │  │  ├─ rate-limit-abuse.md
│  │  │  ├─ rls-security.md
│  │  │  ├─ secrets-env-policy.md
│  │  │  ├─ security-checklist.md
│  │  │  ├─ telegram-security.md
│  │  │  ├─ threat-model.md
│  │  │  ├─ vulnerability-management.md
│  │  │  ├─ webhook-security.md
│  │  │  └─ workspace-tenant-security.md
│  │  ├─ 09-ai-context
│  │  │  ├─ ALL_AI_CONTEXT_DOCS_COMBINED.md
│  │  │  ├─ README.md
│  │  │  ├─ agent-evaluation.md
│  │  │  ├─ agent-response-format.md
│  │  │  ├─ ai-action-contract.md
│  │  │  ├─ ai-pipeline-rules.md
│  │  │  ├─ backend-boundaries.md
│  │  │  ├─ backup-docs
│  │  │  │  └─ backend-ai-context-docs-v2.zip
│  │  │  ├─ coding-guidelines.md
│  │  │  ├─ commerce-agent-guardrails.md
│  │  │  ├─ context-packing.md
│  │  │  ├─ current-task.md
│  │  │  ├─ database-context.md
│  │  │  ├─ do-not-break.md
│  │  │  ├─ human-handoff-context.md
│  │  │  ├─ manifest.json
│  │  │  ├─ notification-context.md
│  │  │  ├─ outlet-context.md
│  │  │  ├─ payment-context.md
│  │  │  ├─ prompt-context.md
│  │  │  ├─ security-rules-for-ai.md
│  │  │  ├─ storage-context.md
│  │  │  ├─ telegram-bot-context.md
│  │  │  ├─ testing-expectations.md
│  │  │  └─ tool-calling-contract.md
│  │  ├─ 10-testing
│  │  │  ├─ ALL_TESTING_DOCS_COMBINED.md
│  │  │  ├─ README.md
│  │  │  ├─ acceptance-test-cases.md
│  │  │  ├─ ai-agent-evaluation.md
│  │  │  ├─ ai-output-qa-checklist.md
│  │  │  ├─ backup-docs
│  │  │  │  ├─ backend-testing-docs-v2
│  │  │  │  └─ testing.zip
│  │  │  ├─ ci-test-pipeline.md
│  │  │  ├─ e2e-test-plan.md
│  │  │  ├─ image-generation-qa-checklist.md
│  │  │  ├─ integration-test-plan.md
│  │  │  ├─ jobs-test-plan.md
│  │  │  ├─ local-storage-test-plan.md
│  │  │  ├─ manifest.json
│  │  │  ├─ manual-qa-cliproxy.md
│  │  │  ├─ migration-test-plan.md
│  │  │  ├─ observability-test-plan.md
│  │  │  ├─ outlet-test-plan.md
│  │  │  ├─ payment-test-plan.md
│  │  │  ├─ performance-test-plan.md
│  │  │  ├─ qa-process.md
│  │  │  ├─ regression-checklist.md
│  │  │  ├─ security-test-plan.md
│  │  │  ├─ smoke-test-checklist.md
│  │  │  ├─ tdd-rules.md
│  │  │  ├─ telegram-commerce-test-plan.md
│  │  │  ├─ test-data.md
│  │  │  ├─ test-strategy.md
│  │  │  ├─ unit-test-plan.md
│  │  │  └─ webhook-test-plan.md
│  │  ├─ 11-sprint
│  │  │  ├─ README.md
│  │  │  ├─ agent-response-format.md
│  │  │  ├─ backlog.md
│  │  │  ├─ backup-docs
│  │  │  │  └─ sprint.zip
│  │  │  ├─ current-sprint.md
│  │  │  ├─ definition-of-done.md
│  │  │  ├─ dependency-map.md
│  │  │  ├─ estimation-guide.md
│  │  │  ├─ implementation-status.md
│  │  │  ├─ milestones.md
│  │  │  ├─ multi-outlet-foundation-sprint.md
│  │  │  ├─ mvp-demo-script.md
│  │  │  ├─ progress-log.md
│  │  │  ├─ release-checklist.md
│  │  │  ├─ risk-log.md
│  │  │  ├─ sprint-0-stabilization.md
│  │  │  ├─ sprint-1-webhook-service-boundary.md
│  │  │  ├─ sprint-2-product-catalog.md
│  │  │  ├─ sprint-3-cart-telegram-commerce.md
│  │  │  ├─ sprint-4-checkout-payment.md
│  │  │  ├─ sprint-5-admin-ops.md
│  │  │  ├─ sprint-6-mvp-hardening.md
│  │  │  ├─ sprint-plan.md
│  │  │  └─ task-breakdown.md
│  │  ├─ 12-devops
│  │  │  ├─ ALL_OPS_DOCS_COMBINED.md
│  │  │  ├─ README.md
│  │  │  ├─ ai-ops.md
│  │  │  ├─ backup-docs
│  │  │  │  └─ backend-ops-docs-v2.zip
│  │  │  ├─ backup-restore-runbook.md
│  │  │  ├─ database-ops.md
│  │  │  ├─ deployment-runbook.md
│  │  │  ├─ disaster-recovery.md
│  │  │  ├─ environment-ops.md
│  │  │  ├─ health-checks.md
│  │  │  ├─ incident-response-runbook.md
│  │  │  ├─ job-ops.md
│  │  │  ├─ maintenance-window.md
│  │  │  ├─ manifest.json
│  │  │  ├─ migration-ops.md
│  │  │  ├─ monitoring-alerting.md
│  │  │  ├─ ops-checklists.md
│  │  │  ├─ ops-log.md
│  │  │  ├─ ops-overview.md
│  │  │  ├─ payment-ops.md
│  │  │  ├─ postmortem-template.md
│  │  │  ├─ production-readiness.md
│  │  │  ├─ release-runbook.md
│  │  │  ├─ rollback-runbook.md
│  │  │  ├─ security-ops.md
│  │  │  ├─ storage-ops.md
│  │  │  ├─ telegram-ops.md
│  │  │  ├─ troubleshooting.md
│  │  │  └─ webhook-ops.md
│  │  ├─ 12-ops
│  │  │  ├─ ALL_OPS_DOCS_COMBINED.md
│  │  │  ├─ README.md
│  │  │  ├─ ai-ops.md
│  │  │  ├─ backup-restore-runbook.md
│  │  │  ├─ database-ops.md
│  │  │  ├─ deployment-runbook.md
│  │  │  ├─ disaster-recovery.md
│  │  │  ├─ environment-ops.md
│  │  │  ├─ health-checks.md
│  │  │  ├─ incident-response-runbook.md
│  │  │  ├─ job-ops.md
│  │  │  ├─ maintenance-window.md
│  │  │  ├─ migration-ops.md
│  │  │  ├─ monitoring-alerting.md
│  │  │  ├─ ops-checklists.md
│  │  │  ├─ ops-log.md
│  │  │  ├─ ops-overview.md
│  │  │  ├─ payment-ops.md
│  │  │  ├─ postmortem-template.md
│  │  │  ├─ production-readiness.md
│  │  │  ├─ release-runbook.md
│  │  │  ├─ rollback-runbook.md
│  │  │  ├─ security-ops.md
│  │  │  ├─ storage-ops.md
│  │  │  ├─ telegram-ops.md
│  │  │  ├─ troubleshooting.md
│  │  │  └─ webhook-ops.md
│  │  ├─ ALL_MULTI_OUTLET_UPDATED_DOCS_COMBINED.md
│  │  ├─ CHANGED-FILES-MULTI-OUTLET-V3.md
│  │  ├─ READING-ORDER.md
│  │  ├─ README-MERGED-PACKAGE.md
│  │  ├─ REPLACE-SAFE-NOTES.md
│  │  ├─ brief
│  │  │  ├─ ALL_BRIEFS_COMBINED.md
│  │  │  ├─ README.md
│  │  │  ├─ Technical_Brief_v3.md
│  │  │  ├─ agent-handoff-brief.md
│  │  │  ├─ ai-agent-brief.md
│  │  │  ├─ backup-docs
│  │  │  │  └─ backend-brief-docs-v2.zip
│  │  │  ├─ current-priority-brief.md
│  │  │  ├─ current-system-brief.md
│  │  │  ├─ data-migration-brief.md
│  │  │  ├─ folder-map-brief.md
│  │  │  ├─ implementation-priority-brief.md
│  │  │  ├─ manifest.json
│  │  │  ├─ mvp-brief.md
│  │  │  ├─ payment-brief.md
│  │  │  ├─ project-brief.md
│  │  │  ├─ quick-prompt-for-ai-agent.md
│  │  │  ├─ security-brief.md
│  │  │  ├─ target-system-brief.md
│  │  │  ├─ task-brief-template.md
│  │  │  ├─ telegram-commerce-brief.md
│  │  │  └─ testing-brief.md
│  │  ├─ chatgpt-context
│  │  │  ├─ PROJECT_CONTEXT_REPORT.md
│  │  │  ├─ Untitled Document.txt
│  │  │  ├─ backend-docs-full-merged-multi-outlet-v3.zip
│  │  │  └─ backup-docs.zip
│  │  ├─ index.md
│  │  └─ manifest.json
│  └─ frontend
├─ foto masalah
│  ├─ contoh-landing.jsx
│  ├─ image.png
│  ├─ inbox ui.jpg
│  ├─ inbox.jsx
│  └─ ui image.jpg
├─ package.json
├─ scripts
│  └─ dev.js
├─ server
│  ├─ change_role.js
│  ├─ check_owners.js
│  ├─ fix_account.js
│  ├─ inspect_chat.js
│  ├─ inspect_users.js
│  ├─ package-lock.json
│  ├─ package.json
│  ├─ scripts
│  │  ├─ audit.js
│  │  ├─ check_platforms.js
│  │  ├─ cleanup.js
│  │  ├─ cleanup_platforms.js
│  │  ├─ create-user.js
│  │  ├─ debug-instagram-messages.mjs
│  │  ├─ debug-platforms.mjs
│  │  ├─ fixPlatformType.js
│  │  ├─ fixUser.js
│  │  ├─ seed.js
│  │  ├─ test.js
│  │  └─ test_webhook_route.js
│  ├─ simulate_webhook.js
│  ├─ src
│  │  ├─ index.js
│  │  ├─ middleware
│  │  │  └─ auth.js
│  │  ├─ models
│  │  │  ├─ Agent.js
│  │  │  ├─ Chat.js
│  │  │  ├─ Complaint.js
│  │  │  ├─ Contact.js
│  │  │  ├─ Knowledge.js
│  │  │  ├─ Message.js
│  │  │  ├─ OTP.js
│  │  │  ├─ Order.js
│  │  │  ├─ PasswordReset.js
│  │  │  ├─ Platform.js
│  │  │  ├─ Setting.js
│  │  │  └─ User.js
│  │  ├─ routes
│  │  │  ├─ agents.js
│  │  │  ├─ analytics.js
│  │  │  ├─ auth.js
│  │  │  ├─ billing.js
│  │  │  ├─ chats.js
│  │  │  ├─ complaints.js
│  │  │  ├─ contacts.js
│  │  │  ├─ integrations.js
│  │  │  ├─ orders.js
│  │  │  ├─ platforms.js
│  │  │  ├─ profile.js
│  │  │  ├─ settings.js
│  │  │  ├─ users.js
│  │  │  └─ webhooks
│  │  │     ├─ index.js
│  │  │     ├─ meta.js
│  │  │     ├─ metaTest.js
│  │  │     ├─ telegram.js
│  │  │     └─ telegram_buffer_helper.js
│  │  ├─ services
│  │  │  ├─ ai.js
│  │  │  ├─ aiClient.js
│  │  │  ├─ followups.js
│  │  │  ├─ mail.js
│  │  │  ├─ messageBuffer.js
│  │  │  └─ sender.js
│  │  └─ utils
│  │     ├─ downloader.js
│  │     ├─ fileMentions.js
│  │     └─ messageSplitter.js
│  └─ uploads
│     ├─ 1760322857296.pdf
│     ├─ 1760322871987.pdf
│     ├─ 1760324075471.pdf
│     ├─ 1760337060647.png
│     ├─ 1760343094763.png
│     ├─ 1760343101846.png
│     ├─ 1760946549814.png
│     ├─ 1761181713591.pdf
│     ├─ 1761181795053.pdf
│     ├─ 1761183958596.pdf
│     ├─ 1761184166977.pdf
│     ├─ 1761184224047.pdf
│     ├─ 1761185349154.pdf
│     ├─ 1761185566730-SURAT_DISPENSASI_SELVI.pdf
│     ├─ 1761186026727-SURAT_DISPENSASI_SELVI.pdf
│     ├─ 1761186102196-SURAT_DISPENSASI_SELVI.pdf
│     ├─ 1761186134344-SURAT_DISPENSASI_SELVI.pdf
│     ├─ 1761187398261-SURAT_DISPENSASI_SELVI.pdf
│     ├─ ChatGPT_Image_6_Agu_2025_15.01.54.png
│     ├─ SURAT_DISPENSASI_RAFIF.pdf
│     └─ SURAT_DISPENSASI_SELVI.pdf
├─ temp_meta.txt
└─ web
   ├─ .prettierrc
   ├─ eslint.config.js
   ├─ fix_sidebar.js
   ├─ index.html
   ├─ package-lock.json
   ├─ package.json
   ├─ src
   │  ├─ api
   │  │  └─ index.js
   │  ├─ app
   │  │  ├─ App.jsx
   │  │  ├─ config.js
   │  │  ├─ providers.jsx
   │  │  ├─ router.jsx
   │  │  └─ routes.jsx
   │  ├─ assets
   │  │  ├─ icons
   │  │  ├─ images
   │  │  └─ logos
   │  │     └─ Brand.png
   │  ├─ components
   │  │  ├─ AgentSales.jsx
   │  │  ├─ BrandIcon.jsx
   │  │  ├─ ChatPanel.jsx
   │  │  ├─ ContactPanel.jsx
   │  │  ├─ FileInput.jsx
   │  │  ├─ FilterPopup.jsx
   │  │  ├─ Navbar.jsx
   │  │  ├─ PlatformPickerModal.jsx
   │  │  ├─ QuickActions.jsx
   │  │  └─ Sidebar.jsx
   │  ├─ demoState.js
   │  ├─ layouts
   │  │  ├─ AppLayout.jsx
   │  │  ├─ AuthLayout.jsx
   │  │  ├─ DashboardLayout.jsx
   │  │  └─ components
   │  │     ├─ OutletSelector.jsx
   │  │     ├─ Sidebar.jsx
   │  │     ├─ Topbar.jsx
   │  │     ├─ UserMenu.jsx
   │  │     └─ WorkspaceSwitcher.jsx
   │  ├─ main.jsx
   │  ├─ mocks
   │  │  ├─ demoState.js
   │  │  ├─ orders.mock.js
   │  │  ├─ outlets.mock.js
   │  │  └─ products.mock.js
   │  ├─ modules
   │  │  ├─ agents
   │  │  │  ├─ api
   │  │  │  │  └─ agentsApi.js
   │  │  │  ├─ components
   │  │  │  │  ├─ AgentForm.jsx
   │  │  │  │  ├─ AgentKnowledgeFiles.jsx
   │  │  │  │  ├─ AgentPromptEditor.jsx
   │  │  │  │  ├─ AgentSales.jsx
   │  │  │  │  └─ AgentsTable.jsx
   │  │  │  ├─ hooks
   │  │  │  ├─ pages
   │  │  │  │  └─ AgentsPage.jsx
   │  │  │  ├─ styles
   │  │  │  │  └─ agents.css
   │  │  │  └─ utils
   │  │  ├─ analytics
   │  │  │  ├─ api
   │  │  │  ├─ components
   │  │  │  ├─ hooks
   │  │  │  ├─ pages
   │  │  │  │  └─ AnalyticsPage.jsx
   │  │  │  ├─ styles
   │  │  │  │  └─ analytics.css
   │  │  │  └─ utils
   │  │  ├─ auth
   │  │  │  ├─ api
   │  │  │  │  └─ authApi.js
   │  │  │  ├─ auth.store.js
   │  │  │  ├─ components
   │  │  │  ├─ hooks
   │  │  │  │  └─ useAuth.js
   │  │  │  ├─ pages
   │  │  │  │  ├─ ForgotPasswordPage.jsx
   │  │  │  │  ├─ LoginPage.jsx
   │  │  │  │  ├─ RegisterPage.jsx
   │  │  │  │  ├─ ResetPasswordPage.jsx
   │  │  │  │  └─ VerifyPage.jsx
   │  │  │  ├─ styles
   │  │  │  └─ utils
   │  │  ├─ billing
   │  │  │  ├─ api
   │  │  │  ├─ components
   │  │  │  ├─ hooks
   │  │  │  ├─ pages
   │  │  │  │  └─ BillingPage.jsx
   │  │  │  ├─ styles
   │  │  │  └─ utils
   │  │  ├─ chats
   │  │  │  ├─ api
   │  │  │  │  └─ chatsApi.js
   │  │  │  ├─ components
   │  │  │  │  ├─ ChatList.jsx
   │  │  │  │  ├─ ChatPanel.jsx
   │  │  │  │  ├─ MessageBubble.jsx
   │  │  │  │  ├─ MessageComposer.jsx
   │  │  │  │  ├─ QuickActions.jsx
   │  │  │  │  └─ TakeoverButton.jsx
   │  │  │  ├─ hooks
   │  │  │  │  ├─ useChatPolling.js
   │  │  │  │  ├─ useChats.js
   │  │  │  │  └─ useMessages.js
   │  │  │  ├─ pages
   │  │  │  │  └─ ChatCenterPage.jsx
   │  │  │  ├─ styles
   │  │  │  │  ├─ inbox-modern-backup.css
   │  │  │  │  ├─ inbox-modern-test.css
   │  │  │  │  └─ inbox-modern.css
   │  │  │  └─ utils
   │  │  ├─ complaints
   │  │  │  ├─ api
   │  │  │  │  └─ complaintsApi.js
   │  │  │  ├─ components
   │  │  │  │  ├─ ComplaintDetailDrawer.jsx
   │  │  │  │  └─ ComplaintsTable.jsx
   │  │  │  ├─ hooks
   │  │  │  ├─ pages
   │  │  │  │  └─ ComplaintsPage.jsx
   │  │  │  ├─ styles
   │  │  │  └─ utils
   │  │  ├─ contacts
   │  │  │  ├─ api
   │  │  │  │  └─ contactsApi.js
   │  │  │  ├─ components
   │  │  │  │  ├─ ContactDetailDrawer.jsx
   │  │  │  │  ├─ ContactPanel.jsx
   │  │  │  │  └─ ContactsTable.jsx
   │  │  │  ├─ hooks
   │  │  │  ├─ pages
   │  │  │  │  └─ ContactsPage.jsx
   │  │  │  ├─ styles
   │  │  │  │  └─ contacts.css
   │  │  │  └─ utils
   │  │  ├─ dashboard
   │  │  │  ├─ api
   │  │  │  │  └─ dashboardApi.js
   │  │  │  ├─ components
   │  │  │  ├─ hooks
   │  │  │  ├─ pages
   │  │  │  │  ├─ DashboardPage.jsx
   │  │  │  │  └─ LandingPage.jsx
   │  │  │  ├─ styles
   │  │  │  └─ utils
   │  │  ├─ human-agents
   │  │  │  ├─ api
   │  │  │  ├─ components
   │  │  │  ├─ hooks
   │  │  │  ├─ pages
   │  │  │  │  └─ HumanAgentsPage.jsx
   │  │  │  ├─ styles
   │  │  │  └─ utils
   │  │  ├─ orders
   │  │  │  ├─ api
   │  │  │  │  └─ ordersApi.js
   │  │  │  ├─ components
   │  │  │  │  ├─ OrderDetailDrawer.jsx
   │  │  │  │  ├─ OrderItemsList.jsx
   │  │  │  │  ├─ OrderQuickActions.jsx
   │  │  │  │  ├─ OrderStatusBadge.jsx
   │  │  │  │  ├─ OrderTimeline.jsx
   │  │  │  │  ├─ OrdersStatusTabs.jsx
   │  │  │  │  ├─ OrdersSummaryCards.jsx
   │  │  │  │  ├─ OrdersTable.jsx
   │  │  │  │  └─ OrdersToolbar.jsx
   │  │  │  ├─ hooks
   │  │  │  │  ├─ useOrderDetail.js
   │  │  │  │  ├─ useOrderFilters.js
   │  │  │  │  └─ useOrders.js
   │  │  │  ├─ orders.types.js
   │  │  │  ├─ pages
   │  │  │  │  └─ OrdersPage.jsx
   │  │  │  ├─ styles
   │  │  │  └─ utils
   │  │  │     └─ orderStatus.js
   │  │  ├─ outlets
   │  │  │  ├─ api
   │  │  │  ├─ components
   │  │  │  ├─ hooks
   │  │  │  ├─ pages
   │  │  │  │  └─ OutletsPage.jsx
   │  │  │  ├─ styles
   │  │  │  └─ utils
   │  │  ├─ payments
   │  │  │  ├─ api
   │  │  │  ├─ components
   │  │  │  ├─ hooks
   │  │  │  ├─ pages
   │  │  │  │  └─ PaymentsPage.jsx
   │  │  │  ├─ styles
   │  │  │  └─ utils
   │  │  ├─ platforms
   │  │  │  ├─ api
   │  │  │  │  └─ platformsApi.js
   │  │  │  ├─ components
   │  │  │  │  ├─ PlatformForm.jsx
   │  │  │  │  ├─ PlatformPickerModal.jsx
   │  │  │  │  ├─ PlatformsTable.jsx
   │  │  │  │  └─ WebhookStatusCard.jsx
   │  │  │  ├─ hooks
   │  │  │  ├─ pages
   │  │  │  │  └─ PlatformsPage.jsx
   │  │  │  ├─ styles
   │  │  │  │  └─ platforms.css
   │  │  │  └─ utils
   │  │  ├─ products
   │  │  │  ├─ api
   │  │  │  ├─ components
   │  │  │  ├─ hooks
   │  │  │  ├─ pages
   │  │  │  │  └─ ProductsPage.jsx
   │  │  │  ├─ styles
   │  │  │  └─ utils
   │  │  ├─ profile
   │  │  │  ├─ api
   │  │  │  ├─ components
   │  │  │  ├─ hooks
   │  │  │  ├─ pages
   │  │  │  │  └─ ProfilePage.jsx
   │  │  │  ├─ styles
   │  │  │  └─ utils
   │  │  ├─ reports
   │  │  │  ├─ api
   │  │  │  ├─ components
   │  │  │  ├─ hooks
   │  │  │  ├─ pages
   │  │  │  │  └─ ReportsPage.jsx
   │  │  │  ├─ styles
   │  │  │  └─ utils
   │  │  └─ settings
   │  │     ├─ api
   │  │     ├─ components
   │  │     ├─ hooks
   │  │     ├─ pages
   │  │     │  └─ SettingsPage.jsx
   │  │     ├─ styles
   │  │     └─ utils
   │  ├─ pages
   │  ├─ routes
   │  │  ├─ navigation.config.js
   │  │  ├─ privateRoutes.jsx
   │  │  ├─ publicRoutes.jsx
   │  │  └─ routeGuards.jsx
   │  ├─ shared
   │  │  ├─ api
   │  │  │  ├─ apiError.js
   │  │  │  ├─ endpoints.js
   │  │  │  ├─ httpClient.js
   │  │  │  └─ index.js
   │  │  ├─ components
   │  │  │  ├─ brand
   │  │  │  │  └─ BrandIcon.jsx
   │  │  │  ├─ data-display
   │  │  │  ├─ feedback
   │  │  │  └─ ui
   │  │  │     ├─ FileInput.jsx
   │  │  │     └─ FilterPopup.jsx
   │  │  ├─ constants
   │  │  ├─ hooks
   │  │  ├─ lib
   │  │  └─ styles
   │  │     ├─ globals.css
   │  │     └─ modal.css
   │  └─ stores
   │     ├─ authStore.js
   │     ├─ outletStore.js
   │     ├─ uiStore.js
   │     └─ workspaceStore.js
   ├─ vite.config.js
   └─ widen_sidebar.js

```