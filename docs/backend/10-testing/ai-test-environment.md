# AI Test Environment Contract

## Test Mode Support

AI tests support two modes:

1. **Pure Unit/Component mode** (no database) — runs everywhere with deterministic fakes.
2. **Supabase repository integration mode** — requires a dedicated test Supabase project.

## Production Guard

Automated tests MUST NEVER use the production Supabase project.

Guard in `server/test/helpers/supabaseTest.js`:

- Reads `SUPABASE_TEST_URL` and `SUPABASE_TEST_SERVICE_ROLE_KEY` (NOT production env vars).
- Skips all Supabase repository integration tests gracefully when these are absent.

## Database Reset Strategy

### Before each test run

1. Apply all migrations to the clean test database.
2. Seed only test-required baseline data.

### Between test files

- Use `cleanTable(client, 'table_name', workspaceId)` to remove test workspace data.
- Use `cleanRows(client, 'table_name', [ids])` for top-level tables without `workspace_id`.

### Best practice

- Wrap each test in `beforeEach` cleanup by test workspace ID.
- Never rely on automatic row teardown after test completion.
- Use fixed UUIDs for test workspaces where data sharing is intentional.

## Migration Application Strategy

SQL migrations for AI tables:

```
docs/backend/06-data/migrations/sql/
```

Apply in order before running repository integration tests.

## Fixture Cleanup Strategy

- All rows created during tests MUST be cleaned up, regardless of test outcome.
- Use `try/finally` or `after` hooks.
- Document any fixture that cross-references across tests.

## Parallel-Test Isolation

- Each test file SHOULD use its own test workspace UUID.
- Tables MUST be cleaned by `workspace_id` before each file.
- Shared reference tables (workspaces, platform types) MUST use `cleanRows` with explicit IDs.
- Do not rely on sequential execution or implicit ordering.

## pgvector Availability

- The test project MUST have `pgvector` extension enabled.
- AI vector search tests MUST check for extension existence before running.
- Skip gracefully if `pgvector` is not available.

## CI Integration

- CI runs deterministic unit/component/evaluation tests by default.
- Supabase integration tests are optional in CI unless `SUPABASE_TEST_URL` is configured.
- Security tests MUST run in CI with mocked/fake Supabase to avoid production access.

## Commands

```bash
# All AI tests (unit-only by default, skips Supabase integration if not configured)
npm run test:ai:unit -w server

# With Supabase test project configured
npm run test:ai:integration -w server

# Full suite
npm run test:ai:all -w server
```
