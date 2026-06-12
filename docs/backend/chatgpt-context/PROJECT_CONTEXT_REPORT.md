# Project Context Report

## 1. Executive Summary

Project ini adalah aplikasi **Chatbot CRM** bernama package root `eskala-bot`, dengan brand UI yang banyak memakai nama **KALIS.AI**. Stack utamanya adalah **React/Vite frontend**, **Express backend**, **MongoDB/Mongoose**, integrasi **Telegram/WhatsApp/Instagram webhook**, dan AI provider **OpenAI/Gemini**.

Project ini sudah cukup kuat sebagai fondasi chatbot CRM: ada auth, dashboard, inbox, connected platforms, AI agents, human takeover, contact management, orders, complaints, analytics, file upload lokal, dan webhook Telegram. Integrasi Telegram ditemukan terutama di `server/src/routes/webhooks/telegram.js`, dengan sender helper di `server/src/services/sender.js` dan endpoint setWebhook di `server/src/routes/integrations.js`.

Bot Telegram saat ini berjalan dengan **webhook**, bukan long polling. Bot sudah bisa menerima teks, foto, dokumen, voice/audio, `/start`, menyimpan contact/chat/message ke database, memanggil AI, mengirim reply, mengirim dokumen/foto/video, dan menghentikan AI saat human takeover aktif.

Namun, project **belum siap penuh menjadi Telegram-first Marketplace MVP**. Sudah ada elemen commerce berupa `Order` model, `Orders` dashboard, `Agent.salesForms`, produk di sales form, payment instruction manual, QRIS image, dan AI marker `FILE_ORDER_JSON`. Tetapi belum ada product catalog standalone, cart, checkout state yang deterministic, payment gateway sandbox seperti Midtrans/Xendit, payment webhook, inventory, order items normalized, atau Telegram inline button commerce flow.

Rekomendasi: lanjutkan project ini, jangan rebuild dari nol. Prioritas berikutnya adalah refactor kecil untuk security/data consistency, lalu tambah modul marketplace secara bertahap: product catalog, cart, deterministic order flow, Midtrans/Xendit sandbox, payment webhook, dan Telegram inline keyboard.

## 2. Current Project Purpose

Berdasarkan `README.md`, project ini adalah starter **Chatbot CRM seperti Cekat.ai** dengan:

- React/Vite frontend.
- Express backend.
- MongoDB/Mongoose.
- OTP email verification.
- Human Agent role.
- AI Agents.
- Connected Platforms.
- Inbox/Chats.
- Webhook via Cloudflare Tunnel.

Project target baru dari prompt adalah:

```txt
Telegram-first Marketplace MVP dengan chatbot, product catalog, order flow, dan payment gateway sandbox.
```

Kesimpulan: project sekarang adalah CRM chatbot yang bisa dijadikan fondasi marketplace, tetapi belum punya marketplace primitives yang lengkap.

## 3. Tech Stack

| Area | Technology | Evidence/File | Notes |
|---|---|---|---|
| Frontend | React 18 + Vite | `web/package.json`, `web/src/main.jsx` | UI dashboard dan auth pages |
| Routing frontend | React Router DOM | `web/package.json`, `web/src/main.jsx` | Routes `/`, `/login`, `/app/*` |
| Backend | Express 4 | `server/package.json`, `server/src/index.js` | REST API + webhook server |
| Database | MongoDB | `server/src/index.js`, `server/src/models/*.js` | Uses Mongoose models |
| ORM/ODM | Mongoose 8 | `server/package.json`, `server/src/models` | Current persistence layer |
| Auth | Custom JWT + bcrypt | `server/src/routes/auth.js`, `server/src/middleware/auth.js` | OTP verification before login |
| Email | Nodemailer | `server/src/services/mail.js` | SMTP optional; logs OTP in dev |
| AI Provider | OpenAI, Google Gemini | `server/src/services/aiClient.js`, `server/src/services/ai.js` | OpenAI preferred, Gemini fallback/vision/audio |
| Telegram Bot | Direct Telegram Bot API via fetch | `server/src/routes/webhooks/telegram.js`, `server/src/services/sender.js` | No Telegraf/grammy library found |
| WhatsApp/Instagram | Meta Graph API via fetch | `server/src/routes/webhooks/meta.js`, `server/src/services/sender.js` | Webhook + sender |
| File Upload | Multer + local filesystem | `server/src/routes/agents.js`, `server/src/index.js` | `/files` serves `uploads` |
| Charts | Chart.js + react-chartjs-2 | `web/package.json`, `web/src/pages/Dashboard.jsx` | Analytics dashboard |
| Excel | xlsx | `web/package.json` | Used by dashboard contacts/export related code |
| Scheduler | node-cron | `server/package.json`, `server/src/services/followups.js` | Follow-up job every minute |
| Payment Gateway | Not found | Search for Midtrans/Xendit/Stripe returned none | Only manual payment instructions/QRIS image exist |
| Queue/Worker | Not found | `node-cron` only | No BullMQ/Redis/SQS |
| Deployment | Docker + docker-compose | `Dockerfile.server`, `Dockerfile.web`, `docker-compose*.yml` | Mongo, server, web, ngrok variants |

## 4. Repository Structure

```txt
selaluteh-chatbot-crm/
  package.json
  README.md
  Dockerfile.server
  Dockerfile.web
  docker-compose.yml
  docker-compose-full.yml
  docker-compose-advanced.yml
  docker-compose-with-ngrok.yml
  scripts/
    dev.js
  server/
    package.json
    src/
      index.js
      middleware/
        auth.js
      models/
        Agent.js
        Chat.js
        Complaint.js
        Contact.js
        Knowledge.js
        Message.js
        OTP.js
        Order.js
        PasswordReset.js
        Platform.js
        Setting.js
        User.js
      routes/
        auth.js
        users.js
        platforms.js
        agents.js
        chats.js
        analytics.js
        billing.js
        profile.js
        contacts.js
        integrations.js
        complaints.js
        orders.js
        settings.js
        webhooks/
          index.js
          telegram.js
          meta.js
          metaTest.js
          telegram_buffer_helper.js
      services/
        ai.js
        aiClient.js
        followups.js
        mail.js
        messageBuffer.js
        sender.js
      utils/
        downloader.js
        fileMentions.js
        messageSplitter.js
    scripts/
      seed.js
      cleanup.js
      create-user.js
      debug-platforms.mjs
      debug-instagram-messages.mjs
  web/
    package.json
    vite.config.js
    index.html
    src/
      main.jsx
      api/index.js
      pages/
      components/
      *.css
  docs/
    backend/
    chatgpt-context/
```

### Folder Explanation

| Path | Purpose | Notes |
|---|---|---|
| `server/src/index.js` | Express bootstrap | Connects Mongo, mounts routes, serves `/files` |
| `server/src/models` | Mongoose models | Current database schema |
| `server/src/routes` | API route modules | Auth, chats, agents, platforms, orders, complaints |
| `server/src/routes/webhooks` | Platform webhooks | Telegram and Meta |
| `server/src/services/ai.js` | AI orchestration | Reply generation plus order/complaint/escalation side effects |
| `server/src/services/sender.js` | Platform senders | Telegram, WhatsApp, Instagram send helpers |
| `web/src/pages` | Frontend pages | Landing, auth, dashboard, platforms, orders, complaints |
| `web/src/components` | UI components | Sidebar, Navbar, ChatPanel, ContactPanel, AgentSales |
| `docs/backend/06-data` | Supabase migration docs | New DB migration docs already present |

## 5. Application Architecture

Current architecture is a monorepo-style full-stack app with separate frontend and backend packages.

```txt
Browser / CRM Admin
   ↓
React Vite frontend
   ↓ Axios with Bearer JWT
Express REST API
   ↓
MongoDB via Mongoose
```

Telegram flow:

```txt
Telegram User
   ↓
Telegram Bot Webhook: POST /webhook/telegram/:token?
   ↓
server/src/routes/webhooks/telegram.js
   ↓
Find Platform -> Find Agent -> Find/Create Contact -> Find/Create Chat
   ↓
Save Message from=user
   ↓
If takeoverBy exists: stop AI
   ↓
generateAIReply()
   ↓
Telegram sendMessage/sendDocument/sendPhoto/sendVideo
   ↓
Save Message from=ai
```

Key architecture notes:

- Frontend and backend are separate apps under one repo.
- Backend is an Express API server, not Next/Nest.
- Telegram uses webhook, not polling.
- No durable queue is present.
- Follow-ups use in-process cron.
- Local files are served through Express static `/files`.
- AI side effects currently happen inside AI service, not isolated domain services.

## 6. Current Features

| Feature | Status | Evidence | Notes |
|---|---|---|---|
| Landing page | Exists | `web/src/pages/Landing.jsx` | Marketing-style entry page |
| Register/Login/Verify | Exists | `web/src/pages/Register.jsx`, `Login.jsx`, `Verify.jsx`, `server/src/routes/auth.js` | OTP verification |
| Forgot/reset password | Exists | `ForgotPassword.jsx`, `ResetPassword.jsx`, `auth.js` | Email reset token |
| JWT auth middleware | Exists | `server/src/middleware/auth.js` | Bearer token |
| Dashboard | Exists | `web/src/pages/Dashboard.jsx` | Main app shell |
| Inbox/chat list | Exists | `Dashboard.jsx`, `server/src/routes/chats.js` | Polling every few seconds |
| Chat messages | Exists | `ChatPanel.jsx`, `/chats/:id/messages` | Includes reply-to support |
| Human takeover | Exists | `/chats/:id/takeover` | AI skips after takeover |
| Resolve chat | Exists | `/chats/:id/resolve` | Sets resolved |
| Connected platforms | Exists | `web/src/pages/Platforms.jsx`, `/platforms` | Telegram/WA/IG style config |
| Telegram webhook | Exists | `server/src/routes/webhooks/telegram.js` | Main Telegram integration |
| Meta webhook | Exists | `server/src/routes/webhooks/meta.js` | WA/Instagram |
| AI agents | Exists | `/agents`, `Agent.js` | Prompt, behavior, knowledge, files, forms |
| Agent test UI | Exists | `/agents/:id/test` | Backend test endpoint |
| Sales forms | Partial | `Agent.salesForms`, `AgentSales.jsx` | Used for AI order collection |
| Orders | Partial | `Order.js`, `/orders`, `web/src/pages/Orders.jsx` | Not fully marketplace order model |
| Complaints | Exists/partial | `Complaint.js`, `/complaints` | Needs auth hardening |
| Analytics | Exists | `/analytics/*` | Basic aggregation |
| Product catalog | Partial/missing | `Agent.salesForms.products`, `Agent.products` | No standalone product catalog |
| Cart | Missing | No cart model/route found | Required for marketplace |
| Payment gateway | Missing | No Midtrans/Xendit/Stripe found | Manual payment only |

## 7. Telegram Bot Integration

### Library Used

- Library: no Telegram framework found.
- Implementation: direct Telegram Bot API calls using `fetch`.
- Evidence:
  - `server/src/routes/webhooks/telegram.js`
  - `server/src/services/sender.js`

`server/src/services/sender.js` includes helpers like:

```txt
tgSend
tgSendSplit
tgSendDocument
tgSendPhoto
tgSendVideo
tgSendSticker
```

### Entry Point

Webhook route is mounted in:

```txt
server/src/routes/webhooks/index.js
router.use('/telegram', telegramRouter)
```

Express app mounts webhook routes in:

```txt
server/src/index.js
app.use('/webhook', webhookRoutes)
```

Final route:

```http
POST /webhook/telegram/:token?
```

### Webhook Setup

Endpoint:

```http
POST /integrations/telegram/:id/setWebhook
```

File:

```txt
server/src/routes/integrations.js
```

It sends Telegram `setWebhook` with:

```txt
<PUBLIC_BASE_URL>/webhook/telegram
```

### Message Flow

1. Telegram sends update payload to `/webhook/telegram/:token?`.
2. Backend replies HTTP 200 immediately.
3. Handler extracts `message`, `edited_message`, or `callback_query.message`.
4. Text is taken from message text, edited text, callback data, or caption.
5. Platform is found by Telegram token param or latest Telegram platform with token.
6. Incoming attachments are downloaded into local `uploads`.
7. Voice/audio is optionally transcribed by Gemini.
8. Agent is found by `platformId`, fallback to first workspace agent.
9. Contact is found or created by Telegram chat id.
10. Chat is found or created.
11. User message is saved with `from=user`.
12. Chat unread and last message timestamp are updated.
13. If `chat.takeoverBy` exists, AI reply is skipped.
14. `/start` sends welcome message and optional sticker.
15. File request shortcuts are checked.
16. AI reply is generated.
17. Reply is sent to Telegram.
18. AI message is saved.

### Supported Commands

| Command | Handler | Behavior |
|---|---|---|
| `/start` | `server/src/routes/webhooks/telegram.js` | Sends agent welcome message and optional sticker, then stops regular AI processing |

### Supported Telegram Content

| Content | Status | Notes |
|---|---|---|
| Text | Supported | Saved and sent to AI |
| Caption | Supported | Used as text fallback |
| Photo | Supported | Downloads largest photo |
| Document | Supported | Downloads file |
| Voice/audio | Supported | Downloads and attempts transcription |
| Callback query | Partial | Reads callback data as text, but no commerce inline flow found |
| Reply-to | Supported | Maps Telegram message id to internal `replyTo` |
| Inline keyboard | Not found | No inline keyboard sender/helper found |

### Telegram Limitations

- No Telegraf/grammy session abstraction.
- No robust webhook idempotency check before inserting message.
- No inline keyboard marketplace flow yet.
- No cart or checkout state tied to Telegram chat.
- Telegram webhook URL set without token-specific path by current `setWebhook`.
- Production signature verification for Telegram is not implemented.
- Platform token is stored in database as plain text.

## 8. AI Chatbot Integration

### Providers

File:

```txt
server/src/services/aiClient.js
```

Providers:

- OpenAI, initialized from `OPENAI_API_KEY`.
- Gemini, initialized from `GOOGLE_API_KEY`.

Models used:

- OpenAI: `gpt-4o-mini`.
- Gemini: `gemini-2.5-flash`.

### AI Flow

Main file:

```txt
server/src/services/ai.js
```

Flow:

```txt
generateAIReply()
  -> if no provider, Echo fallback
  -> check Q&A knowledge via Fuse
  -> prepare system and prompt
  -> try OpenAI
  -> fallback to Gemini
  -> inject sales/order/payment/complaint/escalation instructions
  -> include recent chat history
  -> include image attachments for Gemini vision
  -> parse special markers
  -> return cleaned reply
```

### Knowledge/RAG

There is no vector database or embeddings pipeline found.

Current knowledge support:

- `Agent.knowledge` array with kind `url`, `pdf`, `text`, `file`, `qna`.
- Q&A entries use Fuse fuzzy matching before LLM call.
- File/database matching can trigger file sending.

### AI Tools and Side Effects

AI can cause side effects through output markers:

| Marker | Effect |
|---|---|
| `ESCALATE_TO_HUMAN` | Sets `Chat.isEscalated = true` |
| `FILE_ORDER_JSON:` | Parses JSON and creates `Order` |
| `FILE_COMPLAINT_JSON:` | Parses JSON and creates `Complaint` |

### Marketplace MVP AI Recommendation

AI should not directly finalize marketplace orders without deterministic confirmation. Recommended role:

- Shopping assistant.
- Product search and explanation.
- Cart suggestion.
- Ask quantity/variant.
- Confirm cart summary before checkout.
- Create pending order only after explicit confirmation.
- Generate payment link through backend payment service.
- Escalate to human if uncertain.

For marketplace, move AI side effects out of raw marker parsing and into explicit backend commands/functions with validation.

## 9. Backend/API Analysis

### Mounted Route Groups

From `server/src/index.js`:

```txt
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
```

`server/src/routes/settings.js` exists but is not mounted in `server/src/index.js`.

### Endpoint Table

| Method | Path | File | Purpose | Auth Required | Status |
|---|---|---|---|---|---|
| POST | `/auth/register` | `routes/auth.js` | Register owner + OTP | No | Working |
| POST | `/auth/verify` | `routes/auth.js` | Verify OTP | No | Working |
| POST | `/auth/login` | `routes/auth.js` | Login JWT | No | Working |
| POST | `/auth/logout` | `routes/auth.js` | Set offline | No | Partial |
| POST | `/auth/forgot-password` | `routes/auth.js` | Create reset token | No | Working |
| POST | `/auth/reset-password` | `routes/auth.js` | Reset password | No | Working |
| GET | `/users` | `routes/users.js` | List workspace users | Yes | Working |
| POST | `/users/human` | `routes/users.js` | Create human user | Yes owner/super | Working |
| DELETE | `/users/:id` | `routes/users.js` | Delete user | Yes owner/super | Working |
| GET | `/users/fix-my-account` | `routes/users.js` | Diagnostic fix | No | Risk |
| GET | `/users/find-by-email` | `routes/users.js` | Diagnostic find | No | Risk |
| GET | `/platforms` | `routes/platforms.js` | List platforms | Yes | Working |
| GET | `/platforms/:id` | `routes/platforms.js` | Platform detail | Yes | Partial workspace inconsistency |
| POST | `/platforms` | `routes/platforms.js` | Create platform | Yes | Working |
| PUT | `/platforms/:id` | `routes/platforms.js` | Update platform | Yes | Working |
| DELETE | `/platforms/:id` | `routes/platforms.js` | Delete platform | Yes | Working |
| GET | `/agents` | `routes/agents.js` | List agents | Yes | Working |
| POST | `/agents` | `routes/agents.js` | Create agent | Yes | Working |
| PUT | `/agents/:id` | `routes/agents.js` | Update agent | Yes | Working |
| DELETE | `/agents/:id` | `routes/agents.js` | Delete agent | Yes | Working |
| POST | `/agents/upload` | `routes/agents.js` | Upload local file | Yes | Working |
| POST | `/agents/:id/database` | `routes/agents.js` | Upload agent database file | Yes | Working |
| POST | `/agents/:id/test` | `routes/agents.js` | Test AI reply | Yes | Working |
| GET | `/chats` | `routes/chats.js` | Inbox list | Yes | Working |
| GET | `/chats/:chatId/messages` | `routes/chats.js` | Message history | Yes | Working |
| POST | `/chats/:chatId/send` | `routes/chats.js` | Human send | Yes | Working |
| POST | `/chats/:chatId/takeover` | `routes/chats.js` | Human takeover | Yes | Working |
| POST | `/chats/:chatId/resolve` | `routes/chats.js` | Resolve chat | Yes | Working |
| DELETE | `/chats/:chatId` | `routes/chats.js` | Delete chat/messages | Yes | Working |
| GET | `/contacts` | `routes/contacts.js` | List contacts | Yes | Working |
| PUT | `/contacts/:id` | `routes/contacts.js` | Update tags/notes | Yes | Working |
| POST | `/webhook/telegram/:token?` | `routes/webhooks/telegram.js` | Telegram inbound webhook | Public | Working |
| GET | `/webhook/meta` | `routes/webhooks/meta.js` | Meta verification | Public | Working if env correct |
| POST | `/webhook/meta` | `routes/webhooks/meta.js` | WhatsApp/Instagram webhook | Public | Risk: check imports |
| POST | `/integrations/telegram/:id/setWebhook` | `routes/integrations.js` | Set Telegram webhook | Yes | Working |
| GET | `/integrations/instagram/callback` | `routes/integrations.js` | Instagram callback placeholder | Public | Partial |
| GET | `/analytics/traffic` | `routes/analytics.js` | Message traffic | Yes | Partial user/workspace logic |
| GET | `/analytics/platforms` | `routes/analytics.js` | Platform stats | Yes | Partial |
| GET | `/analytics/agents` | `routes/analytics.js` | Agent stats | Yes | Partial |
| GET | `/analytics/peak-hours` | `routes/analytics.js` | Hourly stats | Yes | Partial |
| GET | `/billing` | `routes/billing.js` | Plan and limits | Yes | Working |
| GET | `/profile` | `routes/profile.js` | Current profile | Yes | Working |
| GET | `/orders` | `routes/orders.js` | List orders | No | Security risk |
| PUT | `/orders/:id` | `routes/orders.js` | Update status | No | Security risk |
| PUT | `/orders/:id/cancel` | `routes/orders.js` | Cancel order | No | Security risk |
| DELETE | `/orders/:id` | `routes/orders.js` | Delete order | No | Security risk |
| GET | `/complaints` | `routes/complaints.js` | List complaints | No | Security risk |
| POST | `/complaints` | `routes/complaints.js` | Create complaint | No | Security risk |
| PUT | `/complaints/:id` | `routes/complaints.js` | Update complaint | No | Security risk |
| DELETE | `/complaints/:id` | `routes/complaints.js` | Delete complaint | No | Security risk |

### API Readiness for Commerce

The API is not yet ready for deterministic marketplace commerce because it lacks:

- `/products`.
- `/categories`.
- `/cart`.
- `/cart/items`.
- `/checkout`.
- `/payments`.
- `/payment-webhook`.
- normalized `order_items`.
- payment transaction table.
- inventory/status management.

## 10. Database Analysis

### Current Database

- Database: MongoDB.
- ODM: Mongoose.
- Connection: `mongoose.connect(MONGODB_URI)` in `server/src/index.js`.

### Current Models

| Model | Purpose | Important Fields | Relations | Notes |
|---|---|---|---|---|
| `User` | App user/human agent | `workspaceId`, `email`, `passwordHash`, `role`, `verified`, `plan` | Workspace owner/agent | `owner`, `super`, `agent` roles |
| `Platform` | Connected external platform | `type`, `token`, `accountId`, `phoneNumberId`, `appSecret` | User/workspace | Stores credentials |
| `Agent` | AI bot config | `platformId`, `prompt`, `behavior`, `knowledge`, `salesForms`, `products`, `payment` | Platform/workspace | Contains commerce-ish config |
| `Contact` | Customer profile | `platformType`, `platformAccountId`, `handle`, `tags`, `notes` | Chat | Telegram user stored here |
| `Chat` | Conversation state | `agentId`, `contactId`, `platformId`, `takeoverBy`, `isEscalated`, `status` | Messages | Critical AI/human state |
| `Message` | Message history | `chatId`, `from`, `text`, `attachment`, `replyTo`, `platformMessageId` | Chat | Supports Telegram reply mapping |
| `Order` | Order record | `chatId`, `contactId`, `agentId`, `formName`, `formData`, `status`, `paymentProofUrl` | Chat/contact/agent | Not normalized for marketplace |
| `Complaint` | Complaint record | `chatId`, `contactId`, `agentId`, `text`, `formData`, `status` | Chat/contact/agent | Route lacks auth |
| `Knowledge` | File metadata | `workspaceId`, `originalName`, `storedName`, `mimetype` | Workspace | Separate knowledge file collection |
| `OTP` | OTP verification | `email`, `code`, `expiresAt` | User by email | TTL index |
| `PasswordReset` | Reset token | `userId`, `token`, `expiresAt` | User | Token indexed |
| `Setting` | AI settings | `workspaceId`, `primaryAI`, `secondaryAI` | Workspace | Route exists but not mounted |

### Marketplace Schema Readiness

Current schema supports chat and AI-assisted order capture, but not full marketplace.

Missing recommended MVP tables/models:

```txt
products
product_categories
product_variants
inventory_movements
carts
cart_items
orders
order_items
payments
payment_events
telegram_sessions
webhook_events
```

There are Supabase migration docs in `docs/backend/06-data`, but current runtime code still uses MongoDB.

## 11. Product/Commerce Readiness

| Feature | Exists? | Evidence | MVP Readiness |
|---|---|---|---|
| Product Catalog | Partial | `Agent.products`, `Agent.salesForms.products`, `AgentSales.jsx` | Not ready; tied to agent config |
| Product Categories | No | Not found | Missing |
| Product Variants | No | Not found | Missing |
| Inventory | No | Not found | Missing |
| Cart | No | No cart model/routes | Missing |
| Checkout | Partial AI prompt only | `FILE_ORDER_JSON`, `Agent.payment` | Not deterministic |
| Order | Yes partial | `Order.js`, `/orders`, `Orders.jsx` | Needs normalization/security |
| Order Items | No | `Order.formData` object only | Missing |
| Payment | Manual partial | `Agent.payment.bankInfo`, `qrisUrl`, proof image | No gateway |
| Customer Profile | Yes partial | `Contact` | Good base |
| Admin Dashboard | Yes partial | `Dashboard.jsx`, `Orders.jsx`, `Platforms.jsx` | Good base |
| Multi-seller | No | No seller/store model | Single workspace merchant only |

### Commerce Assessment

The current commerce flow is AI-driven:

```txt
AI asks details -> AI emits FILE_ORDER_JSON -> backend creates Order
```

For marketplace MVP, this should become backend-driven:

```txt
Telegram button/menu -> product lookup -> cart -> checkout confirmation -> payment link -> payment webhook -> paid order
```

## 12. Payment Gateway Readiness

No Midtrans, Xendit, Stripe, or other payment gateway integration was found.

Existing payment-related features:

- `Agent.payment.enabled`.
- `Agent.payment.bankInfo`.
- `Agent.payment.qrisUrl`.
- AI prompt asks user to pay manually.
- AI tries to validate image proof with Gemini.
- `Order.paymentProofUrl`.

Missing for payment gateway sandbox:

- Payment provider SDK/API client.
- `payments` table/model.
- `payment_events` table/model.
- Create payment link endpoint.
- Payment webhook endpoint.
- Signature verification.
- Order status update from provider.
- Telegram notification after payment success/failure.

Recommended MVP Payment Flow:

1. User chooses products in Telegram.
2. Backend creates cart.
3. User confirms checkout.
4. Backend creates pending order.
5. Backend creates Midtrans/Xendit sandbox payment link.
6. Bot sends payment link to Telegram user.
7. Payment gateway webhook updates payment status.
8. Backend marks order as paid.
9. Bot sends payment success notification.

## 13. Admin/User Interface

### Top-Level Frontend Routes

| Page | Path | Purpose | Status | Notes |
|---|---|---|---|---|
| Landing | `/` | Public marketing page | Exists | `Landing.jsx` |
| Login | `/login` | Auth login | Exists | `Login.jsx` |
| Register | `/register` | Auth register | Exists | `Register.jsx` |
| Verify | `/verify` | OTP verification | Exists | `Verify.jsx` |
| Forgot Password | `/forgot-password` | Request reset | Exists | `ForgotPassword.jsx` |
| Reset Password | `/reset-password/:token` | Reset password | Exists | `ResetPassword.jsx` |
| Dashboard/Inbox | `/app` | Chat inbox | Exists | `Dashboard.jsx` |
| Analytics | `/app/analytics` | Charts | Exists | Basic |
| Contacts | `/app/contacts` | Contact management | Exists | Tags/notes |
| Complaints | `/app/complaints` | Complaint list | Exists | Backend route risk |
| Orders | `/app/orders` | Order management | Exists | Partial commerce |
| Platforms | `/app/platforms` | Connected platform CRUD | Exists | Telegram setup |
| AI Agents | `/app/agents` | AI agent list | Exists | Agent detail subroutes |
| Agent Detail | `/app/agents/:id/:tab` | Agent config | Exists | Includes sales config |
| Human Agents | `/app/humans` | User management | Exists | Owner/super |
| Settings | `/app/settings` | AI provider settings | Partial | Backend route not mounted |
| Billing | `/app/billing` | Plan info | Exists | Basic |
| Profile | `/app/profile` | User info | Exists | Basic |

### Admin MVP Readiness

The dashboard is a strong foundation for marketplace admin, but needs:

- Product CRUD page.
- Category/variant management.
- Inventory/stock management.
- Payment transaction page.
- Order item detail.
- Payment status detail.
- Telegram marketplace session inspection.

## 14. Environment Variables

Detected env variables:

| Variable | Used In | Purpose |
|---|---|---|
| `MONGODB_URI` | `server/src/index.js`, scripts | MongoDB connection |
| `MONGO_URI` | some scripts | Alternate Mongo var |
| `PORT` | `server/src/index.js` | Backend port |
| `CORS_ORIGIN` | `server/src/index.js`, `auth.js` | Allowed origins/reset link |
| `PUBLIC_BASE_URL` | webhook/sender routes | Public backend URL for webhooks/files |
| `JWT_SECRET` | `auth.js`, `middleware/auth.js` | JWT signing |
| `SMTP_URL` | `services/mail.js` | SMTP transport |
| `SMTP_FROM` | `services/mail.js` | Email sender |
| `OPENAI_API_KEY` | `services/aiClient.js` | OpenAI |
| `GOOGLE_API_KEY` | `services/aiClient.js` | Gemini |
| `META_VERIFY_TOKEN` | `routes/webhooks/meta.js` | Meta webhook verification |
| `VITE_API_BASE` | `web/src/api/index.js` | Frontend API base |
| `VITE_APP_NAME` | `Navbar.jsx` | Frontend app name |
| `REACT_APP_API_URL` | `web/src/pages/Orders.jsx` | Legacy CRA-style var; incompatible with Vite unless replaced |

Important security note: do not commit real `.env` with API keys or DB credentials.

## 15. Local Development Guide

### Install

```bash
npm --prefix server install
npm --prefix web install
```

### MongoDB

Option A, Docker Mongo:

```bash
docker compose up -d mongo
```

Option B, existing MongoDB/Atlas via `server/.env`.

### Frontend Env

```bash
cp web/.env.example web/.env
```

Expected:

```env
VITE_API_BASE=http://localhost:5000
VITE_APP_NAME=Chatbot CRM
```

### Backend Env

Create `server/.env` with:

```env
MONGODB_URI=mongodb://localhost:27017/chatbot_crm
JWT_SECRET=please_change_me
PORT=5000
PUBLIC_BASE_URL=
SMTP_URL=
SMTP_FROM="Chatbot CRM <no-reply@chatbot.local>"
OPENAI_API_KEY=
GOOGLE_API_KEY=
CORS_ORIGIN=http://localhost:5173
META_VERIFY_TOKEN=your_meta_verify_token
```

### Run Both Apps

```bash
npm run dev
```

This uses `scripts/dev.js` to start:

- backend: `server npm run dev`
- frontend: `web npm run dev`

Default URLs:

```txt
Backend:  http://localhost:5000
Frontend: http://localhost:5173
```

## 16. Deployment Notes

Deployment artifacts found:

- `Dockerfile.server`
- `Dockerfile.web`
- `docker-compose.yml`
- `docker-compose-full.yml`
- `docker-compose-advanced.yml`
- `docker-compose-with-ngrok.yml`
- `CLOUDFLARE_TUNNEL_GUIDE.md`

Webhook production requirement:

```txt
PUBLIC_BASE_URL must point to public HTTPS backend URL.
```

Telegram webhook setup:

```txt
POST /integrations/telegram/:platformId/setWebhook
```

For current local media strategy, deployment must persist:

```txt
server/uploads
```

If using Docker, mount uploads as a persistent volume.

## 17. Security Notes

High-priority risks:

1. `orders` routes do not require auth.
2. `complaints` routes do not require auth.
3. `users/fix-my-account` and `users/find-by-email` are public diagnostic routes.
4. Platform tokens are stored as plain database fields.
5. `/files` is public static serving.
6. Telegram webhook lacks idempotency and signature/secret validation.
7. Meta webhook depends on verify token for setup but POST signature verification is not implemented.
8. `settings.js` route exists but is not mounted.
9. Some analytics use `chat.userId` rather than consistently using workspace.
10. `web/src/pages/Orders.jsx` uses `process.env.REACT_APP_API_URL`, which is not the Vite pattern.

Before marketplace launch, fix auth/workspace isolation and payment webhook verification.

## 18. Known Issues

| Issue | Evidence | Impact |
|---|---|---|
| Orders API public | `server/src/routes/orders.js` lacks auth middleware | Data leak/modification risk |
| Complaints API public | `server/src/routes/complaints.js` lacks auth middleware | Data leak/modification risk |
| Settings route not mounted | `server/src/routes/settings.js`, absent in `index.js` mount list | `/app/settings` may fail |
| Diagnostic user routes public | `server/src/routes/users.js` | Production security risk |
| Meta media helper may need import review | `meta.js` uses file operations | Potential runtime bug if imports missing |
| No payment gateway | No Midtrans/Xendit/Stripe code found | Marketplace checkout missing |
| Product catalog not normalized | Products nested in Agent | Hard to manage real catalog/inventory |
| No cart model | No cart route/model found | Telegram checkout missing |
| No webhook idempotency | Telegram stores incoming messages directly | Duplicate messages/orders possible |

## 19. Technical Debt

- Mongoose model logic is used directly in routes; no repository/service abstraction.
- AI service directly creates orders/complaints and updates chats.
- Agent model is overloaded with prompt, product, payment, complaint, follow-up, file database, and knowledge config.
- Orders store dynamic `formData` rather than normalized order items.
- Files are stored locally with mixed path conventions.
- Webhook handlers are large and hard to test.
- No automated tests found for webhook/AI/order flows.
- No queue for webhook/AI processing.
- No explicit migration scripts for current Mongo runtime, although docs now exist.

## 20. Missing Pieces for MVP

For Telegram marketplace MVP, missing pieces are:

1. Product catalog model and API.
2. Product category/variant support.
3. Inventory/stock rules.
4. Telegram product browsing flow.
5. Inline keyboard buttons.
6. Cart and cart items.
7. Checkout confirmation.
8. Payment gateway sandbox.
9. Payment webhook with signature verification.
10. Payment status and payment events.
11. Order items normalized.
12. Customer order status lookup.
13. Admin product CRUD UI.
14. Admin payment transaction UI.
15. Webhook event log/idempotency.

## 21. Recommended MVP Scope

Recommended MVP should be **single-merchant Telegram-first marketplace**, not multi-seller.

### Include

- Telegram bot product list/search.
- Product detail.
- Add to cart.
- View cart.
- Checkout.
- Payment gateway sandbox link.
- Payment webhook.
- Paid order notification.
- Admin product CRUD.
- Admin order management.
- Existing AI assistant for FAQ/product help.
- Human takeover from CRM.

### Exclude for MVP

- Multi-seller marketplace.
- Complex inventory reservations.
- Promotions/vouchers.
- Shipping provider integration.
- Refund automation.
- Loyalty points.
- Full public web storefront.

## 22. Recommended Development Roadmap

### Phase 1: Stabilize Existing CRM

- Secure `/orders` and `/complaints`.
- Remove/protect diagnostic routes.
- Mount `/settings` or remove UI dependency.
- Add webhook event logging.
- Add Telegram idempotency.
- Fix Vite env usage in Orders page.

### Phase 2: Commerce Data Model

Add models/tables:

```txt
Product
ProductCategory
ProductVariant
Cart
CartItem
OrderItem
Payment
PaymentEvent
WebhookEvent
```

If migrating to Supabase, align this with `docs/backend/06-data`.

### Phase 3: Telegram Commerce Flow

- `/start` menu.
- Browse products.
- Product detail with buttons.
- Add to cart.
- View cart.
- Checkout confirmation.
- Payment link send.
- Order status command.

### Phase 4: Payment Sandbox

- Choose Midtrans or Xendit.
- Create payment link endpoint.
- Store payment record.
- Add payment webhook.
- Verify signature.
- Update order status.
- Notify Telegram user.

### Phase 5: Admin UI

- Products page.
- Product form.
- Orders with items/payment status.
- Payment event detail.
- Telegram customer session view.

## 23. Next Sprint Plan

### Sprint Goal

Turn the current chatbot CRM into a safe foundation for Telegram marketplace MVP.

### Tasks

1. Secure `orders` route with `authRequired`, `attachUser`, and workspace filters.
2. Secure `complaints` route with `authRequired`, `attachUser`, and workspace filters.
3. Remove or protect `users/fix-my-account` and `users/find-by-email`.
4. Mount `/settings` in `server/src/index.js`.
5. Add `WebhookEvent` model for Telegram idempotency.
6. Add `Product` model/API or Supabase schema equivalent.
7. Add `Cart` and `CartItem` model/API.
8. Add Telegram inline keyboard sender helpers.
9. Implement `/start` menu with product browsing.
10. Write webhook fixture tests for Telegram text and callback query.

### Definition of Done

- Existing login/dashboard/inbox still works.
- Telegram webhook still replies.
- Duplicate Telegram message id does not create duplicate message.
- Owner can CRUD product.
- Telegram user can view product list.
- No unauthenticated access to orders/complaints.

## 24. Files and Code References

| Area | File |
|---|---|
| Backend entry | `server/src/index.js` |
| Auth route | `server/src/routes/auth.js` |
| Auth middleware | `server/src/middleware/auth.js` |
| Telegram webhook | `server/src/routes/webhooks/telegram.js` |
| Meta webhook | `server/src/routes/webhooks/meta.js` |
| Webhook index | `server/src/routes/webhooks/index.js` |
| Telegram setWebhook | `server/src/routes/integrations.js` |
| Platform sender helpers | `server/src/services/sender.js` |
| AI service | `server/src/services/ai.js` |
| AI clients | `server/src/services/aiClient.js` |
| Follow-ups | `server/src/services/followups.js` |
| Message buffer | `server/src/services/messageBuffer.js` |
| Models | `server/src/models/*.js` |
| Chat API | `server/src/routes/chats.js` |
| Agent API | `server/src/routes/agents.js` |
| Platform API | `server/src/routes/platforms.js` |
| Order API | `server/src/routes/orders.js` |
| Complaint API | `server/src/routes/complaints.js` |
| Frontend app routes | `web/src/main.jsx` |
| Dashboard | `web/src/pages/Dashboard.jsx` |
| Chat panel | `web/src/components/ChatPanel.jsx` |
| Platform UI | `web/src/pages/Platforms.jsx` |
| Orders UI | `web/src/pages/Orders.jsx` |
| Agent sales UI | `web/src/components/AgentSales.jsx` |
| API client | `web/src/api/index.js` |
| Supabase migration docs | `docs/backend/06-data` |

## 25. Final Recommendation

Continue this project. It already has a useful Telegram chatbot CRM foundation: webhook, AI agent, chat storage, human takeover, dashboard, and basic order capture.

Do not build the marketplace from scratch. Instead:

1. Harden current backend security.
2. Normalize commerce data.
3. Keep Telegram webhook and CRM inbox.
4. Add deterministic marketplace flows around the existing bot.
5. Use AI as assistant, not as the only source of order state.
6. Add payment sandbox after cart/order is deterministic.

Best immediate next step: secure existing `orders` and `complaints` APIs, then add a real `Product` + `Cart` model and Telegram inline keyboard flow.
