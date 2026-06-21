# Location Intelligence — Business Rules

## LINT-R1: Input berasal dari customer
Location input hanya dari pesan customer (TEXT, SHARED_COORDINATES, GOOGLE_MAPS_URL, atau CANDIDATE_SELECTION). Input tidak bisa bersumber dari model/AI.

## LINT-R2: Temporary flow, bukan durable
Location flow state bersifat temporary (30 menit TTL). Location data dihapus setelah CONFIRMED, CANCELLED, atau EXPIRED. Customer coordinates tidak disimpan sebagai durable memory.

## LINT-R3: Multi-turn progressive
Flow mengakumulasi informasi dari beberapa pesan: street, area, city, landmark. Field tidak timpa kecuali eksplisit koreksi.

## LINT-R4: Hanya kota dengan outlet VERIFIED yang didukung
Supported cities = tempat yang punya minimal 1 outlet active + pickupEnabled + not deleted + VERIFIED location.

## LINT-R5: Provider abstraction
Semua provider Google Maps / Nominatim diakses melalui interface `{ geocodeText, searchPlaces, getPlaceDetails, resolveMapsUrl, getDirections, health }`.

## LINT-R6: Provider adalah resolver, bukan validator
Provider geocode/places mengembalikan kandidat. Backend-lah yang memvalidasi city match, confidence, eligibility.

## LINT-R7: Place search untuk landmark, geocode untuk alamat
Pisah strategi: `street`/`postal_code` → geocode, `landmark`/`place_name`/`building` → place_search.

## LINT-R8: Shared coordinates tidak melalui geocoding
Koordinat yang dibagikan langsung diproses ke nearest outlet, tanpa geocode/place search.

## LINT-R9: Maps URL harus diverifikasi
Hanya host tertentu (google.com, goo.gl) diizinkan. URL di-resolve, redirect dibatasi maksimal 5. Private IP / SSRF diblokir.

## LINT-R10: Admin location update via preview → confirm
Admin tidak bisa langsung set location. Harus: resolve → preview → confirm. Pakai optimistic concurrency (expectedOutletVersion).

## LINT-R11: Outlet location adalah canonical resource
Semua display, nearest, route menggunakan `outlet_locations` table. Ada status lifecycle: UNRESOLVED → RESOLVED → VERIFIED / NEEDS_REVIEW / INVALID.

## LINT-R12: VERIFIED adalah satu-satunya status eligible
Outlet hanya bisa jadi nearest / direkomendasikan kalau location status = VERIFIED.

## LINT-R13: Ambiguous → tanya user
Kalau provider return multiple candidates atau city tidak match, flow masuk AMBIGUOUS atau OUTSIDE_SUPPORTED_CITY. AI tidak boleh pilih otomatis.

## LINT-R14: Eligibility predicate deterministik
`isOutletEligible(outlet)` = `active && pickupEnabled && !deletedAt && !operationallyDisabled && locationStatus === 'VERIFIED' && validCoordinates`.

## LINT-R15: Haversine untuk nearest
Karena PostGIS tidak tersedia, haversine distance adalah default untuk nearest outlet calculation.

## LINT-R16: Open outlet preference
Dalam 3km tolerance, open outlet dipromosikan ke rank #1 dengan `rankReason: 'nearest_open'`. Kalau semua closed, urut berdasarkan distance.

## LINT-R17: Service radius 25km default
Outlet di luar radius punya `withinServiceRadius: false`. Radius bisa dikonfigurasi per outlet group / city / workspace.

## LINT-R18: Recommendation + 2 alternatives
Nearest result selalu return 1 recommendation + maksimal 2 alternatif.

## LINT-R19: Maps link tanpa API key
`maps-link-builder.js` buat link `maps.google.com` biasa, tanpa API key.

## LINT-R20: Confirmation flow
Customer bisa confirm: `"ya"` → revalidate outlet → marketplace select. Alternatif: `"pilih yang kedua"` → select alt.

## LINT-R21: 30 menit session
Location flow memiliki TTL 30 menit. Setelah itu expired dan harus mulai dari awal.

## LINT-R22: Cache provider-aware
Resolved-text cache TTL 7 hari. Not-found cache TTL 10 menit. Supported city cache TTL 5 menit.

## LINT-R23: Rate limit
Customer resolution: 5/10menit. Customer directions: 10/10menit. Admin resolution: 20/10menit.

## LINT-R24: SSRF guard di semua Maps URL
Approved hosts: `google.com`, `www.google.com`, `maps.google.com`, `maps.app.goo.gl`, `goo.gl`. Blok: localhost, 127.0.0.1, 10.x, 192.168.x, 169.254.x, ::1, fc00::, fe80::.

## LINT-R25: Error code stable
Semua error punya kode `LOCATION_*` yang stable. Customer error pakai Bahasa Indonesia.

## LINT-R26: No provider call untuk incomplete input
Kalau missing city atau detail, langsung return clarification tanpa ke provider.

## LINT-R27: Optimistic concurrency untuk admin confirm
Admin confirm pakai `expectedOutletVersion`. Kalau version conflict → tolak.

## LINT-R28: Prompt injection guard
Input lokasi discan: abaikan, ignore, tampilkan, jangan, lupakan → instruction excluded dari query.

## LINT-R29: Audit history
Setiap confirm / refresh / review tercatat di `outlet_location_history`.

## LINT-R30: 513 tests, 0 fail
Semua lokasi unit test harus pass sebelum release.
