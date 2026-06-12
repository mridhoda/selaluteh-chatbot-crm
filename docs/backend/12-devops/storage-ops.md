# Storage Operations

## Storage Strategy

Structured data:

```txt
Database
```

Large files:

```txt
Local server filesystem
```

File metadata:

```txt
files table
```

## Important Directories

Recommended local storage:

```txt
server/uploads/chat
server/uploads/agent-files
server/uploads/payment-proofs
server/uploads/product-images
server/uploads/category-images
server/uploads/public-assets
server/uploads/temp
```

## Operational Rules

- Upload directory must be persistent.
- Docker deployment must mount uploads as volume.
- Backups must include uploads.
- Do not deploy in a way that wipes uploads.
- Do not store absolute paths in DB.
- Store relative path and public path.

## Disk Monitoring

Alert if:

- disk usage > 85%
- upload failures spike
- backup fails
- missing file rate increases

## Restore

To restore files:

1. Stop backend writes.
2. Restore uploads backup.
3. Restore database backup from same time window.
4. Verify file paths.
5. Open sample chat attachment.
6. Open sample payment proof/product image.

## Future Protected Media

Public `/files` is simple but less secure.

Future endpoint:

```txt
GET /media/:fileId
```

Should:

- authenticate user
- check workspace
- stream file
