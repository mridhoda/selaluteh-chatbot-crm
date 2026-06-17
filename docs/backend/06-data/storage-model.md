# Storage Model

Skema baru memakai Supabase/Postgres hanya untuk metadata file. File/media besar tetap berada di local server storage tempat backend berjalan.

## Decision

```txt
Structured relational data -> Supabase Postgres
Large media/binary files   -> Local server filesystem
File metadata/reference    -> Supabase Postgres table `files`
```

## Why

- Supabase Storage bisa mahal untuk chat media, product image, audio, video, PDF, dan document.
- Backend saat ini sudah memakai `server/uploads` dan route `/files`.
- Migrasi database bisa dilakukan tanpa memindahkan seluruh media.
- Biaya storage/bandwidth lebih mudah dikontrol.

## Local Storage Root

Current:

```txt
server/uploads
```

Recommended env:

```env
LOCAL_UPLOAD_ROOT=/absolute/path/to/server/uploads
PUBLIC_FILES_BASE_URL=https://your-domain.example/files
```

Local dev:

```env
LOCAL_UPLOAD_ROOT=server/uploads
PUBLIC_FILES_BASE_URL=http://localhost:5000/files
```

## Folder Layout

| Folder | Purpose | Public Path |
|---|---|---|
| `uploads/chat` | Incoming customer media and human reply attachments | `/files/chat/...` |
| `uploads/agent-files` | Agent database/knowledge files | `/files/agent-files/...` |
| `uploads/product-images` | Product thumbnails/images | `/files/product-images/...` |
| `uploads/payment-proofs` | Manual payment proof images | `/files/payment-proofs/...` |
| `uploads/public-assets` | Stickers/static assets | `/files/public-assets/...` |
| `uploads/ai-generated` | AI generated assets | `/files/ai-generated/...` |
| `uploads/temp` | Temporary downloads | not persisted |

## Path Convention

```txt
<category>/<yyyy>/<mm>/<uuid>-<safe-name>
```

Examples:

```txt
chat/2026/06/019...-photo.jpg
agent-files/2026/06/019...-menu.pdf
product-images/2026/06/019...-salty-caramel.jpg
payment-proofs/2026/06/019...-proof.jpg
```

Never store absolute server paths in DB.

## Files Table

```txt
files
  id uuid
  workspace_id uuid
  storage_provider text
  disk text
  relative_path text
  public_path text
  original_name text
  stored_name text
  mime_type text
  size_bytes bigint
  source file_source
  created_by uuid
  metadata jsonb
  created_at timestamptz
```

## Visibility

Recommended metadata:

```json
{"visibility":"public","width":1200,"height":1200}
```

Visibility values:

```txt
public
workspace_private
system_private
```

Product image: public. Payment proof and chat attachment: workspace_private.

## Message Attachment Migration

Current Mongo:

```json
{"attachment":{"url":"/files/abc.pdf","filename":"abc.pdf"}}
```

Target:

```txt
chat_messages.attachment_file_id -> files.id
```

Migration steps:

1. Parse `/files/<storedName>` from old attachment URL.
2. Locate file under local upload root.
3. Insert `files` metadata row.
4. Set `chat_messages.attachment_file_id`.

## Product Image Upload Flow

```txt
Admin uploads image
-> validate workspace
-> save to uploads/product-images/yyyy/mm
-> insert files row source=product_image
-> set products.thumbnail_file_id
```

## Payment Proof Compatibility

Manual proof can remain optional fallback.

```txt
User sends proof image
-> save under uploads/payment-proofs
-> insert files row source=payment_proof
-> set orders.payment_proof_file_id
```

With payment gateway, paid status should come from webhook, not proof image.

## Backup Requirement

Backup must include:

```txt
Supabase/Postgres backup
server/uploads backup
```

Minimum policy:

- Daily backup of uploads.
- Daily DB backup.
- Keep same-time-window DB and uploads backup.
- Docker deployment must mount uploads as persistent volume.
