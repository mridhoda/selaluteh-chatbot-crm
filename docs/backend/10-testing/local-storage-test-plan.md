# Local Storage Test Plan

## Goal

Validate local file storage strategy for chat media, agent files, payment proofs, and product images.

## Storage Layout

Expected folders:

```txt
uploads/chat
uploads/agent-files
uploads/payment-proofs
uploads/product-images
uploads/category-images
uploads/public-assets
uploads/temp
```

## Tests

### Upload

- Valid image upload creates local file.
- Valid document upload creates local file.
- Metadata row created in `files`.
- Relative path is stored, not absolute server path.

### Download/Public Access

- Public file URL resolves if intended.
- Protected file endpoint checks workspace if implemented.
- Missing file returns 404, not server crash.

### Validation

- Oversized file rejected.
- Unsupported MIME type rejected.
- Dangerous filename sanitized.
- Path traversal attempt rejected.

### Migration

- Existing `/files/<filename>` paths can be mapped.
- Migrated files have `files` rows.
- Legacy attachment JSON retained during transition.

### Deployment

- Uploads persist after backend restart.
- Docker volume does not wipe uploads.
- Backup includes upload root.

## Acceptance

- File metadata and file binary stay consistent.
- No absolute local server paths are exposed in DB.
- App fails gracefully if a local file is missing.
