# Location Intelligence — Flows

## 1. Customer Text Location (Happy Path)

```text
Customer: "Jalan Biawan Samarinda"
  → flow-coordinator.handleTextInput()
  → parse: { street: "Jalan Biawan", city: "Samarinda" }
  → evaluateCompleteness: READY_TO_RESOLVE
  → resolve via Nominatim
  → findNearestOutlets via Haversine
  → return { recommendation, alternatives }
  → store in flow state
```

## 2. Progressive Clarification

```text
Customer: "Jalan Biawan" (no city)
  → evaluateCompleteness: MISSING_CITY
  → return clarificationCode: ASK_CITY

Customer: "Samarinda"
  → merge: street preserved, city added
  → evaluateCompleteness: READY_TO_RESOLVE
  → resolve → nearest → results
```

## 3. Shared Coordinates

```text
Customer: share location (Telegram/WhatsApp)
  → flow-coordinator.handleCoordinates()
  → normalizeSharedCoordinates: { latitude, longitude }
  → set status: READY_TO_CALCULATE
  → findNearestOutlets
  → return nearest results
  → coordinates disimpan sebagai protected fields, bukan durable memory
```

## 4. Ambiguous / Not Found

```text
Provider return multiple candidates
  → status: AMBIGUOUS
  → return up to 3 candidates
  → Customer choose: "pilih yang pertama"
  → matchConfirmationInput → select:0 → continue to nearest

Provider return no candidates
  → status: NOT_FOUND
  → clarification: "Lokasi tidak ditemukan. Coba tambahkan detail lain"
```

## 5. Unsupported City

```text
Customer's city is not in supported cities
  → status: OUTSIDE_SUPPORTED_CITY
  → return daftar supported cities
  → Customer bisa pilih kota lain
```

## 6. Cancellation / Restart

```text
Customer: "batal" / "ganti lokasi" / "cari lokasi lain" / "ulang dari awal"
  → matchCancellationCommand → true
  → clear flow state
  → start new flow
```

## 7. Confirmation

```text
Flow: RESULTS_READY → CONFIRMING_OUTLET
  → customer: "ya"
  → matchConfirmationInput → confirm
  → revalidateConfirmation (check outlet aktif, pickup, verified)
  → marketplace select outlet
  → set status: CONFIRMED

Customer: "pilih yang kedua"
  → matchConfirmationInput → select:1
  → select alternative outlet
  → CONFIRMED

Customer: "batal" / timeout
  → CONFIRMING_OUTLET → CANCELLED / EXPIRED
```

## 8. Admin Preview → Confirm (Outlet Location)

```text
Admin: resolve Maps URL untuk outlet
  → POST /api/outlets/:id/location/resolve
  → secure URL resolver (SSRF guard)
  → provider getPlaceDetails
  → return previewToken

Admin: confirm
  → POST /api/outlets/:id/location/confirm { previewToken, expectedVersion }
  → validate previewToken
  → optimistic concurrency check (expectedOutletVersion)
  → save to outlet_locations table (status: VERIFIED)
  → add history entry
  → return { success: true, location }

Admin: refresh
  → POST /api/outlets/:id/location/refresh
  → fetch provider details
  → compare to canonical
  → dry-run output (no mutation)
```

## 9. Verification (Scheduled)

```text
Setiap 12 bulan:
  → query outlet_locations WHERE next_verification_at <= NOW()
  → re-resolve via provider
  → compare coordinates
  → if change > 50m: status = NEEDS_REVIEW
  → admin review → accept (re-verify) / reject (keep old)
```
