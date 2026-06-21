# Location Admin API

Base path: `/api/outlets/:outletId/location`

Semua endpoint memerlukan `authRequired + attachUser + attachWorkspaceContext`.

## POST `/api/outlets/:outletId/location/resolve`

Resolve Maps URL untuk preview. Tidak mengubah data outlet.

**Request:**
```json
{ "url": "https://maps.google.com/?q=-0.5,117" }
```

**Response 200:**
```json
{
  "previewToken": "preview-1718852400000",
  "status": "preview_created",
  "existingLocationUnchanged": true
}
```

## POST `/api/outlets/:outletId/location/confirm`

Confirm preview menjadi canonical outlet location.

**Request:**
```json
{
  "previewToken": "preview-1718852400000",
  "latitude": -0.502106,
  "longitude": 117.153709,
  "formattedAddress": "Jalan Biawan No. 10, Samarinda",
  "providerPlaceId": "ChIJ...",
  "googleMapsUri": "https://maps.google.com/"
}
```

**Response 200:**
```json
{
  "success": true,
  "location": { "id": "...", "outletId": "...", "status": "VERIFIED", ... }
}
```

## POST `/api/outlets/:outletId/location/refresh`

Dry-run refresh. Membandingkan data provider dengan canonical. Tidak mengubah data.

**Response 200:**
```json
{
  "dryRun": true,
  "existing": { ... },
  "proposedChange": null
}
```

## GET `/api/outlets/:outletId/location`

Get canonical location record.

**Response 200:**
```json
{ "outletId": "...", "latitude": -0.502106, "longitude": 117.153709, "status": "VERIFIED", ... }
```

**Response 404:**
```json
{ "error": "Location not found" }
```

## GET `/api/outlets/:outletId/location/history`

Get audit history for location changes.

**Query params:** `page`, `limit`

**Response 200:**
```json
[{ "action": "confirmed", "createdAt": "...", "newSnapshot": { ... } }]
```

---

## Internal API

Base path: `/api/location`

## POST `/api/location/resolve-nearest-outlets`

Resolve nearest outlets from coordinates.

**Request:**
```json
{ "latitude": -0.502106, "longitude": 117.153709 }
```

**Response 200:**
```json
{
  "recommendation": { "outletId": "o1", "name": "SelaluTeh Samarinda", "approximateDistanceMeters": 1200, ... },
  "alternatives": [{ ... }, { ... }]
}
```

---

## AI Tool: `find_nearest_outlet`

Registered in `domain-tools.js`. Read-only, no confirmation required.

**Input:**
```json
{
  "text": "Jalan Biawan Samarinda",
  "latitude": -0.5,
  "longitude": 117.15
}
```

**Output:**
```json
{
  "flowId": "flow-...",
  "status": "RESOLVED",
  "recommendation": { ... },
  "alternatives": [{ ... }, { ... }]
}
```
