# Import Script Spec — MongoDB to Supabase/Postgres

Dokumen ini menjelaskan script migrasi data dari MongoDB/Mongoose ke Supabase/Postgres.

## Recommended Location

```txt
server/scripts/migrate-mongo-to-supabase/
```

## Inputs

```env
MONGODB_URI=
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
UPLOADS_DIR=
LOCAL_UPLOAD_ROOT=
PUBLIC_FILES_BASE_URL=
DRY_RUN=true
```

Optional:

```env
MIGRATE_FILES=true
REORGANIZE_UPLOADS=false
BACKFILL_PRODUCTS_FROM_AGENT=true
STRICT_MIGRATION=false
```

## Outputs

```txt
migration-report.json
mongo-id-map.json
failed-records.json
file-metadata-report.json
product-backfill-report.json
validation-report.json
```

## Required Steps

1. Connect to MongoDB.
2. Connect to Supabase with service role.
3. Read all required collections.
4. Generate UUID map for every Mongo `_id`.
5. Build workspace map from existing `workspaceId`.
6. Insert rows in dependency order.
7. Scan local files.
8. Insert file metadata rows.
9. Patch file references.
10. Backfill agent child tables.
11. Backfill legacy orders/complaints.
12. Optionally backfill products from agent product data.
13. Run validation counts.
14. Write reports.

## Dry Run Mode

Dry run should read data, generate ID map, validate references, count records, check local file existence, preview product backfill, and not write anything.

Report:

```txt
source counts
target expected counts
missing references
missing files
potential duplicate contacts
potential duplicate messages
unsafe records
```

## Collections to Read

```txt
users
platforms
agents
contacts
chats
messages
orders
complaints
knowledge
otps
passwordresets
settings
```

Actual collection names may differ by Mongoose pluralization. Script should allow mapping.

## ID Map Format

```json
{
  "users": {"665...": "019..."},
  "workspaces": {"665workspace...": "019workspace..."},
  "chats": {"665chat...": "019chat..."}
}
```

Keep stable map during retry.

## Workspace Migration

For every distinct `workspaceId`, create `workspaces` row. Workspace name fallback:

```txt
Owner name + " Workspace"
```

Patch `workspaces.owner_user_id` after users inserted.

## Model Mapping Highlights

Users:

```txt
workspaceId -> workspace_id
passwordHash -> password_hash
planExpiry -> plan_expiry
```

Platforms:

```txt
userId -> owner_user_id
accountId -> account_id
phoneNumberId -> phone_number_id
appSecret -> app_secret
webhookSecret -> webhook_secret
```

Agents nested arrays:

```txt
knowledge[] -> agent_knowledge
database[] -> files + agent_database_files
followUps[] -> agent_followups
complaintFields[] -> agent_complaint_fields
outlets[] -> agent_outlets
salesForms[] -> agent_sales_forms
salesForms.fields[] -> agent_sales_form_fields
salesForms.products[] -> agent_sales_form_products
products[] -> agent_products
```

Contacts unique key:

```txt
workspace_id + platform_type + platform_account_id
```

Messages:

```txt
from -> sender
replyTo -> reply_to
platformMessageId -> platform_message_id
attachment -> attachment legacy JSON + attachment_file_id if file found
```

Orders:

```txt
source = ai_form or admin_manual
form_data = existing formData
payment_status = pending unless proof/metadata says otherwise
```

Do not invent `order_items` unless form data clearly contains item list.

## Optional Product Backfill

Source candidates:

```txt
Agent.products
Agent.salesForms.products
```

Rules:

- Only backfill if names/prices are reliable.
- Create category `Imported Products` if needed.
- Generate unique slug.
- Do not create stock unless source has stock.

## Error Handling

Failed records format:

```json
{
  "collection": "messages",
  "mongoId": "...",
  "reason": "missing chat mapping",
  "record": {}
}
```

Non-critical failures should not stop migration unless `STRICT_MIGRATION=true`.

## Validation

Critical validation:

```txt
messages without chat = 0
chats without contact = 0
orders with invalid workspace = 0
files missing on disk listed
```

Never log raw Telegram tokens, API keys, Supabase service role, or payment keys.
