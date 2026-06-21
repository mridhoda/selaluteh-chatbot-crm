---
schema_version: 1
document_type: requirements
spec_id: selaluteh-location-intelligence
title: SelaluTeh Location Intelligence and Nearest Outlet Requirements
status: draft
version: 1.0.0
updated_at: 2026-06-20
---

# Requirements Document: SelaluTeh Location Intelligence and Nearest Outlet

## Introduction

Dokumen ini mendefinisikan kebutuhan khusus untuk **Location Intelligence and Nearest Outlet** pada SelaluTeh / KALIS.AI.

Spec ini berdiri sendiri dan tidak digabungkan dengan:

```text
selaluteh-ai-agent-architecture
selaluteh-ai-agent-scope-security
selaluteh-backend-marketplace
```

External authority:

```text
AI Agent Architecture
→ agent runtime, tool calling, conversation state, human takeover

AI Agent Scope Security
→ location request business scope dan tool gating

Backend Marketplace
→ workspace, outlet, cart, order, selected outlet authority
```

Spec ini hanya mengatur:

```text
text-first customer location
progressive clarification
temporary location context
Google Maps/provider adapter
admin Google Maps URL resolver
canonical outlet coordinates
nearest outlet calculation
service radius
Google Maps link
optional directions
privacy
cache
rate limiting
SSRF protection
observability
testing
```

Prinsip utama:

```text
Customer tidak wajib Share Location.
Text location adalah default.
City wajib diketahui.
City tidak boleh ditebak.
Customer location bersifat sementara.
Outlet coordinates adalah canonical business data.
AI hanya mendapat controlled location tools.
Customer wajib mengonfirmasi outlet sebelum selected_outlet_id disimpan.
```

---

# 1. Product Decisions

1. Spec mencakup customer location tools dan admin outlet location resolver.
2. Provider architecture menggunakan adapter; Google Maps Platform aktif pada MVP.
3. Input customer mendukung street, area, landmark, place name, postal code, Google Maps URL, dan shared coordinates.
4. MVP dibatasi ke kota yang memiliki eligible outlet; future target seluruh Indonesia.
5. Kota dari turn sebelumnya boleh dipakai selama active location flow.
6. Pending location berlaku sampai outlet dipilih, flow dibatalkan, atau 30 menit tidak aktif.
7. Raw chat message mengikuti chat retention; resolved coordinates tidak menjadi durable memory.
8. Default nearest ranking memakai Haversine/PostGIS geographic distance.
9. Default response hanya memberi Google Maps place link; directions/route hanya jika customer meminta.
10. Hasil: satu rekomendasi dan maksimum dua alternatif.
11. Outlet harus active, pickup-enabled, not deleted, workspace-matched, dan location VERIFIED.
12. High-confidence single candidate boleh lanjut; medium/low atau multi-candidate harus klarifikasi.
13. Kota saja meminta street/area/landmark; provinsi saja meminta kota.
14. Default service radius 25 km, configurable.
15. Customer confirmation wajib sebelum selected_outlet_id/cart/checkout.
16. Admin paste Google Maps URL → preview → optional pin adjustment → confirm → persist.
17. Manual refresh tersedia; scheduled verification direkomendasikan setiap 12 bulan.
18. Cache default: resolved 7 hari, ambiguous 1 jam, failed 10 menit, route 10 menit.
19. Rate limit default: 5 resolutions/10 menit dan 10 route calls/10 menit per customer/chat.
20. Spec ID: `selaluteh-location-intelligence`; requirement prefix: `LINT-R`.

---

# 2. Scope

## Included

```text
text location parsing
progressive location collection
temporary location state
supported outlet city filtering
provider adapter
Google geocoding and Places
shared coordinates
customer Google Maps URL
admin Google Maps URL resolver
canonical outlet location
manual pin adjustment
location verification
nearest outlet calculation
opening-status preference
service radius
Google Maps place link
optional directions
customer confirmation
privacy
cache
rate limiting
SSRF protection
tool contracts
observability
TDD
```

## Deferred

```text
Indonesia-wide unsupported-city search
multi-provider production fallback
public transit
motorcycle-specific routing
saved customer addresses
delivery
service polygons
advanced traffic ranking
```

## Excluded

```text
unrestricted internet/browser tool
generic URL fetch
general web search
AI orchestration redesign
scope-security redesign
outlet/cart/order/payment redesign
durable customer address memory
continuous location tracking
automatic outlet selection
Google Maps HTML scraping
```

---

# 3. Requirement Summary

| ID | Requirement | Priority |
|---|---|---|
| LINT-R1 | Text-First Customer Location | P0 |
| LINT-R2 | Progressive Location Collection | P0 |
| LINT-R3 | Temporary Location Context | P0 |
| LINT-R4 | Supported Outlet City Scope | P0 |
| LINT-R5 | Location Provider Adapter | P0 |
| LINT-R6 | Text Location Resolution | P0 |
| LINT-R7 | Landmark and Place Search | P0 |
| LINT-R8 | Shared Coordinates Input | P0 |
| LINT-R9 | Customer Google Maps Link Input | P1 |
| LINT-R10 | Admin Google Maps URL Resolver | P0 |
| LINT-R11 | Canonical Outlet Location | P0 |
| LINT-R12 | Outlet Location Verification | P0 |
| LINT-R13 | Location Ambiguity Handling | P0 |
| LINT-R14 | Outlet Eligibility Filtering | P0 |
| LINT-R15 | Nearest Outlet Calculation | P0 |
| LINT-R16 | Open Outlet Preference | P0 |
| LINT-R17 | Service Radius | P0 |
| LINT-R18 | Result Presentation and Maps Link | P0 |
| LINT-R19 | Optional Directions | P1 |
| LINT-R20 | Customer Outlet Confirmation | P0 |
| LINT-R21 | Privacy and Retention | P0 |
| LINT-R22 | Cache and Cost Controls | P0 |
| LINT-R23 | Rate Limiting and Abuse Prevention | P0 |
| LINT-R24 | URL and SSRF Security | P0 |
| LINT-R25 | Failure and Fallback Behavior | P0 |
| LINT-R26 | Location Tool Contracts | P0 |
| LINT-R27 | Admin and Service APIs | P1 |
| LINT-R28 | AI Agent and Scope Security Integration | P0 |
| LINT-R29 | Observability and Audit | P0 |
| LINT-R30 | Testing and Quality Assurance | P0 |

---

# 4. Requirements


## LINT-R1: Text-First Customer Location

**Priority:** P0

### Acceptance Criteria

1. THE System SHALL accept natural-language location text as the default customer flow.

2. Share Location SHALL remain optional.

3. THE System SHALL accept street, area, kelurahan, kecamatan, landmark, building/place name, postal code, and city.

4. THE System SHALL support common Indonesian abbreviations and informal spelling when resolvable.

5. THE System SHALL not require latitude/longitude from the customer.

6. THE System SHALL not ask for Share Location before attempting valid text resolution.

7. THE System MAY offer Share Location after text resolution fails or remains ambiguous.

8. Location messages SHALL be treated as business/outlet intent, not general knowledge.

9. THE System SHALL support Telegram and WhatsApp text input.

10. THE System SHALL not claim a location was resolved without provider or validated coordinates.

11. Input SHALL be normalized server-side and bounded by input-size policy.

12. Provider implementation details SHALL not be exposed to the customer.


---


## LINT-R2: Progressive Location Collection

**Priority:** P0

### Acceptance Criteria

1. City SHALL be known before provider resolution.

2. At least one of street, area, landmark, place name, or postal code SHALL be known.

3. If city is missing, THE System SHALL ask the city.

4. If city exists but location detail is missing, THE System SHALL ask street, area, landmark, place, or postal code.

5. THE System SHALL never guess the city.

6. City supplied in the active location flow MAY be reused.

7. Stale city from durable customer memory SHALL not be used automatically.

8. Compatible fields from consecutive turns SHALL be merged.

9. Explicit corrections SHALL replace the affected field.

10. THE System SHALL ask one targeted clarification at a time.

11. Provider lookup SHALL not run until minimum fields exist.

12. Repeated identical clarification SHALL not call the provider again.

13. Cancel or change-location commands SHALL clear or replace pending state.

14. State transitions SHALL be idempotent and concurrency-safe.


---


## LINT-R3: Temporary Location Context

**Priority:** P0

### Acceptance Criteria

1. THE System SHALL maintain temporary Pending_Location_Context.

2. Pending context MAY contain street, area, city, province, landmark, place name, postal code, normalized query, candidate IDs, and resolution status.

3. Pending context SHALL not become durable customer memory.

4. Pending context SHALL expire after 30 minutes of inactivity.

5. Pending context SHALL clear after outlet confirmation, cancellation, or session invalidation.

6. Resolved customer coordinates SHALL be temporary and expire with the flow.

7. Pending state SHALL be workspace/chat/contact scoped.

8. Duplicate messages SHALL not update the state twice.

9. Temporary state SHALL not contain provider credentials or raw provider payloads.

10. Expired state SHALL not be silently reused.

11. Cleanup SHALL be testable with a fixed clock.


---


## LINT-R4: Supported Outlet City Scope

**Priority:** P0

### Acceptance Criteria

1. Supported cities SHALL be derived from eligible active outlets.

2. A supported city SHALL contain at least one active, pickup-enabled, VERIFIED-location outlet.

3. MVP lookup SHALL be limited or strongly biased to supported cities.

4. Country SHALL default to Indonesia.

5. Provider region/country bias SHALL use Indonesia when available.

6. Customer city SHALL be validated against supported cities.

7. If no supported city matches, THE System SHALL explain current coverage.

8. Deleted, inactive, or unverified outlets SHALL not keep a city supported.

9. Supported-city cache SHALL invalidate when outlet eligibility changes.

10. Provider/domain contracts SHALL support future Indonesia-wide expansion.

11. City aliases MAY be maintained in a controlled registry.


---


## LINT-R5: Location Provider Adapter

**Priority:** P0

### Acceptance Criteria

1. THE System SHALL define a provider-neutral Location_Provider interface.

2. MVP SHALL implement a Google Maps adapter.

3. Domain services SHALL not call Google APIs outside the adapter.

4. The interface SHALL support text geocoding, place search, place details, URL/place resolution, and optional route calculation.

5. Provider output SHALL map to stable domain contracts.

6. Provider errors SHALL map to stable domain errors.

7. Timeout, retry, and cancellation SHALL be bounded and configurable.

8. Provider API keys SHALL remain backend-only and SHALL not enter prompts, frontend responses, or logs.

9. The adapter SHALL request minimal fields.

10. Provider health, version, latency, usage, quota, and rate-limit errors SHALL be observable.

11. A deterministic fake provider SHALL exist for automated tests.

12. Arbitrary user-defined provider endpoints and generic web-fetch capability SHALL be forbidden.


---


## LINT-R6: Text Location Resolution

**Priority:** P0

### Acceptance Criteria

1. THE System SHALL normalize text while preserving meaningful place names.

2. Common abbreviations MAY be expanded, including Jl., Kec., and Kel.

3. City, province when known, and Indonesia SHALL be used as query context.

4. Resolution SHALL return status, formatted label, coordinates, Place ID when available, confidence, and candidate count.

5. Latitude SHALL be within -90..90 and longitude within -180..180.

6. Invalid coordinates SHALL be rejected.

7. Results outside the requested/supported city SHALL not be silently accepted.

8. High-confidence single results MAY proceed.

9. Multiple or low-confidence results SHALL use ambiguity handling.

10. No-result SHALL request more detail.

11. Resolved customer coordinates SHALL not become outlet coordinates or durable memory.

12. Resolution SHALL not select an outlet.

13. Resolution SHALL be cached, rate-limited, idempotent, and traceable.

14. Only location-related text SHALL be included in the provider query.

15. Instructions embedded in location text SHALL be treated as data, not executable instructions.


---


## LINT-R7: Landmark and Place Search

**Priority:** P0

### Acceptance Criteria

1. THE System SHALL accept named landmarks, buildings, campuses, malls, hospitals, and other place names.

2. City SHALL be known in the active flow.

3. Place search SHALL use supported-city and Indonesia bias.

4. Multiple similar places SHALL trigger clarification with at most three candidates.

5. Candidate labels SHALL contain enough geographic context to distinguish them.

6. Generic phrases such as 'dekat masjid' without a name SHALL request more detail.

7. Broad phrases such as 'pusat kota' MAY proceed only if the provider returns a clear candidate.

8. Place results SHALL be cached, rate-limited, temporary, and bound to the active flow.

9. Place search SHALL not perform unrelated web search.

10. Expired candidate selection SHALL require a new search.


---


## LINT-R8: Shared Coordinates Input

**Priority:** P0

### Acceptance Criteria

1. THE System SHALL accept normalized coordinates from Telegram or WhatsApp location messages.

2. Shared coordinates SHALL be optional.

3. Coordinates SHALL be validated and temporary.

4. Shared coordinates SHALL bypass text geocoding but not supported-city, eligibility, radius, or confirmation rules.

5. Shared coordinates SHALL not become durable memory or movement history.

6. Continuous/background location tracking SHALL be forbidden.

7. Invalid, incomplete, out-of-range, or out-of-country coordinates SHALL fail safely.

8. Duplicate coordinate events SHALL be idempotent.

9. Exact coordinates SHALL be redacted from standard logs and broad metrics.


---


## LINT-R9: Customer Google Maps Link Input

**Priority:** P1

### Acceptance Criteria

1. THE System SHOULD accept approved Google Maps URLs from customers.

2. URL handling SHALL use the secure URL resolver and SHALL not expose generic URL fetching.

3. Resolved coordinates and Place IDs SHALL remain temporary.

4. Every redirect and final host SHALL be validated.

5. Ambiguous search links SHALL trigger clarification.

6. Unsupported URLs SHALL fall back to asking for text location.

7. URL resolution SHALL be cached, rate-limited, and independently disableable.

8. Non-Google URLs and malicious redirect chains SHALL be rejected.

9. Outlet confirmation SHALL still be required.


---


## LINT-R10: Admin Google Maps URL Resolver

**Priority:** P0

### Acceptance Criteria

1. Admin SHALL be able to paste full, short, place, search, or coordinate Google Maps URLs.

2. Resolution SHALL run server-side through secure URL handling and official provider APIs.

3. The resolver SHALL return preview data: Place ID, display name, formatted address, coordinates, canonical Maps URI, confidence, and source.

4. Resolution SHALL not persist before admin confirmation.

5. Admin MAY reject the preview or manually adjust the pin.

6. Manual adjustment SHALL be recorded as location_source=manual_adjustment.

7. Google Maps HTML scraping SHALL be forbidden.

8. Unsupported or invalid URLs SHALL return stable errors.

9. Resolver access SHALL require permission, workspace scope, rate limits, and audit.

10. Existing verified outlet location SHALL remain unchanged until confirmation.

11. Confirmation SHALL persist atomically with optimistic concurrency.


---


## LINT-R11: Canonical Outlet Location

**Priority:** P0

### Acceptance Criteria

1. Eligible outlets SHALL store canonical location data persistently.

2. Required fields SHALL include provider, provider_place_id, source URL, canonical Maps URI, formatted address, latitude, longitude, city, province, country, source, status, confidence, timestamps, resolver version, and location version.

3. Coordinates SHALL be validated before persistence.

4. VERIFIED status SHALL be required for nearest search by default.

5. Canonical location SHALL be workspace/outlet scoped.

6. Location source SHALL distinguish provider_resolved, manual_adjustment, imported, and migrated.

7. Manual adjustment SHALL preserve original provider metadata.

8. Location update SHALL be atomic, versioned, auditable, and invalidate relevant caches.

9. Outlet location SHALL not be derived from RAG at runtime.

10. Stored coordinates SHALL be used directly instead of re-resolving the Maps URL for every customer request.

11. Secret URL parameters SHALL be stripped before storage.


---


## LINT-R12: Outlet Location Verification

**Priority:** P0

### Acceptance Criteria

1. Location statuses SHALL include UNRESOLVED, RESOLVED, VERIFIED, NEEDS_REVIEW, and INVALID.

2. Only VERIFIED locations SHALL participate by default.

3. Admin confirmation SHALL set VERIFIED.

4. Manual refresh SHALL be available.

5. Scheduled verification SHOULD run every 12 months.

6. Significant coordinate changes SHALL become NEEDS_REVIEW and SHALL not silently overwrite current verified coordinates.

7. Existing verified location MAY remain active during review unless explicitly invalidated.

8. Verification SHALL record actor, timestamp, source, old/new values, resolver version, and review status.

9. Verification SHALL be permission-controlled, workspace-scoped, idempotent, quota-aware, and observable.

10. Invalid refresh results SHALL not overwrite current data.

11. Accepted changes SHALL invalidate caches.

12. Restore of previous verified location MAY be supported with authorization.


---


## LINT-R13: Location Ambiguity Handling

**Priority:** P0

### Acceptance Criteria

1. Resolution statuses SHALL distinguish RESOLVED, AMBIGUOUS, NOT_FOUND, OUTSIDE_SUPPORTED_CITY, INVALID_INPUT, and PROVIDER_UNAVAILABLE.

2. High-confidence single candidate MAY proceed.

3. Medium/low confidence or multiple candidates SHALL require targeted clarification.

4. At most three candidate choices SHALL be shown.

5. City SHALL never be guessed.

6. Candidate IDs SHALL be temporary, flow-bound, and expire.

7. Customer corrections and 'bukan yang itu' SHALL permit reselection or re-resolution.

8. Provider unavailable SHALL not be reported as location not found.

9. Ambiguous results SHALL be cached briefly and shall not trigger route calculations or outlet selection.

10. Clarification messages SHALL be concise and localized.


---


## LINT-R14: Outlet Eligibility Filtering

**Priority:** P0

### Acceptance Criteria

1. Returned outlets SHALL match workspace, be not deleted, active, pickup-enabled, operationally enabled, and have VERIFIED valid coordinates.

2. Eligibility SHALL come from backend business data, not LLM output.

3. Eligibility SHALL be evaluated at request time or from safely invalidated cache.

4. Inactive, deleted, unverified, or wrong-workspace outlets SHALL never appear.

5. Eligibility cache SHALL invalidate on relevant outlet changes.

6. No eligible outlet SHALL return a clear no-result status.

7. Future delivery eligibility SHALL not alter pickup rules.

8. Cross-workspace and mixed-status fixtures SHALL be tested.


---


## LINT-R15: Nearest Outlet Calculation

**Priority:** P0

### Acceptance Criteria

1. Nearest calculation SHALL use resolved temporary customer coordinates and canonical eligible outlet coordinates.

2. Default calculation SHALL use Haversine or PostGIS geographic distance server-side.

3. The LLM SHALL not calculate or fabricate coordinates or distance.

4. Results SHALL be sorted by non-negative geographic distance.

5. One recommended outlet and up to two alternatives SHALL be returned.

6. Ties SHALL use a stable secondary rule.

7. Service radius and open-outlet policy SHALL be applied after raw distance calculation.

8. Distance SHALL be labeled approximate geographic distance.

9. Route APIs SHALL not be called by default.

10. Haversine-only output SHALL not include driving/walking duration.

11. Calculation SHALL be deterministic, workspace-scoped, validated, and performance-tested.

12. Invalid coordinates or calculation failures SHALL not select an outlet.

13. Calculation method SHALL be traced.


---


## LINT-R16: Open Outlet Preference

**Priority:** P0

### Acceptance Criteria

1. Backend outlet schedule SHALL remain the source of truth.

2. Open eligible outlets SHALL be preferred according to a documented ranking policy.

3. Closed outlets MAY appear as alternatives with status.

4. If all eligible outlets are closed, the nearest MAY be shown with closed status and authoritative next-opening information.

5. The LLM SHALL not invent opening hours or next-opening times.

6. Timezone, holiday hours, and special hours SHALL be handled where available.

7. Unknown status SHALL be labeled unknown.

8. A configurable distance tolerance MAY prefer an open outlet.

9. The result SHALL disclose when a farther outlet is recommended because it is open.

10. Opening-status logic SHALL be tested using a fixed clock.


---


## LINT-R17: Service Radius

**Priority:** P0

### Acceptance Criteria

1. The system SHALL support a configurable recommendation radius.

2. Default radius SHALL be 25 km.

3. Radius MAY be overridden per workspace, city, or outlet group.

4. The most specific active policy SHALL apply.

5. An outlet beyond radius SHALL not be labeled nearby.

6. If none are within radius, the system SHALL return no-nearby-outlet status.

7. The nearest outlet city MAY be shown as informational context.

8. Out-of-radius results SHALL not silently create a cart or selected outlet.

9. Radius SHALL be deterministic, versioned, non-negative, validated, and workspace-scoped.

10. Boundary, just-inside, and just-outside tests SHALL be required.

11. Future nationwide support SHALL not remove radius enforcement.


---


## LINT-R18: Result Presentation and Maps Link

**Priority:** P0

### Acceptance Criteria

1. Customer result SHALL include one recommendation and up to two alternatives.

2. Each outlet result SHALL include display name, formatted address, approximate geographic distance, opening status, and safe Google Maps place link.

3. Default result SHALL not include travel mode or travel duration.

4. Distance wording SHALL clearly say approximate when geographic.

5. Maps links SHALL be generated server-side from canonical outlet data and SHALL not expose API keys.

6. Raw coordinates and provider debugging metadata SHALL not be shown by default.

7. Outside-radius and closed statuses SHALL be disclosed.

8. The AI SHALL use tool output as authority and SHALL not invent fields.

9. Customer response SHALL request confirmation and allow decline/new search.

10. Telegram and WhatsApp link/button presentation SHALL be supported.

11. Maps-link failure SHALL not invalidate a known outlet recommendation.


---


## LINT-R19: Optional Directions

**Priority:** P1

### Acceptance Criteria

1. Route/directions SHALL run only after explicit customer request.

2. Supported MVP modes MAY include DRIVE and WALK.

3. If mode is omitted, default MAY be DRIVE or a short clarification MAY be asked.

4. Directions SHALL use the provider adapter, rate limits, and a default 10-minute cache.

5. Directions MAY return route distance, estimated duration, and a safe directions link.

6. Traffic-dependent values SHALL be labeled estimates.

7. Directions SHALL not change selected outlet or bypass confirmation.

8. Directions SHALL not run for ambiguous/expired location context.

9. Provider failure SHALL fall back to a safe Maps link without fabricated duration.

10. Unsupported modes SHALL return a safe clarification.

11. Route usage, latency, and quota SHALL be observable.


---


## LINT-R20: Customer Outlet Confirmation

**Priority:** P0

### Acceptance Criteria

1. Location resolution SHALL not automatically persist selected_outlet_id.

2. Customer SHALL explicitly confirm the recommended outlet or select an alternative.

3. Confirmation SHALL be required before new cart creation, product addition to a new cart, checkout, or order creation.

4. Confirmation SHALL use outlet IDs returned by the tool; the LLM SHALL not invent IDs.

5. Outlet eligibility and workspace SHALL be revalidated at confirmation time.

6. Expired candidate/flow SHALL require a new search.

7. Duplicate confirmation SHALL be idempotent.

8. Existing-cart outlet-switch rules SHALL remain owned by Backend Marketplace.

9. Backend Marketplace SHALL persist selected_outlet_id.

10. Successful confirmation SHALL clear temporary location context.

11. Plain-text 'ya' SHALL bind only to an active confirmation prompt.

12. Telegram and WhatsApp confirmation flows SHALL be tested.


---


## LINT-R21: Privacy and Retention

**Priority:** P0

### Acceptance Criteria

1. Customer location SHALL be used only for requested outlet search or directions.

2. Resolved coordinates, normalized query, candidates, and pending state SHALL be temporary.

3. Temporary data SHALL expire after 30 minutes inactivity and clear after confirmation/cancellation.

4. Customer location SHALL not become durable memory, marketing profile, or cross-workspace data.

5. Continuous/background tracking and movement history SHALL be forbidden.

6. Exact customer coordinates SHALL be redacted from standard logs and metric labels.

7. Provider requests SHALL contain only necessary data.

8. Raw provider payload retention SHALL be forbidden by default.

9. Original customer text MAY remain under existing chat retention.

10. Temporary candidate IDs and caches SHALL expire.

11. Elevated debugging access, if implemented, SHALL be permission-controlled, audited, and time-bounded.

12. Privacy, deletion, and retention behavior SHALL have automated tests.


---


## LINT-R22: Cache and Cost Controls

**Priority:** P0

### Acceptance Criteria

1. Safe location results SHALL be cached.

2. Default TTLs SHALL be 7 days resolved, 1 hour ambiguous, 10 minutes failed, and 10 minutes route.

3. Canonical outlet coordinates SHALL remain persistent source data, not cache-only.

4. Cache keys SHALL include provider, provider version, country, normalized query, and city bias.

5. Route cache SHALL include origin fingerprint, destination outlet, mode, and provider version.

6. Cache hits SHALL avoid provider calls.

7. Repeated unchanged clarification SHALL not call the provider.

8. Outlet location, eligibility, radius, and provider-version changes SHALL invalidate relevant caches.

9. Cache failure SHALL fall back safely and SHALL not select stale invalid outlets.

10. Negative cache SHALL be short-lived.

11. Manual admin refresh MAY bypass cache.

12. Provider field masks SHALL request minimum data.

13. Estimated calls avoided MAY be measured; exact currency savings SHALL require reliable pricing.

14. Cross-workspace cache leakage SHALL be tested.


---


## LINT-R23: Rate Limiting and Abuse Prevention

**Priority:** P0

### Acceptance Criteria

1. Location resolution SHALL be rate-limited to a default 5 calls per 10 minutes per customer/chat.

2. Directions SHALL have a separate default 10 calls per 10 minutes per customer/chat.

3. Admin resolver and scheduled verification SHALL use separate limits/quotas.

4. Cache hits and unchanged clarification SHOULD avoid provider quota consumption.

5. Duplicate events SHALL not double-consume limits.

6. Exceeded limits SHALL produce a friendly bounded response.

7. Rate-limit state SHALL be workspace-scoped, concurrency-safe, configurable, and persistent enough for correctness.

8. Provider quota errors SHALL trigger bounded backoff/circuit breaking.

9. Outlet confirmation and reading an existing result SHALL not require a new resolution.

10. Metrics SHALL avoid PII and burst tests SHALL verify provider-call caps.


---


## LINT-R24: URL and SSRF Security

**Priority:** P0

### Acceptance Criteria

1. No generic fetch-any-URL tool or API SHALL be created.

2. Only explicitly approved Google Maps hosts SHALL be accepted.

3. HTTPS SHALL be required.

4. Every redirect and final host SHALL be revalidated.

5. Redirect count, response size, timeout, content type, and ports SHALL be bounded.

6. localhost, loopback, private, link-local, metadata-service, file, ftp, data, and internal/connector targets SHALL be blocked.

7. DNS rebinding, Unicode/punycode host tricks, redirect loops, and malicious query parameters SHALL be tested.

8. The resolver SHALL not forward internal auth headers, execute JavaScript, or scrape arbitrary HTML.

9. The resolver SHALL use official APIs after safe identifier/query extraction.

10. Provider keys SHALL never be appended to customer URLs.

11. Stored URLs SHALL be normalized and secret query parameters stripped.

12. Security errors SHALL be customer-safe and SHALL not overwrite outlet data.

13. SSRF tests SHALL block release.


---


## LINT-R25: Failure and Fallback Behavior

**Priority:** P0

### Acceptance Criteria

1. The system SHALL distinguish invalid input, not found, ambiguous, unsupported city, provider unavailable, rate limited, no eligible outlet, and outside radius.

2. Provider timeout/unavailability SHALL not be mislabeled as not found.

3. Failures MAY offer retry, more location detail, supported-city information, or optional Share Location.

4. No eligible/outside-radius outcomes SHALL not invent a nearby outlet.

5. Route failure SHALL fall back to a Maps link without fabricated duration.

6. Outlet deactivation before confirmation SHALL require a new recommendation.

7. Expired flow SHALL ask for location again.

8. Customer errors SHALL be concise and reveal no keys, stack traces, or raw provider payload.

9. Retries SHALL be bounded and circuit breakers recover after configuration.

10. Admin resolver/verification failure SHALL preserve current verified outlet data.

11. Failure modes SHALL be observable and covered by resilience tests.


---


## LINT-R26: Location Tool Contracts

**Priority:** P0

### Acceptance Criteria

1. Customer-facing AI SHALL receive controlled location tools only.

2. Minimum customer tool SHOULD be resolve_location_and_find_nearest_outlets.

3. Optional directions tool MAY be get_outlet_directions.

4. Admin tools SHALL include resolve_google_maps_url, confirm_outlet_location, and refresh_outlet_location.

5. Tool input/output SHALL use strict schemas and stable statuses.

6. Tool output SHALL not include API keys or raw provider payload.

7. Customer tool SHALL support missing_information, ambiguous, resolved, not_found, outside_supported_city, no_eligible_outlet, outside_radius, provider_unavailable, rate_limited, and invalid_input.

8. Resolved output SHALL include one recommendation, alternatives, calculation method, and within-radius state.

9. Location tool SHALL not persist selected_outlet_id.

10. All tools SHALL enforce workspace scope, rate limits, tracing, cancellation, and idempotency where applicable.

11. LLM-provided outlet coordinates SHALL never become canonical.

12. Admin persistence SHALL require permission and confirmation.

13. Location tools SHALL be allowlisted only for outlet-related intents.

14. Off-topic/unsafe requests and active human takeover SHALL not produce location-tool-driven AI replies.


---


## LINT-R27: Admin and Service APIs

**Priority:** P1

### Acceptance Criteria

1. Suggested admin APIs SHALL support resolve, confirm, refresh, read, and history for outlet locations.

2. Suggested service APIs MAY support resolve-nearest-outlets and directions.

3. Authentication, role permission, workspace scope, strict schema, stable errors, rate limits, and audit SHALL apply.

4. Resolve SHALL not persist; confirm SHALL persist atomically; refresh SHALL support dry-run preview.

5. Mutation APIs SHALL support idempotency and optimistic concurrency.

6. Cross-workspace access SHALL be denied.

7. APIs SHALL redact secrets and raw provider payloads.

8. Directions SHALL require valid resolved context or coordinates.

9. No generic URL-fetch endpoint SHALL be created.

10. API integration/security/concurrency tests SHALL be required.


---


## LINT-R28: AI Agent and Scope Security Integration

**Priority:** P0

### Acceptance Criteria

1. Valid location requests SHALL map to business/outlet intent.

2. 'Jalan Biawan Samarinda' SHALL be allowed as outlet request.

3. 'Jalan Biawan' SHALL ask city.

4. 'Samarinda' SHALL ask street, area, landmark, place, or postal code.

5. Off-topic and unsafe requests SHALL not invoke location tools.

6. Tool Gateway SHALL allowlist location tools by intent.

7. Human takeover SHALL remain authoritative.

8. The AI SHALL use tool output as authority and SHALL not fabricate coordinates, distance, opening status, links, or outlet IDs.

9. RAG MAY explain an outlet but SHALL not calculate nearest distance.

10. Backend outlet data SHALL determine eligibility.

11. Tool failure SHALL not trigger free-form guessing.

12. Existing cart/outlet business rules SHALL remain owned by Backend Marketplace.

13. Integration tests SHALL cover allowed, clarify, denied, unsafe, duplicate, and takeover flows.


---


## LINT-R29: Observability and Audit

**Priority:** P0

### Acceptance Criteria

1. The system SHALL record workspace, message/flow correlation, input type, city, provider/version, cache hit, status, candidate count, calculation method, eligible count, radius result, confirmed outlet, latency, provider calls, and error code.

2. Standard traces SHALL not store exact customer coordinates, raw provider payloads, or API keys.

3. Admin outlet changes, manual adjustments, and verification SHALL be audited.

4. Metrics SHALL cover flow starts, missing city/detail, success, ambiguous, not found, unsupported city, cache hit, provider call, rate limit, no eligible outlet, outside radius, confirmation, abandonment, directions, and failures.

5. Metrics SHALL avoid PII/high-cardinality labels.

6. Provider and nearest-calculation latency SHALL be measured.

7. Alerts SHALL cover provider failures, ambiguity spikes, rate-limit spikes, SSRF rejections, unverified outlets, verification failures, and unusual coordinate changes.

8. Trace access and retention SHALL be workspace/permission controlled.

9. AI tool call and location service SHALL share correlation IDs.

10. Cost reporting SHALL not claim exact savings without provider pricing.

11. An operational runbook SHALL document failures and provider incidents.


---


## LINT-R30: Testing and Quality Assurance

**Priority:** P0

### Acceptance Criteria

1. Implementation SHALL follow RED-GREEN-REFACTOR-VERIFY.

2. Unit tests SHALL cover parsing, normalization, context merge, coordinate validation, Haversine, eligibility, radius, cache keys, and limits.

3. Component tests SHALL cover provider adapter, resolvers, nearest service, confirmation, and verification.

4. Integration tests SHALL cover AI tools, Scope Security, Backend Marketplace authority, Telegram, WhatsApp, and admin APIs.

5. Security tests SHALL cover SSRF, redirects, arbitrary domains, secret leakage, cross-workspace access, prompt/tool misuse.

6. Property tests SHALL cover coordinate bounds, non-negative distance, stable order, radius, eligible-only results, and expiry.

7. Concurrency tests SHALL cover duplicate messages, parallel replies, confirmation races, outlet updates, and cache invalidation.

8. Resilience tests SHALL cover provider, quota, cache, DB, route, and malformed-response failures.

9. Cost tests SHALL assert cache hits avoid provider, unchanged clarification avoids provider, default nearest search makes no route call, and outlet URLs are not re-resolved per customer request.

10. Evaluation SHALL include Jalan Biawan Samarinda, Jalan Biawan, Samarinda, Air Putih Samarinda, Big Mall Samarinda, typo, unsupported city, ambiguity, and provider unavailable.

11. Admin tests SHALL include full/short/coordinate URLs, manual adjustment, unsupported URL, and significant refresh.

12. Confirmation tests SHALL include recommended/alternative/expired/duplicate/deactivated outlet scenarios.

13. Privacy tests SHALL assert no durable customer coordinates and redacted logs.

14. Live Google tests SHALL be optional/sandboxed; deterministic fake provider SHALL be default CI.

15. Production data and keys SHALL be forbidden in tests.

16. Critical SSRF, cross-workspace, durable-location, route-by-default, and auto-selection failures SHALL block release.

17. Specs validation SHALL pass.


---


# 5. Recommended Tool Contracts

## Customer Composite Tool

```text
resolve_location_and_find_nearest_outlets
```

Input:

```text
location text or structured street/area/city/landmark/place/postal code
optional Google Maps URL
optional shared coordinates
limit: 1–3
```

Output statuses:

```text
missing_information
ambiguous
resolved
not_found
outside_supported_city
no_eligible_outlet
outside_radius
provider_unavailable
rate_limited
invalid_input
```

Resolved output:

```text
flow ID
safe resolved label
confidence
calculation type = GEOGRAPHIC_DISTANCE
recommended outlet
up to two alternatives
within service radius
Google Maps place link
```

## Optional Directions Tool

```text
get_outlet_directions
```

Runs only after explicit customer request.

## Admin Tools

```text
resolve_google_maps_url
confirm_outlet_location
refresh_outlet_location
```

Admin resolution creates a preview token. Persistence requires explicit confirmation.

---

# 6. Core Data Requirements

## Canonical Outlet Location

```text
provider
provider_place_id
google_maps_source_url
google_maps_uri
formatted_address
latitude
longitude
city
province
country_code
postal_code
location_source
location_resolution_status
location_confidence
location_resolved_at
location_verified_at
location_resolver_version
location_version
last_verification_at
next_verification_at
```

## Temporary Customer Location

```text
flow_id
workspace_id
contact_id
chat_id
session_id
street
area
city
province
landmark
place_name
postal_code
normalized_query
resolution_status
candidate_ids
protected temporary coordinates
expires_at
last_message_id
created_at
updated_at
```

Temporary fields SHALL not become customer profile or durable-memory fields.

---

# 7. Error Codes

```text
LOCATION_INPUT_EMPTY
LOCATION_INPUT_TOO_LARGE
LOCATION_CITY_REQUIRED
LOCATION_DETAIL_REQUIRED
LOCATION_INVALID_COORDINATES
LOCATION_UNSUPPORTED_CITY
LOCATION_NOT_FOUND
LOCATION_AMBIGUOUS
LOCATION_CANDIDATE_EXPIRED
LOCATION_FLOW_EXPIRED
LOCATION_PROVIDER_UNAVAILABLE
LOCATION_PROVIDER_TIMEOUT
LOCATION_PROVIDER_RATE_LIMITED
LOCATION_RATE_LIMITED
LOCATION_NO_ELIGIBLE_OUTLET
LOCATION_OUTSIDE_SERVICE_RADIUS
LOCATION_OUTLET_NOT_ELIGIBLE
LOCATION_OUTLET_LOCATION_UNVERIFIED
LOCATION_OUTLET_LOCATION_INVALID
LOCATION_MAPS_URL_INVALID
LOCATION_MAPS_URL_UNSUPPORTED
LOCATION_MAPS_URL_REDIRECT_LIMIT
LOCATION_MAPS_URL_FORBIDDEN_HOST
LOCATION_MAPS_URL_SSRF_BLOCKED
LOCATION_MAPS_URL_RESOLUTION_FAILED
LOCATION_PREVIEW_EXPIRED
LOCATION_VERSION_CONFLICT
LOCATION_CONFIRMATION_REQUIRED
LOCATION_CONFIRMATION_EXPIRED
LOCATION_DIRECTIONS_MODE_UNSUPPORTED
LOCATION_DIRECTIONS_UNAVAILABLE
LOCATION_CROSS_WORKSPACE_ACCESS_DENIED
LOCATION_PERMISSION_DENIED
LOCATION_INTERNAL_ERROR
```

---

# 8. Correctness Properties

1. City is required before text-provider resolution.
2. City is never guessed from stale durable memory.
3. Valid text is attempted before requiring Share Location.
4. Customer coordinates are temporary.
5. Nearest calculation uses verified canonical outlet coordinates.
6. Every result is an eligible same-workspace outlet.
7. Distance ordering is deterministic and non-negative.
8. Default nearest search performs no route call.
9. Haversine-only result reports no travel duration.
10. Out-of-radius outlet is not labeled nearby.
11. selected_outlet_id does not change before confirmation.
12. Ambiguous location is never silently guessed.
13. Outlet Maps URL is not re-resolved for every customer request.
14. Non-approved/internal URL targets are rejected.
15. Cache context cannot leak across workspace/provider/city.
16. Duplicate events consume limits and update state at most once.
17. Admin resolution does not persist before confirmation.
18. Significant verification changes require review.
19. Off-topic/unsafe requests cannot invoke location tools.
20. Human takeover suppresses AI customer response.

---

# 9. MVP Boundary

## P0 MVP

```text
text-first flow
progressive city/detail collection
temporary 30-minute state
supported outlet cities
Google provider adapter
text and landmark resolution
shared coordinates
admin URL resolver
canonical verified outlet coordinates
manual pin adjustment
nearest Haversine/PostGIS calculation
eligible-only filtering
open outlet preference
25 km configurable radius
one recommendation + two alternatives
Google Maps place link
customer confirmation
privacy
cache
rate limits
SSRF protection
observability
TDD suites
```

## P1

```text
customer Google Maps URL
directions and duration on explicit request
admin history UI
scheduled verification automation
```

## Deferred

```text
Indonesia-wide unsupported-city resolution
multi-provider active fallback
public transport
motorcycle routing
saved addresses
delivery
service polygons
continuous location
advanced traffic ranking
```

---

# 10. Definition of Done

A requirement is complete only when:

```text
acceptance criteria implemented
failing tests written first
provider access uses adapter
no generic web fetch exists
city clarification works
text-first flow works
Share Location remains optional
temporary location expires
customer coordinates are not durable
outlet coordinates are verified and canonical
unverified outlets are excluded
nearest calculation is server-side
default flow makes zero route calls
Haversine output has no travel duration
service radius is enforced
customer confirmation is mandatory
workspace isolation passes
SSRF tests pass
admin confirmation is mandatory
significant changes require review
cache and rate-limit tests pass
provider fallback behavior passes
privacy/redaction tests pass
Telegram and WhatsApp integrations pass
AI Scope Security integration passes
human takeover remains authoritative
unit/component/integration/security/property/concurrency/resilience/cost tests pass
documentation is updated
implementation reality is reported honestly
specs validation passes
```

---

# 11. Final Requirement Statement

SelaluTeh Location Intelligence SHALL let customers find nearby outlets using ordinary text without requiring live location.

The system SHALL:

```text
collect city and location details progressively
never guess city
resolve text through a controlled provider adapter
store verified outlet coordinates once
calculate nearest eligible outlets server-side
return a concise recommendation and Maps link
run directions only on explicit request
enforce radius and opening/eligibility policies
require outlet confirmation
keep customer coordinates temporary
cache and rate-limit provider calls
protect URL resolution from SSRF
```

The system SHALL NOT:

```text
give the AI unrestricted internet access
force Share Location
store customer coordinates as durable memory
scrape arbitrary Google Maps HTML
re-resolve outlet URLs per customer request
include unverified/cross-workspace outlets
fabricate coordinates, distance, duration, or links
guess city
select an outlet without confirmation
expose provider keys
create a generic URL fetcher
```
