# Location Intelligence — Test Plan

## Test Layers

| Layer | Path | Runner |
|---|---|---|
| Unit (passed) | `test/unit/location-intelligence/*.test.js` | `npm run test:location:unit` |
| Component | `test/component/location-intelligence/` | `npm run test:location:component` |
| Integration | `test/integration/location-intelligence/` | `npm run test:location:integration` |
| Security | `test/security/location-intelligence/` | `npm run test:location:security` |
| Property | `test/property/location-intelligence/` | `npm run test:location:property` |
| Concurrency | `test/concurrency/location-intelligence/` | `npm run test:location:concurrency` |
| Resilience | `test/resilience/location-intelligence/` | `npm run test:location:resilience` |
| Performance | `test/performance/location-intelligence/` | `npm run test:location:performance` |
| All | — | `npm run test:location:all` |

## Current Test Coverage (513 unit tests)

| Test File | Tests | Coverage |
|---|---|---|
| `test-helpers.test.js` | 17 | Factory validations, FixedClock |
| `fake-provider.test.js` | 14 | 6 scenarios (default, timeout, quota, malformed, ambiguous, not_found) |
| `fake-url-redirect.test.js` | 7 | SSRF scenarios |
| `spies.test.js` | 11 | Cache, rate-limit, confirmation, scope, marketplace spies |
| `flow-status.test.js` | 30 | 12-state machine, 23 valid transitions, 6 invalid, terminal behavior |
| `resolution-status.test.js` | 7 | 7 enum values, unknown rejection |
| `outlet-location-status.test.js` | 16 | 5 states, 6 valid + 5 invalid transitions, eligibility |
| `coordinate.test.js` | 17 | Validation (NaN, Infinity, bounds), immutability, serialization |
| `location-input.test.js` | 14 | 5 input types, schema, forbidden fields |
| `location-candidate.test.js` | 9 | Confidence, precision, customer-safe serialization |
| `nearest-outlet-result.test.js` | 9 | Distance, missing ID, haversine travel constraint |
| `errors.test.js` | 29 | 23 error codes, provider mapping, customer-safe messages |
| `pending-location-context.test.js` | 10 | Identity, workspace, TTL, protected fields |
| `location-parser.test.js` | 11 | Street/area/city/landmark, injection filtering |
| `completeness-evaluator.test.js` | 11 | MISSING_CITY, MISSING_DETAIL, READY_TO_RESOLVE |
| `context-merge.test.js` | 9 | Multi-turn merge, expiry, workspace isolation |
| `cancellation-detector.test.js` | 6 | 4 command patterns, case-insensitive |
| `clarification-mapper.test.js` | 5 | MISSING_CITY→ASK_CITY, MISSING_DETAIL→ASK_STREET |
| `expiry.test.js` | 4 | Fixed clock, TTL, terminal states |
| `flow-repository.test.js` | 6 | CRUD, idempotent, cross-workspace, expiry |
| `supported-city.test.js` | 14 | Contract, derivation, aliases, validation |
| `provider-interface.test.js` | 8 | Interface contract |
| `google-adapter.test.js` | 7 | Mock geocode, places, details, health |
| `query-normalizer.test.js` | 7 | Abbreviations, whitespace, injection |
| `strategy-selector.test.js` | 8 | Field → strategy mapping |
| `confidence-normalizer.test.js` | 7 | High/medium/low logic |
| `resolution-service.test.js` | 8 | Resolve, cache, timeout, ambiguous, not-found |
| `coordinate-normalizer.test.js` | 7 | Telegram, WhatsApp, privacy |
| `secure-url-resolver.test.js` | 22 | Hosts, protocols, IP ranges, redirects, extraction |
| `url-resolution-service.test.js` | 7 | Full URL, short URL, SSRF, cache |
| `admin-resolver.test.js` | 8 | Preview, confirm, version conflict |
| `verification-classifier.test.js` | 5 | 50m threshold |
| `outlet-eligibility.test.js` | 6 | All 6 eligibility conditions |
| `haversine.test.js` | 6 | Zero, symmetry, bounds |
| `nearest-outlet-service.test.js` | 14 | Ranking, open preference, radius |
| `maps-link-builder.test.js` | 5 | Place/directions link, no API key |
| `composite-tool-schema.test.js` | 4 | 11 tool statuses |
| `confirmation-service.test.js` | 6 | Bound, expiry, revalidation |
| `confirmation-input-mapper.test.js` | 9 | ya, pilih, batal, cari lokasi lain |
| `flow-coordinator.test.js` | 7 | End-to-end: parse → resolve → nearest |
| `cache-service.test.js` | 5 | 7 namespaces, TTL |
| `rate-limit-service.test.js` | 5 | 3 profiles, cache non-quota |
| `privacy-redactor.test.js` | 5 | Coordinate redaction, safe log |
| `trace-service.test.js` | 4 | Privacy-safe traces |
| `failure-handler.test.js` | 5 | 13 failure behaviors |
| `security-matrix.test.js` | 21 | SSRF, cross-workspace, key leakage, injection |
| `resilience-tests.test.js` | 3 | Timeout, quota, malformed |
| `privacy-tests.test.js` | 3 | Durable memory prevention |
| `performance-tests.test.js` | 6 | Haversine baseline, cache hit, no-route |
| `evaluation-matrix.test.js` | 18 | Happy paths, clarification, ambiguity, ranking |

## Key Test Invariants

All tests must pass before release:
```bash
npm run test:location:all
```

Release blocker conditions (encoded in tests):
1. City guessed → blocked
2. Customer coordinates persisted → blocked
3. Unverified outlet recommended → blocked
4. Cross-workspace outlet returned → blocked
5. Automatic `selected_outlet_id` mutation → blocked
6. Route call during default nearest search → blocked
7. SSRF bypass → blocked
8. Provider key exposure → blocked
9. Generic URL fetch tool → blocked
10. Admin location persisted before confirmation → blocked
11. Outlet URL resolved per customer request (no re-resolution in nearest) → blocked
12. Haversine presented as driving time → blocked
