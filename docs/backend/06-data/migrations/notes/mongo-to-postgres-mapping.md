# Mongo to Postgres Mapping — v2

This document maps the current MongoDB/Mongoose CRM schema to the updated Supabase/Postgres schema with marketplace support.

## Naming

| Mongo | Postgres |
|---|---|
| `_id` | `id` |
| `workspaceId` | `workspace_id` |
| `userId` | `owner_user_id` |
| `platformId` | `platform_id` |
| `agentId` | `agent_id` |
| `contactId` | `contact_id` |
| `chatId` | `chat_id` |
| `takeoverBy` | `takeover_by` |
| `isEscalated` | `is_escalated` |
| `lastMessageAt` | `last_message_at` |
| `platformType` | `platform_type` |
| `platformAccountId` | `platform_account_id` |
| `platformMessageId` | `platform_message_id` |
| `replyTo` | `reply_to` |
| `createdAt` | `created_at` |
| `updatedAt` | `updated_at` |

## ID Strategy

Do not reuse Mongo ObjectId strings as UUID.

Use a deterministic mapping during import:

```txt
collection + mongo _id -> generated uuid
```

Persist the mapping as:

```txt
mongo-id-map.json
```

or temporary staging table:

```txt
mongo_id_map(collection text, mongo_id text, postgres_id uuid)
```

## Workspace Creation

Current Mongo has no explicit `workspaces` collection.

Build `workspaces` from distinct `users.workspaceId`.

Owner rule:

1. Prefer user with role `owner` in the workspace.
2. If missing, pick earliest user and flag in migration report.
3. Patch `workspaces.owner_user_id` after users are inserted.

## Core Models

| Mongoose Model | Target Table(s) | Notes |
|---|---|---|
| `User` | `users`, `workspaces` | Custom password auth preserved through `password_hash` |
| `Platform` | `platforms` | Tokens should be rotated/encrypted after migration |
| `Agent` | `agents` + child tables | Nested arrays are normalized |
| `Contact` | `contacts` | Upsert key: `workspace_id + platform_type + platform_account_id` |
| `Chat` | `chats` | Preserve `takeover_by`, `is_escalated`, `status`, `state` |
| `Message` | `messages`, `files` | Preserve ordering via `created_at` |
| `Order` | `orders` | Old AI orders become `source = ai_form` |
| `Complaint` | `complaints` | Must become workspace scoped |
| `Knowledge` | `knowledge_files`, `files` | Store file metadata only |
| `OTP` | `otps` | Expired records may be skipped |
| `PasswordReset` | `password_resets` | Expired records may be skipped |
| `Setting` | `settings` | One per workspace |

## Agent Nested Data

| Mongo path | Target |
|---|---|
| `agent.knowledge[]` | `agent_knowledge` |
| `agent.followUps[]` | `agent_followups` |
| `agent.database[]` | `agent_database_files` + `files` |
| `agent.complaintFields[]` | `agent_complaint_fields` |
| `agent.outlets[]` | `agent_outlets` |
| `agent.salesForms[]` | `agent_sales_forms` + child tables |
| `agent.products[]` | `agent_products` legacy table; optionally copy into new `products` table |
| `agent.payment` | `agents.payment_*` columns for legacy manual payment |
| `agent.complaintNotification` | `agents.complaint_notification_*` columns |

## Existing Orders

Current AI-generated orders use flexible form data.

Map them to:

```txt
orders.source = 'ai_form'
orders.form_name = old form name
orders.form_data = old formData
orders.status = mapped old status
orders.payment_proof_file_id = mapped file id if available
orders.payment_proof_url = old proof URL if available
```

Do not create `order_items` for old AI form orders unless product/quantity can be confidently parsed.

## Marketplace Products

If current `agent.products[]` are used as sellable products, migrate them in two ways:

1. Preserve raw data in `agent_products` for backward compatibility.
2. Optionally create rows in `products` with:

```txt
name -> products.name
price -> products.base_price
image_url -> file metadata if local or public URL metadata
status -> active
source metadata -> { "from": "agent.products" }
```

## Message Attachment

Current shape:

```json
{
  "url": "/files/filename.ext",
  "filename": "filename.ext"
}
```

Target:

```txt
files row
messages.attachment_file_id
messages.attachment legacy jsonb retained temporarily
```

File binary remains on local server storage.

## Payment Data

Old manual payment proof stays on orders:

```txt
orders.payment_proof_file_id
orders.payment_proof_url
```

New gateway payment data uses:

```txt
payments
payment_events
webhook_events
```

## Webhook Idempotency

Create `webhook_events` for incoming Telegram/Meta/payment events.

Recommended external ids:

| Provider | External Event ID |
|---|---|
| Telegram | `update_id` |
| WhatsApp | message id or webhook object id + timestamp fallback |
| Instagram | message id |
| Midtrans | `order_id + transaction_id + transaction_status` fallback |
| Xendit | event id from header/body |
