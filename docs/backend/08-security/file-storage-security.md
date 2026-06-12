# File Storage Security

## Local Storage Risk

Local storage is cost-efficient but makes backup, access control, and deployment safety more important.

## Required Controls

- persistent volume for `server/uploads`;
- no deploy step wipes uploads;
- generated filenames;
- path traversal prevention;
- MIME/type validation;
- max file size by category;
- metadata stored in `files` table;
- private files served through authenticated endpoint.

## Folder Access Defaults

```txt
uploads/product-images        public
uploads/category-images       public
uploads/public-assets         public
uploads/chat                  private by default
uploads/agent-files           private
uploads/payment-proofs        private
uploads/temp                  not persisted
```

## Upload Limits

Suggested MVP:

| Type | Max Size |
|---|---:|
| Product image | 5 MB |
| Chat image | 10 MB |
| PDF/document | 20 MB |
| Audio | 25 MB |
| Video | 50 MB |
| Payment proof | 10 MB |

## Protected Media Endpoint

```txt
GET /media/:fileId
```

Must validate:

- authenticated user;
- file exists;
- `file.workspace_id = user.workspace_id`;
- user role/context allows file;
- file path resolves under upload root.

## Dangerous File Types

Disallow by default:

```txt
.exe
.sh
.bat
.cmd
.php
.js uploaded as document unless explicitly allowed
html/svg if unsafe inline rendering is possible
```

## Backup Security

- backup uploads daily;
- protect backup credentials;
- keep database and uploads backups consistent;
- test restore regularly.
