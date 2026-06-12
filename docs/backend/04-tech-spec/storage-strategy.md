<!--
Tech Spec Pack: Telegram-first Marketplace Backend
Project: KALIS.AI / eskala-bot evolution
Target: Chatbot CRM + Telegram Marketplace MVP
Generated: 2026-06-11
-->

# Storage Strategy

## Decision

Structured data goes to Supabase/Postgres. Large media stays on local server filesystem for MVP.

```txt
Postgres:
  - file metadata
  - ownership
  - public path
  - references from messages/orders/products

Local storage:
  - images
  - videos
  - audio
  - PDFs
  - documents
  - payment proofs
  - product images
```

## Why Local Storage for MVP

- Existing app already uses `server/uploads`.
- Cheaper than moving all media into Supabase Storage.
- Easier migration from current local files.
- Faster to implement for MVP.

## Environment Variables

```env
LOCAL_UPLOAD_ROOT=/absolute/path/to/server/uploads
PUBLIC_FILES_BASE_URL=https://api.example.com/files
MAX_UPLOAD_MB=25
```

Local dev:

```env
LOCAL_UPLOAD_ROOT=server/uploads
PUBLIC_FILES_BASE_URL=http://localhost:5000/files
```

## Recommended Folder Layout

```txt
server/uploads/
  chat/
    2026/06/...
  agent-files/
    2026/06/...
  payment-proofs/
    2026/06/...
  product-images/
    2026/06/...
  category-images/
    2026/06/...
  public-assets/
    stickers/...
  temp/
```

## Files Table

```txt
files
  id uuid
  workspace_id uuid
  storage_provider text default 'local'
  disk text default 'uploads'
  relative_path text
  public_path text
  original_name text
  stored_name text
  mime_type text
  size_bytes bigint
  source file_source
  created_by uuid null
  created_at timestamptz
```

## Path Convention

```txt
<category>/<yyyy>/<mm>/<uuid>-<safe-name>
```

Examples:

```txt
chat/2026/06/019...-voice.ogg
product-images/2026/06/019...-salty-caramel.png
payment-proofs/2026/06/019...-proof.jpg
```

## Public vs Protected Files

MVP may continue public `/files` serving, but be careful with private attachments.

Future protected endpoint:

```txt
GET /media/:fileId
```

Rules:

1. Authenticate user.
2. Check workspace ownership.
3. Stream file from local disk.

For Telegram customer-facing product images, public URLs are acceptable.

## Product Images

Product image upload should:

1. validate mime type
2. store file under `product-images`
3. insert `files` row
4. insert `product_images` row referencing file id

## Payment Proofs

Manual payment proof should:

1. store under `payment-proofs`
2. insert `files` row
3. link to `payments` or legacy `orders.payment_proof_file_id`
4. require admin approval before paid state

## Backup Policy

Minimum:

- daily backup of `server/uploads`
- daily database backup
- keep DB backup and uploads backup from same time window
- Docker volume must persist uploads
- never deploy by deleting uploads folder

## Validation

Post-migration validation should check:

```sql
select count(*) from files where relative_path is null;
select count(*) from messages where attachment_file_id is not null;
select count(*) from product_images where file_id is null;
```

Also check filesystem existence for every `files.relative_path`.
