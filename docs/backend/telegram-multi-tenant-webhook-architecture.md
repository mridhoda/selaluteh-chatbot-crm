---
title: "Telegram Multi-Tenant Webhook Architecture — SelaluTeh Marketplace"
document_type: architecture-and-implementation-guide
status: implemented
version: 1.1.0
updated_at: 2026-06-27
project: SelaluTeh Marketplace
---

# Telegram Multi-Tenant Webhook Architecture

## 1. Tujuan

Dokumen ini mendefinisikan arsitektur permanen integrasi Telegram setelah SelaluTeh berubah dari single-account menjadi:

```text
multi-account
→ multi-workspace
→ setiap workspace dapat memiliki bot Telegram berbeda
```

Cakupan:

- root cause dan incident summary;
- tenant resolution;
- credential dan webhook secret;
- data model;
- onboarding bot;
- inbound webhook;
- idempotency;
- worker;
- contact, conversation, dan message isolation;
- outbound reply;
- multi-outlet routing;
- token rotation;
- disconnect;
- observability;
- migration;
- test, rollout, dan rollback.

Implementation status as of 2026-06-27:

- v1 route implemented at `POST /webhooks/telegram/v1/:connectionPublicId`.
- `channel_connections`, `outlet_channel_assignments`, and `telegram_webhook_events` applied via migration `030_channel_connections_telegram.sql`.
- Upsert constraints applied via migration `031_channel_connection_upsert_constraints.sql`.
- Live connections verified:
  - `SelaluTeh Demo` / `selkoporder_bot` / `tgc_-TSDUlGLRQbDV6H1`.
  - `SelaluKopi Demo` / `Selkoporders_bot` / `tgc_GALPZnnV4XJuwFJj`.
- Same Telegram `chat.id` is isolated into separate workspace/channel-connection chats.
- Legacy tokenless latest-platform fallback is disabled.

---

# 2. Incident Summary

Akun yang digunakan benar:

```text
user: owner@selaluteh.demo
role: owner
workspace: SelaluTeh Demo
workspace_id: 60f7c52e-b086-4144-994b-a1260ee00ec9
```

Masalah terjadi pada endpoint:

```text
POST /webhook/telegram
```

Webhook berasal dari server Telegram, bukan dari browser owner. Karena itu webhook tidak mengetahui user atau workspace yang sedang aktif di frontend.

Kode lama menggunakan fallback global:

```ts
platform =
  await platformsSupabaseRepository.findLatestByType({
    type: "telegram",
  });
```

Fallback tersebut memilih Telegram platform terbaru dari seluruh database.

Pada incident ini, record terbaru adalah:

```text
workspace: Test WS
platform_id: 7a0dce8e-d783-4399-a227-ce20b52f7e6b
token: kosong
created_at: 2026-06-26
```

Sedangkan koneksi yang benar:

```text
workspace: SelaluTeh Demo
platform_id: f7dbf391-0614-4406-aae3-a3d289f80694
token: tersedia
created_at: 2026-06-18
```

Akibatnya:

```text
Telegram update
→ fallback global
→ Test WS
→ conversation dibuat di workspace salah
→ outbound memakai token kosong
→ Telegram API 404
```

Root cause:

```text
webhook tanpa connection identity
+ global latest-platform fallback
= wrong-tenant routing
```

---

# 3. Prinsip Wajib

## 3.1 Exact connection resolution

Setiap request webhook harus dapat di-resolve menjadi tepat satu channel connection:

```text
Webhook URL
→ connection_public_id
→ exact channel connection
→ workspace_id
→ bot credentials
```

Dilarang menggunakan:

```text
current browser user
latest platform
first Telegram platform
global default workspace
latest non-null token
```

## 3.2 Tiga identitas berbeda

Setiap Telegram connection memiliki:

```text
connection_public_id
→ identitas koneksi di URL
→ bukan bot token
→ bukan satu-satunya authentication factor

webhook_secret
→ verifikasi request webhook
→ dikirim Telegram melalui header

bot_token
→ credential Telegram Bot API
→ encrypted at rest
→ hanya untuk backend outbound/provider calls
```

## 3.3 Outbound terikat ke conversation

```text
Inbound melalui Bot A
→ conversation.channel_connection_id = Connection A
→ outbound selalu memakai Token A
```

Tidak boleh mencari bot kembali hanya berdasarkan provider atau workspace.

## 3.4 Workspace-level connection, outlet-level assignment

```text
Workspace
→ Channel Connection
→ Outlet Channel Assignments
```

Webhook menentukan workspace dan bot. Outlet ditentukan kemudian melalui:

```text
related order
selected outlet
routing policy + customer confirmation
```

---

# 4. Arsitektur Target

```text
Workspace A
└── Telegram Connection A
    ├── public_id = tgc_A
    ├── provider_bot_id = bot_A
    ├── encrypted token A
    ├── webhook secret A
    └── /webhooks/telegram/v1/tgc_A

Workspace B
└── Telegram Connection B
    ├── public_id = tgc_B
    ├── provider_bot_id = bot_B
    ├── encrypted token B
    ├── webhook secret B
    └── /webhooks/telegram/v1/tgc_B
```

Request A:

```text
POST /webhooks/telegram/v1/tgc_A
X-Telegram-Bot-Api-Secret-Token: secret_A
→ Connection A
→ Workspace A
```

Request B:

```text
POST /webhooks/telegram/v1/tgc_B
X-Telegram-Bot-Api-Secret-Token: secret_B
→ Connection B
→ Workspace B
```

---

# 5. Webhook URL dan Secret

Route permanen:

```text
POST /webhooks/telegram/v1/:connectionPublicId
```

Contoh:

```text
https://crm-dev.incretlabs.my.id/webhooks/telegram/v1/tgc_kH8s2Lm9Pq4Yv7N
```

`connectionPublicId` harus:

- unik global;
- non-sequential;
- tidak memuat bot token;
- tidak memuat workspace ID mentah;
- tidak dianggap secret.

Generator:

```ts
import { randomBytes } from "node:crypto";

function generateConnectionPublicId(): string {
  return `tgc_${randomBytes(12).toString("base64url")}`;
}
```

Webhook secret:

```ts
function generateTelegramWebhookSecret(): string {
  return randomBytes(32).toString("base64url");
}
```

Telegram `secret_token` menerima 1–256 karakter dengan karakter:

```text
A-Z a-z 0-9 _ -
```

Set webhook:

```ts
await telegramApi.setWebhook(botToken, {
  url: webhookUrl,
  secret_token: webhookSecret,
  allowed_updates: ["message", "callback_query"],
  drop_pending_updates: false,
});
```

Telegram akan mengirim:

```text
X-Telegram-Bot-Api-Secret-Token
```

Jangan gunakan bot token pada URL production.

---

# 6. Credential Storage

## 6.1 Bot token

Bot token harus dapat dipakai kembali untuk outbound, sehingga harus disimpan encrypted, bukan hanya di-hash.

Simpan:

```text
credential_ciphertext
credential_key_version
credential_fingerprint
```

Rekomendasi:

```text
AES-256-GCM
atau
cloud secret manager / KMS
```

Fingerprint:

```text
SHA-256(token + server-side pepper)
```

Fingerprint hanya untuk duplicate detection dan diagnostics.

Jangan simpan token di:

```text
frontend
localStorage
logs
webhook URL
analytics
raw exception message
```

## 6.2 Webhook secret

Simpan:

```text
webhook_secret_ciphertext
webhook_secret_hash
webhook_secret_version
```

Verification:

```text
hash received secret
→ constant-time compare
```

Re-registration:

```text
decrypt stored secret
atau
generate dan rotate secret baru
```

---

# 7. Data Model

## 7.1 `channel_connections`

```sql
create table channel_connections (
  id uuid primary key default gen_random_uuid(),
  public_id text not null unique,

  workspace_id uuid not null references workspaces(id),
  provider text not null,

  provider_account_id text not null,
  provider_username text null,
  display_name text null,

  credential_ciphertext text not null,
  credential_key_version text not null,
  credential_fingerprint text not null,

  webhook_secret_ciphertext text not null,
  webhook_secret_hash text not null,
  webhook_secret_version integer not null default 1,

  connection_status text not null,
  webhook_status text not null,
  webhook_url text null,
  allowed_updates jsonb not null default '[]'::jsonb,

  last_webhook_registered_at timestamptz null,
  last_webhook_verified_at timestamptz null,
  last_webhook_received_at timestamptz null,
  last_outbound_success_at timestamptz null,
  last_error_code text null,
  last_error_message text null,

  created_by uuid not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz null,
  version integer not null default 1,

  unique(provider, provider_account_id),
  unique(provider, credential_fingerprint)
);
```

Connection status:

```text
DRAFT
VALIDATING
CONNECTING
CONNECTED
DEGRADED
DISABLED
REVOKED
ERROR
ARCHIVED
```

Webhook status:

```text
NOT_REGISTERED
REGISTERING
REGISTERED
VERIFYING
VERIFIED
ERROR
REMOVED
```

## 7.2 `outlet_channel_assignments`

```sql
create table outlet_channel_assignments (
  id uuid primary key default gen_random_uuid(),

  workspace_id uuid not null references workspaces(id),
  outlet_id uuid not null references outlets(id),
  channel_connection_id uuid not null
    references channel_connections(id),

  status text not null,
  accepts_chats boolean not null default true,
  accepts_orders boolean not null default true,
  routing_mode text not null,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique(outlet_id, channel_connection_id)
);
```

## 7.3 `telegram_webhook_events`

```sql
create table telegram_webhook_events (
  id uuid primary key default gen_random_uuid(),

  workspace_id uuid not null references workspaces(id),
  connection_id uuid not null references channel_connections(id),
  update_id bigint not null,

  update_type text null,
  payload jsonb not null,
  status text not null,
  attempt_count integer not null default 0,

  received_at timestamptz not null default now(),
  available_at timestamptz not null default now(),
  processing_started_at timestamptz null,
  processed_at timestamptz null,
  failed_at timestamptz null,

  error_code text null,
  safe_error_message text null,
  correlation_id text not null,

  unique(connection_id, update_id)
);
```

Event status:

```text
PENDING
PROCESSING
PROCESSED
RETRY
DEAD_LETTER
IGNORED
```

Unique key harus:

```text
connection_id + update_id
```

bukan hanya `update_id`, karena setiap bot memiliki stream update sendiri.

## 7.4 Contact identity

```sql
alter table contact_channel_identities
  add column channel_connection_id uuid
    references channel_connections(id);

create unique index uq_contact_identity_per_connection
on contact_channel_identities (
  channel_connection_id,
  provider_user_id
);
```

## 7.5 Conversation

```sql
alter table conversations
  add column channel_connection_id uuid
    references channel_connections(id);

create unique index uq_conversation_per_connection_chat
on conversations (
  channel_connection_id,
  provider_conversation_id
);
```

## 7.6 Messages

```sql
alter table messages
  add column channel_connection_id uuid
    references channel_connections(id);

create unique index uq_inbound_provider_message
on messages (
  channel_connection_id,
  provider_message_id
)
where direction = 'INBOUND';
```

---

# 8. Repository dan RLS

Semua repository tenant-owned harus menerima:

```text
workspace_id
connection_id
```

Contoh repository yang benar:

```ts
findActiveByPublicId({
  provider: "TELEGRAM",
  publicId,
});

findById({
  workspaceId,
  connectionId,
});

findByProviderAccountId({
  provider: "TELEGRAM",
  providerAccountId,
});
```

Dilarang:

```ts
findLatestByType("telegram");
findAnyTelegramPlatform();
findFirstEnabledTelegram();
findLatestPlatformGlobal();
```

Supabase RLS menjadi defense-in-depth, bukan satu-satunya scoping mechanism.

---

# 9. Bot Onboarding

Flow:

```text
owner enters token
→ backend getMe
→ validate bot identity
→ duplicate check
→ encrypt token
→ create connection
→ generate webhook secret
→ setWebhook
→ getWebhookInfo
→ mark CONNECTED
```

`getMe` digunakan untuk mengambil:

```text
bot ID
username
display name
```

Bot ID menjadi:

```text
provider_account_id
```

Duplicate rule:

```text
provider = TELEGRAM
+ provider_account_id
+ active/non-archived
→ unique global
```

Satu bot tidak boleh aktif pada dua workspace karena satu bot hanya memiliki satu webhook aktif.

---

# 10. Connection Service

```ts
type ConnectTelegramBotInput = {
  workspaceId: string;
  actorMembershipId: string;
  botToken: string;
};

async function connectTelegramBot(
  input: ConnectTelegramBotInput,
) {
  authorize(input.actorMembershipId, {
    workspaceId: input.workspaceId,
    permission: "channels.telegram.manage",
  });

  const bot = await telegramApi.getMe(input.botToken);

  const duplicate =
    await channelConnectionRepository
      .findByProviderAccountId({
        provider: "TELEGRAM",
        providerAccountId: String(bot.id),
      });

  if (
    duplicate &&
    duplicate.workspaceId !== input.workspaceId &&
    duplicate.connectionStatus !== "ARCHIVED"
  ) {
    throw new ConflictError(
      "TELEGRAM_BOT_ALREADY_CONNECTED",
    );
  }

  const publicId = generateConnectionPublicId();
  const webhookSecret =
    generateTelegramWebhookSecret();

  const connection =
    await channelConnectionRepository.create({
      publicId,
      workspaceId: input.workspaceId,
      provider: "TELEGRAM",
      providerAccountId: String(bot.id),
      providerUsername: bot.username ?? null,
      displayName: bot.first_name,

      credentialCiphertext:
        encryptCredential(input.botToken),

      credentialKeyVersion:
        currentCredentialKeyVersion(),

      credentialFingerprint:
        fingerprintCredential(input.botToken),

      webhookSecretCiphertext:
        encryptCredential(webhookSecret),

      webhookSecretHash:
        hashWebhookSecret(webhookSecret),

      connectionStatus: "CONNECTING",
      webhookStatus: "NOT_REGISTERED",
      createdBy: input.actorMembershipId,
    });

  try {
    const webhookUrl =
      `${env.PUBLIC_BASE_URL}` +
      `/webhooks/telegram/v1/${connection.publicId}`;

    await telegramApi.setWebhook(input.botToken, {
      url: webhookUrl,
      secret_token: webhookSecret,
      allowed_updates: [
        "message",
        "callback_query",
      ],
      drop_pending_updates: false,
    });

    const info =
      await telegramApi.getWebhookInfo(input.botToken);

    validateRegisteredWebhook({
      expectedUrl: webhookUrl,
      webhookInfo: info,
    });

    return await channelConnectionRepository
      .markConnected({
        workspaceId: input.workspaceId,
        connectionId: connection.id,
        webhookUrl,
        allowedUpdates: [
          "message",
          "callback_query",
        ],
      });
  } catch (error) {
    await channelConnectionRepository.markError({
      workspaceId: input.workspaceId,
      connectionId: connection.id,
      error: sanitizeConnectionError(error),
    });

    throw error;
  }
}
```
---

# 11. Inbound Webhook Route

Route baru:

```ts
router.post(
  "/webhooks/telegram/v1/:connectionPublicId",
  telegramWebhookController.handle,
);
```

Legacy route:

```text
POST /webhook/telegram
```

tidak boleh lagi menjalankan fallback global.

Selama cutover:

```ts
router.post("/webhook/telegram", (_req, res) => {
  return res.status(410).json({
    error: {
      code: "LEGACY_TELEGRAM_WEBHOOK_DISABLED",
      message:
        "Telegram webhook must include a channel connection identity.",
    },
  });
});
```

## 11.1 Controller responsibility

Controller hanya melakukan:

```text
resolve connection
→ verify secret
→ validate payload
→ persist event idempotently
→ return response
```

Controller tidak menjalankan seluruh AI flow, cart, order, atau welcome message secara synchronous.

```ts
async function handleTelegramWebhook(
  req: Request,
  res: Response,
) {
  const publicId =
    telegramConnectionPublicIdSchema.parse(
      req.params.connectionPublicId,
    );

  const connection =
    await channelConnectionRepository
      .findActiveByPublicId({
        provider: "TELEGRAM",
        publicId,
      });

  if (!connection) {
    return res.sendStatus(404);
  }

  const receivedSecret =
    req.get("X-Telegram-Bot-Api-Secret-Token");

  if (
    !receivedSecret ||
    !constantTimeVerifyWebhookSecret({
      receivedSecret,
      expectedHash:
        connection.webhookSecretHash,
    })
  ) {
    securityLogger.warn(
      "telegram_webhook_secret_invalid",
      {
        connectionId: connection.id,
        publicId,
      },
    );

    return res.sendStatus(401);
  }

  const update =
    telegramUpdateSchema.parse(req.body);

  const result =
    await telegramWebhookEventRepository
      .insertOnce({
        workspaceId: connection.workspaceId,
        connectionId: connection.id,
        updateId: String(update.update_id),
        updateType:
          detectTelegramUpdateType(update),
        payload: update,
        correlationId:
          createCorrelationId(),
      });

  await channelConnectionRepository
    .recordInboundReceived({
      workspaceId: connection.workspaceId,
      connectionId: connection.id,
    });

  if (result.duplicate) {
    return res.sendStatus(200);
  }

  return res.sendStatus(200);
}
```

Jika event tidak dapat disimpan:

```text
return 500
```

agar Telegram dapat retry.

Jangan return `200` sebelum event persisted.

---

# 12. Request Validation

Validasi:

```text
Content-Type JSON
body size bounded
update_id required
payload matches Telegram Update schema
connection accepts inbound
secret header valid
```

Contoh:

```ts
app.use(
  "/webhooks/telegram",
  express.json({
    limit: process.env
      .TELEGRAM_WEBHOOK_BODY_LIMIT ?? "2mb",
  }),
);
```

Jangan log seluruh body secara default.

---

# 13. Idempotency

Telegram dapat retry request jika endpoint gagal atau timeout.

Idempotency key:

```text
connection_id + update_id
```

Behavior:

```text
first request
→ insert event
→ PENDING

duplicate request
→ unique conflict
→ return existing/duplicate
→ HTTP 200
```

Downstream juga harus idempotent:

```text
contact identity creation
conversation creation
message insertion
welcome message
AI tool execution
cart mutation
order creation
```

---

# 14. Async Worker

Worker mengambil event:

```text
PENDING
atau
RETRY dengan available_at <= now()
```

Claim harus atomic.

```ts
async function processTelegramWebhookEvent(
  eventId: string,
) {
  const event =
    await telegramWebhookEventRepository
      .claimForProcessing(eventId);

  if (!event) {
    return;
  }

  const connection =
    await channelConnectionRepository
      .findById({
        workspaceId: event.workspaceId,
        connectionId: event.connectionId,
      });

  if (
    !connection ||
    !["CONNECTED", "DEGRADED"].includes(
      connection.connectionStatus,
    )
  ) {
    await telegramWebhookEventRepository
      .markIgnored({
        eventId: event.id,
        reason:
          "TELEGRAM_CONNECTION_INACTIVE",
      });

    return;
  }

  try {
    await telegramUpdateProcessor.process({
      workspaceId: event.workspaceId,
      connectionId: event.connectionId,
      update: event.payload,
      correlationId: event.correlationId,
    });

    await telegramWebhookEventRepository
      .markProcessed(event.id);
  } catch (error) {
    const decision =
      classifyTelegramProcessingError(error);

    if (decision.retryable) {
      await telegramWebhookEventRepository
        .scheduleRetry({
          eventId: event.id,
          availableAt: decision.nextAttemptAt,
          safeError:
            sanitizeProcessingError(error),
        });
    } else {
      await telegramWebhookEventRepository
        .moveToDeadLetter({
          eventId: event.id,
          safeError:
            sanitizeProcessingError(error),
        });
    }
  }
}
```

Recommended retry:

```text
exponential backoff
bounded attempts
dead-letter after max attempts
manual replay with permission
```

---

# 15. Update Normalization

Processor menerima context final:

```text
workspaceId
connectionId
Telegram Update
```

Jangan resolve tenant lagi.

Normalisasi:

```text
provider = TELEGRAM
provider_update_id
provider_message_id
provider_user_id
provider_chat_id
update type
message type
text
attachment references
callback data
provider timestamps
```

---

# 16. Contact Identity Isolation

Telegram user yang sama dapat berbicara dengan beberapa bot.

Identity key:

```text
channel_connection_id
+ provider_user_id
```

Contoh:

```text
Telegram user 123 + Bot SelaluTeh
→ Identity A

Telegram user 123 + Bot Franchise B
→ Identity B
```

Jangan global-merge lintas workspace berdasarkan Telegram user ID.

Contact merge hanya melalui CRM workflow yang workspace-scoped.

---

# 17. Conversation Isolation

Conversation key:

```text
channel_connection_id
+ provider_conversation_id
```

Private chat:

```text
provider_conversation_id = Telegram chat.id
```

Create/find:

```ts
const conversation =
  await conversationRepository
    .findOrCreateByChannel({
      workspaceId,
      channelConnectionId: connectionId,
      providerConversationId:
        String(update.message.chat.id),
      contactIdentityId,
    });
```

---

# 18. Message Persistence

Inbound message menyimpan:

```text
workspace_id
channel_connection_id
conversation_id
contact_identity_id
provider_message_id
provider_update_id
direction = INBOUND
message_type
normalized_content
safe provider metadata
received_at
```

Raw provider payload tetap di webhook inbox dengan retention policy terbatas.

Message tidak menyimpan token atau webhook secret.

---

# 19. Outbound Reply

Outbound selalu dimulai dari conversation:

```ts
async function sendTelegramConversationMessage(
  input: {
    workspaceId: string;
    conversationId: string;
    text: string;
    idempotencyKey: string;
  },
) {
  const conversation =
    await conversationRepository.findById({
      workspaceId: input.workspaceId,
      conversationId:
        input.conversationId,
    });

  if (!conversation) {
    throw new NotFoundError(
      "CONVERSATION_NOT_FOUND",
    );
  }

  const connection =
    await channelConnectionRepository
      .findById({
        workspaceId: input.workspaceId,
        connectionId:
          conversation.channelConnectionId,
      });

  if (
    !connection ||
    connection.provider !== "TELEGRAM"
  ) {
    throw new ConfigurationError(
      "TELEGRAM_CONNECTION_NOT_FOUND",
    );
  }

  if (
    !["CONNECTED", "DEGRADED"].includes(
      connection.connectionStatus,
    )
  ) {
    throw new ConfigurationError(
      "TELEGRAM_CONNECTION_INACTIVE",
    );
  }

  const token =
    decryptCredential(
      connection.credentialCiphertext,
      connection.credentialKeyVersion,
    );

  const result =
    await telegramApi.sendMessage(token, {
      chat_id:
        conversation.providerConversationId,
      text: input.text,
    });

  await messageRepository.createOutbound({
    workspaceId: input.workspaceId,
    channelConnectionId:
      connection.id,
    conversationId:
      conversation.id,
    providerMessageId:
      String(result.message_id),
    content: input.text,
    idempotencyKey:
      input.idempotencyKey,
  });

  await channelConnectionRepository
    .recordOutboundSuccess({
      workspaceId: input.workspaceId,
      connectionId: connection.id,
    });

  return result;
}
```

Dilarang fallback ke bot lain jika token rusak.

Jika gagal:

```text
record failure
mark DEGRADED/ERROR bila threshold tercapai
notify workspace admin
preserve conversation truth
```

---

# 20. Welcome Message

Welcome message:

```text
first inbound event for exact connection/chat
→ conversation created
→ welcome policy evaluated
→ outbound through same connection
```

Idempotency example:

```text
welcome:{connectionId}:{providerChatId}:v1
```

Jangan memicu welcome berdasarkan contact global tanpa connection scope.

---

# 21. Callback Query

Callback query tetap menggunakan connection dari webhook ingress.

`callback_data` tidak boleh menjadi authority untuk:

```text
workspace
outlet
price
payment status
permission
```

Callback data hanya reference/command yang divalidasi backend.

---

# 22. Multi-Outlet Routing

Contoh:

```text
Workspace SelaluTeh Demo
└── Telegram Bot
    ├── Outlet Samarinda
    ├── Outlet Tenggarong
    └── Outlet Danau Murung
```

Saat inbound:

```text
workspace known
connection known
outlet may still be unknown
```

Kemudian:

```text
load eligible outlet assignments
→ suggest outlets
→ customer confirms outlet
→ save selected_outlet_id
→ cart/order scoped to outlet
```

Jika hanya satu outlet assignment:

```text
deterministic auto-select may be allowed
```

Jika lebih dari satu:

```text
customer confirmation required
```

Webhook URL tidak digunakan untuk menebak outlet.

---

# 23. One Workspace, Multiple Bots

Arsitektur mendukung:

```text
Workspace A
├── Bot Commerce
└── Bot Franchise Support
```

Karena itu outbound tidak cukup menggunakan `workspace_id`.

Wajib:

```text
conversation.channel_connection_id
```

---

# 24. Connection Reconciliation

Background reconciliation:

```text
for each active Telegram connection
→ decrypt token
→ getMe
→ getWebhookInfo
→ compare bot identity
→ compare expected URL
→ inspect pending updates/error
→ update health
```

Fields:

```text
last_reconciled_at
pending_update_count
last_webhook_error_date
last_webhook_error_message
webhook_matches_expected
bot_identity_matches
```

Jalankan secara bounded dan tidak terlalu sering.

---

# 25. Token Rotation

## 25.1 Same bot, new token

```text
owner submits new token
→ getMe
→ bot ID must equal current provider_account_id
→ stage encrypted credential
→ rotate webhook secret
→ setWebhook
→ getWebhookInfo
→ activate new credential
→ retire old version
```

Jangan overwrite working token sebelum verification sukses.

## 25.2 Different bot

Jika bot ID berbeda:

```text
TELEGRAM_BOT_IDENTITY_CHANGED
```

Gunakan explicit Replace Bot flow:

```text
archive/disable old connection
preserve old conversations
create new connection/public ID
register new webhook
audit replacement
```

---

# 26. Disconnect

```text
authorize admin
→ deleteWebhook
→ webhook status REMOVED
→ connection DISABLED
→ block new outbound
→ preserve history
```

Jangan menghapus conversations/messages.

---

# 27. Error Model

```text
TELEGRAM_TOKEN_INVALID
TELEGRAM_GET_ME_FAILED
TELEGRAM_BOT_ALREADY_CONNECTED
TELEGRAM_BOT_IDENTITY_CHANGED

TELEGRAM_CONNECTION_NOT_FOUND
TELEGRAM_CONNECTION_INACTIVE
TELEGRAM_CONNECTION_SCOPE_MISMATCH

TELEGRAM_WEBHOOK_PUBLIC_ID_INVALID
TELEGRAM_WEBHOOK_SECRET_MISSING
TELEGRAM_WEBHOOK_SECRET_INVALID
TELEGRAM_WEBHOOK_PAYLOAD_INVALID
TELEGRAM_WEBHOOK_EVENT_DUPLICATE
TELEGRAM_WEBHOOK_EVENT_PERSIST_FAILED

TELEGRAM_SET_WEBHOOK_FAILED
TELEGRAM_WEBHOOK_VERIFICATION_FAILED
TELEGRAM_DELETE_WEBHOOK_FAILED

TELEGRAM_OUTBOUND_FAILED
TELEGRAM_OUTBOUND_UNAUTHORIZED
TELEGRAM_OUTBOUND_RATE_LIMITED
TELEGRAM_OUTBOUND_CHAT_NOT_FOUND

TELEGRAM_EVENT_PROCESSING_FAILED
TELEGRAM_EVENT_DEAD_LETTERED
```

User-facing errors harus sanitized.

---

# 28. Observability

## Logs

Safe fields:

```text
workspace_id
connection_id
connection_public_id
provider_account_id
event_id
update_id
conversation_id
correlation_id
status
error_code
attempt_count
duration_ms
```

Jangan log:

```text
bot token
webhook secret
full raw payload
message body in general error logs
full customer identifiers
```

## Metrics

```text
telegram_webhook_received_total
telegram_webhook_verified_total
telegram_webhook_invalid_secret_total
telegram_webhook_duplicate_total
telegram_webhook_persist_failed_total

telegram_event_processed_total
telegram_event_retry_total
telegram_event_dead_letter_total
telegram_event_processing_duration_ms

telegram_outbound_success_total
telegram_outbound_failure_total
telegram_outbound_duration_ms

telegram_connection_status_count
telegram_webhook_pending_updates
```

## Alerts

```text
webhook URL mismatch
invalid-secret spike
dead-letter event
event backlog
outbound failure spike
token invalid
Telegram-reported webhook error
workspace connection unavailable
duplicate bot assignment attempt
```

---

# 29. Security Controls

## Wrong tenant

```text
exact public ID lookup
connection-owned workspace
no fallback
repository scope
RLS
```

## Forged webhook

```text
secret header
constant-time compare
HTTPS
schema validation
body limit
rate limit
```

## Token leakage

```text
encrypted at rest
not in URL
not in frontend
redacted logs
rotation
restricted decryption service
```

## Cross-workspace outbound

```text
workspace-scoped conversation
exact connection lookup
connection workspace match
security tests
```

## Replay

```text
unique(connection_id, update_id)
idempotent worker
idempotent domain commands
```

## Prompt injection

Customer content cannot change:

```text
workspace
connection
permissions
tool allowlist
price
payment truth
outlet authority
```

---

# 30. Emergency Fix

Sebelum permanent architecture selesai:

1. Disable Telegram platform kosong milik Test WS.
2. Stop `findLatestByType` from selecting inbound connections.
3. Use token route only as a temporary emergency workaround.
4. Move webhook to connection-public-ID route immediately after deployment.
5. Rotate token if it entered logs or URLs.
6. Clean test chats created in the wrong workspace.
7. Reject active connection without token/workspace.

Temporary:

```text
/webhook/telegram/<BOT_TOKEN>
```

Permanent:

```text
/webhooks/telegram/v1/<CONNECTION_PUBLIC_ID>
+ X-Telegram-Bot-Api-Secret-Token
```
---

# 31. Migration Plan

## Phase 0 — Audit

```bash
rg -n "findLatestByType" server
rg -n "webhook/telegram" server
rg -n "platformsSupabaseRepository" server
rg -n "telegram.*token|token.*telegram" server
rg -n "channel_connection_id" server web
rg -n "provider_conversation_id" server
```

Dokumentasikan:

```text
inbound route
outbound service
webhook registration worker
platform schema
conversation schema
contact identity schema
message schema
RLS policies
```

## Phase 1 — Additive schema

Tambahkan:

```text
public_id
provider_account_id
credential_ciphertext
credential_fingerprint
webhook_secret_ciphertext
webhook_secret_hash
connection_status
webhook_status
```

Tambahkan `telegram_webhook_events`.

Tambahkan nullable `channel_connection_id` ke:

```text
contact_channel_identities
conversations
messages
```

## Phase 2 — Backfill existing bot

Untuk koneksi SelaluTeh Demo:

```text
load current token securely
→ getMe
→ store provider_account_id
→ generate public ID
→ generate webhook secret
→ encrypt credentials
→ status CONNECTING
```

Jangan menebak bot ID dari username.

## Phase 3 — Backfill conversation

Map:

```text
legacy platform_id
→ channel_connection_id
```

Jika tidak dapat dipastikan:

```text
MIGRATION_REVIEW_REQUIRED
```

Jangan fallback ke Telegram connection terbaru.

## Phase 4 — Deploy route baru

```text
/webhooks/telegram/v1/:connectionPublicId
```

Legacy route tetap ada hanya untuk warning atau `410`.

## Phase 5 — Register ulang webhook

Per active connection:

```text
setWebhook(new URL + secret)
→ getWebhookInfo
→ verify expected URL
→ mark VERIFIED
```

## Phase 6 — Outbound cutover

Semua outbound wajib memakai:

```text
conversation.channel_connection_id
```

Optional feature flag:

```env
TELEGRAM_CONNECTION_BOUND_OUTBOUND=true
```

## Phase 7 — Remove global fallback

Hapus semua:

```ts
findLatestByType({
  type: "telegram",
});
```

dari:

```text
inbound
outbound
welcome
worker
callback
reconciliation
```

## Phase 8 — Enforce constraints

Setelah backfill:

```text
channel_connection_id NOT NULL
```

untuk Telegram rows aktif.

Aktifkan unique constraints.

## Phase 9 — Disable legacy route

```text
410 Gone
```

Setelah observability membuktikan traffic nol, hapus route dan compatibility code.

---

# 32. Rollout Strategy

## Development

Gunakan:

```text
Workspace A: SelaluTeh Demo + Bot A
Workspace B: Test WS + Bot B
```

Target:

```text
dua webhook URL
dua secret
dua token
tenant isolation
```

## Internal alpha

Monitor:

```text
wrong-workspace event = 0
duplicate message = 0
cross-connection outbound = 0
dead-letter
invalid secret
pending backlog
```

## Controlled production

Per workspace:

```text
validate token
register webhook
verify webhook
send inbound test
send outbound test
confirm conversation connection
```

## Full production

```text
remove compatibility fallback
remove token URL
remove legacy platform lookup
```

---

# 33. Automated Test Matrix

## Unit

```text
public ID generator
secret generator
secret hashing and constant-time compare
credential encrypt/decrypt
credential fingerprint
webhook URL builder
connection status transitions
update type detection
error mapping
```

## Repository

```text
exact findActiveByPublicId
workspace-scoped findById
provider bot uniqueness
credential fingerprint uniqueness
insertOnce duplicate update
contact identity connection uniqueness
conversation connection uniqueness
```

## Integration

| Scenario | Expected |
|---|---|
| URL A + secret A | Event stored in Workspace A |
| URL B + secret B | Event stored in Workspace B |
| URL A + secret B | `401`, no event |
| Unknown public ID | `404` |
| Duplicate update on same connection | Processed once |
| Same update ID across A and B | Both accepted |
| Disabled connection | No business processing |
| Conversation A reply | Uses Bot A token |
| Conversation B reply | Uses Bot B token |
| Same bot added to another workspace | Conflict |

## Security

```text
missing secret
wrong secret
forged workspace in payload
forged connection in callback data
cross-workspace conversation lookup
cross-workspace outbound
token redaction
secret redaction
PII logging guard
```

## Concurrency

```text
two duplicate webhook requests
two worker claims
disable during processing
token rotation during outbound
webhook registration race
two workspaces connect same bot
```

## Resilience

```text
database unavailable
Telegram timeout
Telegram 429
Telegram 401
worker crash after partial processing
retry after message insert
getWebhookInfo unavailable
outbox/worker restart
```

---

# 34. Manual Test Plan

## Setup

1. Hubungkan Bot A ke Workspace A.
2. Hubungkan Bot B ke Workspace B.
3. Pastikan public ID, webhook URL, bot ID, dan secret berbeda.
4. Jalankan `getWebhookInfo` untuk keduanya.

## Inbound

1. Kirim `/start` ke Bot A.
2. Pastikan chat hanya muncul di Workspace A.
3. Kirim `/start` ke Bot B.
4. Pastikan chat hanya muncul di Workspace B.
5. Periksa `channel_connection_id`.
6. Pastikan tidak ada global fallback log.

## Outbound

1. Reply dari Workspace A.
2. Pastikan Bot A yang membalas.
3. Reply dari Workspace B.
4. Pastikan Bot B yang membalas.

## Isolation

1. Login owner Workspace A.
2. Coba akses Conversation B.
3. Expected:
   - 404 atau permission denied;
   - tidak ada metadata bocor.

## Duplicate

Replay payload dengan:

```text
same connection
same update_id
```

Expected:

```text
HTTP 200
one event
one message
one business effect
```

## Wrong secret

```text
URL A + secret B
→ 401
→ no stored event
```

---

# 35. Connected Platforms UI

Tampilkan:

```text
Bot username
Telegram bot ID
Workspace
Connection status
Webhook status
Last inbound
Last outbound
Pending updates
Last error
```

Actions:

```text
Connect
Verify
Reconnect Webhook
Rotate Token
Disable
Disconnect
View Diagnostics
```

Diagnostics:

```text
Expected webhook URL
Actual webhook URL
Webhook matches
Bot identity matches
Pending update count
Last Telegram webhook error
Last successful inbound
Last successful outbound
Credential rotation date
```

Jangan tampilkan token atau webhook secret.

---

# 36. Recommended Folder Structure

```text
server/src/modules/channels/
├── domain/
│   ├── channel-connection.ts
│   ├── connection-status.ts
│   └── channel-errors.ts
├── application/
│   ├── connect-telegram-bot.ts
│   ├── disconnect-telegram-bot.ts
│   ├── rotate-telegram-token.ts
│   ├── reconcile-telegram-connection.ts
│   └── send-telegram-message.ts
├── infrastructure/
│   ├── telegram/
│   │   ├── telegram-api-client.ts
│   │   ├── telegram-webhook-controller.ts
│   │   ├── telegram-update-schema.ts
│   │   ├── telegram-update-processor.ts
│   │   └── telegram-credential-crypto.ts
│   ├── repositories/
│   │   ├── channel-connections.repository.ts
│   │   └── telegram-webhook-events.repository.ts
│   └── workers/
│       └── telegram-webhook-event.worker.ts
└── routes/
    └── telegram-webhook.routes.ts
```

Sesuaikan dengan struktur project aktual dan hindari duplicate abstraction.

---

# 37. Environment Variables

```env
PUBLIC_BASE_URL=https://crm-dev.incretlabs.my.id

CHANNEL_CREDENTIAL_ENCRYPTION_KEY=...
CHANNEL_CREDENTIAL_KEY_VERSION=v1
CHANNEL_CREDENTIAL_FINGERPRINT_PEPPER=...

TELEGRAM_WEBHOOK_BODY_LIMIT=2mb
TELEGRAM_WEBHOOK_MAX_ATTEMPTS=8
TELEGRAM_WEBHOOK_RETRY_BASE_MS=1000

TELEGRAM_ALLOWED_UPDATES=message,callback_query
TELEGRAM_CONNECTION_RECONCILIATION_ENABLED=true
```

Jangan gunakan satu global production token sebagai routing source:

```env
TELEGRAM_BOT_TOKEN=...
```

Pada multi-tenant production, token berasal dari exact channel connection.

---

# 38. Acceptance Criteria

Implementasi selesai jika:

1. Setiap bot terikat ke satu active channel connection.
2. Setiap connection terikat ke satu workspace.
3. Webhook URL menggunakan connection public ID.
4. Bot token tidak berada di URL.
5. Request diverifikasi dengan secret header.
6. Tidak ada global `findLatestByType`.
7. Duplicate update diproses sekali.
8. Update ID sama pada dua bot tetap diterima.
9. Contact identity scoped ke connection.
10. Conversation scoped ke connection.
11. Message scoped ke connection.
12. Outbound menggunakan exact conversation connection.
13. Workspace A tidak dapat membaca Workspace B.
14. Bot yang sama tidak aktif di dua workspace.
15. Token encrypted at rest.
16. Token/secret tidak muncul di log.
17. Legacy route tidak melakukan fallback.
18. Rotation dan disconnect tersedia.
19. Reconciliation tersedia.
20. Isolation, idempotency, security, concurrency, resilience, dan E2E tests lulus.

---

# 39. Definition of Done

```text
Exact connection resolution implemented
Per-connection secret verification implemented
Encrypted credential storage implemented
Webhook inbox implemented
Async worker implemented
Connection-scoped contact identity implemented
Connection-scoped conversation implemented
Connection-scoped message implemented
Connection-bound outbound implemented
Global fallback removed
Legacy route disabled
Two-workspace/two-bot E2E passed
Cross-workspace isolation passed
Duplicate update passed
Token rotation passed
Disconnect passed
Monitoring and runbooks available
Documentation updated
```

---

# 40. Final Architecture Statement

```text
Webhook tenant resolution
≠ browser login
≠ newest platform
≠ first enabled platform
≠ global default workspace

Webhook tenant resolution
= exact connection public ID
+ verified per-connection webhook secret
+ connection-owned workspace context
```

Outbound invariant:

```text
Inbound Bot A
→ Connection A
→ Conversation A
→ Outbound Bot A
```

Arsitektur ini menyiapkan SelaluTeh untuk:

```text
multi-account
multi-workspace
multi-bot
multi-outlet
safe channel isolation
```

---

# 41. Official Telegram References

- [Telegram Bot API](https://core.telegram.org/bots/api)
- [Telegram Webhook Guide](https://core.telegram.org/bots/webhooks)
- [Telegram Bot Tutorial — getMe](https://core.telegram.org/bots/tutorial)

Fakta provider yang dipakai:

```text
setWebhook menerima URL webhook
secret_token dikirim melalui X-Telegram-Bot-Api-Secret-Token
Telegram dapat retry request webhook yang gagal
getUpdates tidak digunakan bersamaan dengan webhook aktif
getWebhookInfo menyediakan diagnostics
getMe memvalidasi token dan mengembalikan bot identity
update_id dapat dipakai untuk duplicate detection
```
