# CI Test Pipeline

## Goal

CI harus menangkap bug sebelum merge/deploy.

## Recommended Pipeline

```txt
Install dependencies
-> lint
-> format check
-> type/static check if available
-> unit tests
-> integration tests with test database
-> Supabase migration/seed SQL check
-> build server
-> build web
-> package artifact
```

## Example Stages

### 1. Static Checks

- ESLint.
- Prettier check.
- Dependency audit warning.
- No committed `.env` secrets.

### 2. Unit Tests

```bash
npm --prefix server test:unit
```

### 3. Integration Tests

```bash
npm --prefix server test:integration
```

Use isolated database:

```txt
DATABASE_URL=<test-database-url>
LOCAL_UPLOAD_ROOT=/tmp/selaluteh-test-uploads
```

### 4. Supabase Cutover Checks

- Apply SQL migrations to fresh test DB.
- Run validation queries.
- Run seed data.
- Run Supabase repository/integration/security tests for cutover domains.
- Do not run automated tests against production Supabase.
- Do not add new Mongo tests.

### 5. Build

```bash
npm --prefix server run build || true
npm --prefix web run build
```

If backend is plain JS and has no build step, use lint/test as build gate.

## Quality Gates

| Gate | Required |
|---|---|
| Unit tests | Must pass |
| Integration tests | Must pass before staging deploy |
| Security tests | Must pass before production deploy |
| E2E smoke | Must pass before release |
| Supabase migration/seed check | Must pass before DB cutover |

## Secrets in CI

- Use CI secret store.
- Do not print tokens.
- Use fake provider keys for unit/integration.
- Use sandbox keys only in staging.
