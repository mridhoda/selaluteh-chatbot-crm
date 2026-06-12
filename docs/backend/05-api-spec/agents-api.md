# Agents API

## Purpose

Manage AI agent configurations connected to platforms.

Agents currently power CRM chatbot replies and should also support marketplace assistant behavior.

## GET `/api/v1/agents`

List agents in current workspace.

Auth required.

### Query

| Param | Type | Notes |
|---|---|---|
| `platform_id` | uuid | optional |
| `enabled` | boolean | optional |

## GET `/api/v1/agents/:agent_id`

Return full agent configuration.

Auth required.

## POST `/api/v1/agents`

Create AI agent.

Auth: owner/super.

### Request

```json
{
  "name": "SelaluTeh Assistant",
  "platform_id": "019...",
  "welcome_message": "Halo! Mau pesan apa hari ini?",
  "behavior": "Friendly Indonesian customer service assistant.",
  "prompt": "You help customers browse products and checkout safely.",
  "enabled": true
}
```

## PATCH `/api/v1/agents/:agent_id`

Update agent.

Auth: owner/super.

### Request

```json
{
  "welcome_message": "Halo kak, ada yang bisa dibantu?",
  "behavior": "Warm, concise, helpful.",
  "enabled": true
}
```

## DELETE `/api/v1/agents/:agent_id`

Auth: owner/super.

Recommended: soft-disable if agent has historical chats.

## POST `/api/v1/agents/:agent_id/test`

Test agent reply without sending to external platform.

Auth required.

### Request

```json
{
  "message": "Ada menu salty caramel?",
  "context": {
    "platform_type": "telegram"
  }
}
```

### Response

```json
{
  "success": true,
  "data": {
    "reply": "Ada kak! Salty Caramel tersedia...",
    "ai_actions": [
      {
        "type": "search_product",
        "status": "proposed"
      }
    ]
  }
}
```

## POST `/api/v1/agents/:agent_id/files`

Upload agent knowledge/database file.

Auth: owner/super.
Content-Type: multipart/form-data.

Writes:

```txt
files
agent_database_files
```

## Agent Commerce Rules

AI agent may propose:

```txt
search_product
show_product_detail
add_to_cart
view_cart
start_checkout
check_order_status
handoff_to_human
```

AI agent must not directly:

```txt
mark payment paid
change payment amount
create order without confirmation
bypass backend validation
access other workspace data
```
