# Chats API

## Purpose

Inbox, chat history, human replies, takeover, and resolve actions.

## GET `/api/v1/chats`

List chats for workspace inbox.

Auth required.

### Query

| Param | Type | Notes |
|---|---|---|
| `unread_only` | boolean | optional |
| `agent_id` | uuid | filter by AI agent |
| `assignment` | string | `assigned`, `unassigned`, `mine` |
| `status` | string | `open`, `resolved` |
| `platform_type` | string | telegram/whatsapp/instagram |
| `tag` | string | contact tag |
| `search` | string | contact name or last message |
| `from` | datetime | date range |
| `to` | datetime | date range |
| `limit` | number | default 50, max 200 |
| `cursor` | string | pagination |

### Response

```json
{
  "success": true,
  "data": [
    {
      "id": "019...",
      "platform_type": "telegram",
      "contact": {
        "id": "019...",
        "name": "Customer",
        "handle": "@customer"
      },
      "agent": {
        "id": "019...",
        "name": "SelaluTeh Assistant"
      },
      "takeover_by": null,
      "is_escalated": false,
      "status": "open",
      "unread": 2,
      "last_message": {
        "sender": "user",
        "text": "Mau pesan salty caramel",
        "created_at": "2026-06-12T00:00:00Z"
      },
      "last_message_at": "2026-06-12T00:00:00Z"
    }
  ]
}
```

## GET `/api/v1/chats/:chat_id/messages`

Return messages ordered ascending.

Auth required.

### Rules

- Validate chat belongs to user's workspace.
- Reset unread count to 0.
- Limit max 500 messages.
- Include reply target when available.

### Response

```json
{
  "success": true,
  "data": [
    {
      "id": "019...",
      "sender": "user",
      "text": "Halo",
      "attachment_file": null,
      "reply_to": null,
      "platform_message_id": "12345",
      "created_at": "2026-06-12T00:00:00Z"
    }
  ]
}
```

## POST `/api/v1/chats/:chat_id/send`

Human sends message to customer through original platform.

Auth required.

### Request

```json
{
  "text": "Baik kak, pesanan sedang kami cek ya.",
  "reply_to": "019..."
}
```

### Response

```json
{
  "success": true,
  "data": {
    "message_id": "019...",
    "platform_message_id": "provider-message-id"
  }
}
```

### Side Effects

- Insert `messages.sender = human`.
- Send to Telegram/Meta provider.
- Store returned `platform_message_id`.
- Update `chats.last_message_at`.

## POST `/api/v1/chats/:chat_id/takeover`

Human takes over chat and AI stops replying.

Auth required.

### Response

```json
{
  "success": true,
  "data": {
    "chat_id": "019...",
    "takeover_by": "019...",
    "is_escalated": false,
    "status": "open"
  }
}
```

## POST `/api/v1/chats/:chat_id/release`

Release human takeover so AI can reply again.

Auth required.

## POST `/api/v1/chats/:chat_id/resolve`

Resolve conversation.

Auth required.

### Request

```json
{
  "resolution_note": "Order completed."
}
```

## DELETE `/api/v1/chats/:chat_id`

Auth: owner/super.

Recommended: soft-delete or archive for audit safety.
