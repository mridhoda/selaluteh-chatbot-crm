# Complaints API

## Purpose

Manage complaints created by AI, human agents, or admin dashboard.

## Complaint Status

```txt
open
resolved
dismissed
```

## GET `/api/v1/complaints`

List complaints.

Auth required.

### Query

| Param | Type | Notes |
|---|---|---|
| `status` | string | open/resolved/dismissed |
| `contact_id` | uuid | optional |
| `chat_id` | uuid | optional |
| `platform_type` | string | optional |
| `from` | datetime | optional |
| `to` | datetime | optional |

## GET `/api/v1/complaints/:complaint_id`

Return complaint detail.

Auth required.

## POST `/api/v1/complaints`

Create complaint.

Auth required for dashboard/human. AI-created complaint must pass through service validation.

### Request

```json
{
  "chat_id": "019...",
  "contact_id": "019...",
  "agent_id": "019...",
  "platform_type": "telegram",
  "text": "Customer said the order arrived late.",
  "form_data": {
    "category": "delivery",
    "urgency": "medium"
  }
}
```

## PATCH `/api/v1/complaints/:complaint_id`

Update complaint.

Auth required.

### Request

```json
{
  "status": "resolved",
  "form_data": {
    "resolution": "Apology and replacement sent."
  }
}
```

## DELETE `/api/v1/complaints/:complaint_id`

Auth: owner/super.

Recommended: soft-delete/archive.

## Security Fix Required

Legacy complaint routes must be protected:

```txt
GET /complaints
POST /complaints
PUT /complaints/:id
DELETE /complaints/:id
```

All must become auth + workspace scoped.
