# Storage Rules

## Purpose

Defines rules for local media storage and file metadata.

## Storage Decision

Structured data belongs in Supabase/Postgres.

Large binary media stays in local server storage.

```txt
Postgres: metadata/reference
Local filesystem: actual files
```

## File Table

Every persisted file should have metadata row:

```txt
files.id
files.workspace_id
files.storage_provider
files.disk
files.relative_path
files.public_path
files.original_name
files.stored_name
files.mime_type
files.size_bytes
files.source
files.created_by
files.created_at
```

## Allowed File Sources

Recommended sources:

```txt
platform_inbound
crm_upload
agent_database
payment_proof
product_image
category_image
ai_generated
external_download
public_asset
```

## Folder Layout

Recommended local layout:

```txt
uploads/chat
uploads/agent-files
uploads/payment-proofs
uploads/product-images
uploads/category-images
uploads/public-assets
uploads/temp
```

## Path Rule

Store relative path only.

Allowed:

```txt
chat/2026/06/uuid-photo.jpg
```

Rejected:

```txt
/home/server/app/uploads/chat/photo.jpg
C:\server\uploads\photo.jpg
```

Reason: server migration should not require rewriting DB absolute paths.

## Public Access Rule

MVP may serve files through `/files/...` publicly if existing behavior depends on it.

For sensitive files, future protected endpoint recommended:

```txt
GET /media/:fileId
```

Protected endpoint must check auth and workspace ownership.

## Payment Proof Rule

Payment proof images are sensitive operational media.

Rules:

- store in `payment-proofs` folder
- associate with workspace
- do not let AI mark payment paid based only on proof
- admin review required for manual payment

## Product Image Rule

Product images can be public if product is public/active.

But file metadata must still be workspace-scoped.

## Upload Validation

Backend must validate:

- file size
- mime type
- extension if needed
- source category
- workspace ownership

## Backup Rule

Local media backup must be coordinated with DB backup.

Minimum:

```txt
daily uploads backup
daily database backup
backup timestamps close enough for restore consistency
```

Docker deployment must mount uploads as persistent volume.
