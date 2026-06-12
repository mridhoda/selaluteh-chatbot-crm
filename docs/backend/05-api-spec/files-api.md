# Files API

## Purpose

Handle local file metadata, uploads, and safe access to media.

Decision:

```txt
Binary file -> local filesystem
Metadata -> Supabase/Postgres files table
```

## POST `/api/v1/files`

Upload file.

Auth required for dashboard uploads.
Content-Type: multipart/form-data.

### Form Fields

| Field | Required | Notes |
|---|---|---|
| `file` | yes | binary file |
| `source` | yes | `crm_upload`, `agent_database`, `payment_proof`, `product_image` |
| `related_type` | no | product/agent/message/order |
| `related_id` | no | uuid |

### Response

```json
{
  "success": true,
  "data": {
    "id": "019...",
    "storage_provider": "local",
    "disk": "uploads",
    "relative_path": "product-images/2026/06/019-photo.jpg",
    "public_path": "/files/product-images/2026/06/019-photo.jpg",
    "original_name": "photo.jpg",
    "mime_type": "image/jpeg",
    "size_bytes": 120000,
    "source": "product_image"
  }
}
```

## GET `/api/v1/files/:file_id`

Return metadata.

Auth required.

## GET `/media/:file_id`

Future protected media endpoint.

Auth required.

Behavior:

1. Validate user workspace.
2. Validate file workspace.
3. Stream file from local filesystem.

## Public Static Route

Legacy/current route may remain:

```txt
GET /files/<relative_path>
```

This is simpler but public. Use for MVP if media is not sensitive. For private files, migrate to `/media/:file_id`.

## DELETE `/api/v1/files/:file_id`

Auth: owner/super.

Rules:

- Do not delete if referenced by message/order/product unless explicit force flag is accepted.
- Prefer mark as deleted and remove physical file asynchronously.

## Upload Limits

Recommended defaults:

| Type | Max Size |
|---|---:|
| image | 5 MB |
| audio | 20 MB |
| video | 50 MB |
| pdf/document | 20 MB |

## Storage Categories

```txt
chat/
agent-files/
payment-proofs/
product-images/
category-images/
public-assets/
temp/
```
