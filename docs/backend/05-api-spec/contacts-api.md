# Contacts API

## Purpose

Manage customer profiles created from Telegram/WhatsApp/Instagram interactions.

## GET `/api/v1/contacts`

List contacts in workspace.

Auth required.

### Query

| Param | Type | Notes |
|---|---|---|
| `platform_type` | string | optional |
| `tag` | string | optional |
| `search` | string | name, handle, platform account id |
| `last_seen_from` | datetime | optional |
| `last_seen_to` | datetime | optional |

### Response

```json
{
  "success": true,
  "data": [
    {
      "id": "019...",
      "name": "Customer",
      "platform_type": "telegram",
      "platform_account_id": "1234567",
      "handle": "@customer",
      "last_seen": "2026-06-12T00:00:00Z",
      "tags": ["vip"],
      "notes": "Likes caramel drinks."
    }
  ]
}
```

## GET `/api/v1/contacts/:contact_id`

Return contact detail with recent chats/orders.

Auth required.

## PATCH `/api/v1/contacts/:contact_id`

Update customer metadata.

Auth required.

### Request

```json
{
  "name": "Customer Name",
  "tags": ["vip", "telegram"],
  "notes": "Prefers pickup."
}
```

## Merge Contact — Future

Optional future endpoint:

```http
POST /api/v1/contacts/:contact_id/merge
```

Not required for MVP.

## Unique Rule

Webhook upsert must avoid duplicates by:

```txt
workspace_id + platform_id + external_id
```
