# Storage Context

Dokumen ini menjelaskan context storage untuk AI coding agent.

## Storage Decision

```txt
Structured data -> Supabase/Postgres
Large binary/media -> local server filesystem
File metadata -> Postgres table files
```

Do not move media files into Postgres.

## Local Upload Root

Current app uses:

```txt
server/uploads
```

Recommended env:

```txt
LOCAL_UPLOAD_ROOT=/absolute/path/to/server/uploads
PUBLIC_FILES_BASE_URL=https://your-domain.example/files
```

## Recommended Folder Layout

```txt
uploads/chat
uploads/agent-files
uploads/payment-proofs
uploads/product-images
uploads/category-images
uploads/public-assets
uploads/temp
```

## Files Metadata

Every persisted file should have metadata:

```txt
workspace_id
storage_provider = local
disk = uploads
relative_path
public_path
original_name
stored_name
mime_type
size_bytes
source
created_by
created_at
```

## AI Coding Rules

- Do not store absolute server path in DB.
- Do not assume `/files/<name>` means ownership is safe.
- Validate workspace before returning protected file metadata.
- Add size/type checks for uploads.
- Use `temp` only for temporary downloads.
- Make uploads persistent in Docker/deployment.

## Product Images

Product images for marketplace should use `files` rows with `source = product_image` or compatible enum/source value.
