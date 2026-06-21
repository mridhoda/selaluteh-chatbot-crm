# Location Intelligence — Data Model

## `outlet_locations` Table

| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | `gen_random_uuid()` |
| `workspace_id` | UUID FK → workspaces | NOT NULL, CASCADE DELETE |
| `outlet_id` | UUID FK → outlets | NOT NULL, CASCADE DELETE |
| `provider` | TEXT | Default `'google'` |
| `provider_place_id` | TEXT? | OSM ID atau Google Place ID |
| `source_url` | TEXT? | Maps URL asal |
| `google_maps_uri` | TEXT? | Canonical Maps link |
| `display_name` | TEXT? | Nama tampilan |
| `formatted_address` | TEXT | NOT NULL |
| `city` | TEXT? | |
| `province` | TEXT? | |
| `country_code` | TEXT | Default `'ID'` |
| `postal_code` | TEXT? | |
| `latitude` | DOUBLE PRECISION | NOT NULL |
| `longitude` | DOUBLE PRECISION | NOT NULL |
| `location_source` | TEXT | `provider_resolved` / `manual_adjustment` |
| `status` | TEXT | `UNRESOLVED` → `RESOLVED` → `VERIFIED` / `NEEDS_REVIEW` / `INVALID` |
| `confidence` | TEXT? | `high` / `medium` / `low` |
| `resolver_version` | TEXT | Default `'1.0.0'` |
| `location_version` | TEXT | Untuk optimistic concurrency |
| `resolved_at` | TIMESTAMPTZ? | |
| `verified_at` | TIMESTAMPTZ? | |
| `last_verification_at` | TIMESTAMPTZ? | |
| `next_verification_at` | TIMESTAMPTZ? | |
| `created_at` | TIMESTAMPTZ | `NOW()` |
| `updated_at` | TIMESTAMPTZ | `NOW()` |

**Unique**: `(workspace_id, outlet_id)`

**Indexes**: `(workspace_id, status)`, `(next_verification_at)` partial where `VERIFIED`

## `outlet_location_history` Table

| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `outlet_location_id` | UUID FK → outlet_locations | CASCADE DELETE |
| `actor_user_id` | UUID FK → users? | |
| `action` | TEXT | `confirmed` / `manual_adjustment` / `refreshed` / `needs_review` / `review_accepted` / `review_rejected` / `restored` / `automatic_update` |
| `old_snapshot` | JSONB? | |
| `new_snapshot` | JSONB? | |
| `distance_change_meters` | DOUBLE PRECISION? | |
| `review_status` | TEXT? | |
| `resolver_version` | TEXT? | |
| `metadata` | JSONB? | |
| `created_at` | TIMESTAMPTZ | `NOW()` |

## Location Flow State (In-Memory)

Disimpan di `flow-repository.js` (Map), bukan di database. Fields:

- `flowId`, `workspaceId`, `contactId`, `chatId`, `sessionId`
- `inputType`: `text` / `structured_fields` / `shared_coordinates` / `google_maps_url` / `candidate_selection`
- `street`, `area`, `city`, `province`, `landmark`, `placeName`, `postalCode`, `normalizedQuery`
- `status`: `EMPTY` → `MISSING_CITY` / `MISSING_DETAIL` → `READY_TO_RESOLVE` → `RESOLVING` → `AMBIGUOUS` / `READY_TO_CALCULATE` → `RESULTS_READY` → `CONFIRMING_OUTLET` → `CONFIRMED`
- `protectedLatitude`, `protectedLongitude` — tidak pernah disimpan sebagai durable memory
- `candidateIds`, `recommendedOutletId`, `alternativeOutletIds`
- `lastMessageId` — idempotency key
- `expiresAt` — 30 menit TTL

## Coordinate Value Object

Immutable `class Coordinate { latitude, longitude }` dengan range validation:
- `latitude`: -90 to 90
- `longitude`: -180 to 180
- NaN, Infinity → throw

## Haversine Distance

`EARTH_RADIUS_METERS = 6371000`

Pure function `haversineDistance(lat1, lng1, lat2, lng2)` digunakan sebagai fallback karena PostGIS tidak tersedia.
