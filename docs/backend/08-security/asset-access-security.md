# Asset Access Security

## Storage Model

System uses hybrid storage:

```txt
Structured data -> Supabase/Postgres
Large binaries   -> local server filesystem
Metadata         -> files table
```

Examples:

```txt
chat attachments
agent knowledge files
payment proof images
product images
public assets
```

## Public vs Private Assets

| Asset Type | Default Access | Notes |
|---|---|---|
| Product images | Public | Can be served via `/files/product-images/...` |
| Category images | Public | Public catalog images |
| Static stickers/assets | Public | No customer data |
| Chat attachments | Private | Should require workspace access |
| Payment proofs | Private | Sensitive financial/customer data |
| Agent database files | Private | May contain business data |
| Uploaded documents | Private | Use protected endpoint |

## Recommended Access Strategy

Phase 1 may keep existing `/files` public route for compatibility.

Target strategy:

```txt
Public assets:
  GET /files/public-assets/...
  GET /files/product-images/...

Private assets:
  GET /media/:fileId
```

`/media/:fileId` must:

1. authenticate user;
2. load file metadata;
3. validate `files.workspace_id = current_user.workspace_id`;
4. validate role/context;
5. stream file from local disk.

## Filename Safety

Use generated filenames:

```txt
<category>/<yyyy>/<mm>/<uuid>-<safe-name.ext>
```

Never use raw original filename as path.

Prevent:

```txt
../../etc/passwd
..\..\secret.env
file with null byte
```

## MIME Type Rules

Validate using both extension and actual MIME when possible.

Allowed by category:

| Category | Allowed |
|---|---|
| Product image | jpg, jpeg, png, webp |
| Chat image | jpg, jpeg, png, webp |
| Chat document | pdf, docx, xlsx, txt |
| Audio | mp3, wav, ogg, m4a |
| Video | mp4, webm |
| Payment proof | jpg, jpeg, png, pdf |

## Sensitive Asset Logging

Do not log full private URLs or local absolute paths.

Good:

```txt
file_id=019... source=payment_proof
```

Bad:

```txt
/var/www/app/uploads/payment-proofs/customer-ktp.jpg
```

## Backup Requirement

Because media remains local, backup must include:

```txt
database backup
uploads backup
same-time-window consistency
```
