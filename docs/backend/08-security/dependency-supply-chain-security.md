# Dependency & Supply Chain Security

## Risks

- Malicious npm package.
- Vulnerable dependency.
- Compromised Docker image.
- Secrets committed in repo.
- Unsafe third-party SDK.

## Required Controls

- Use lockfiles.
- Review new packages before install.
- Run dependency audit in CI.
- Pin Docker base images reasonably.
- Avoid abandoned packages for auth/payment/webhook security.
- Keep payment provider SDK updated.

## Suggested Checks

```bash
npm audit
npm outdated
npx depcheck
```

For CI:

```txt
install dependencies from lockfile
run tests
run lint
run dependency audit
build docker image
```

## Package Review Questions

Before adding a dependency:

1. Is it maintained?
2. Does it need access to secrets/files/network?
3. Is the license acceptable?
4. Is there a smaller built-in alternative?
5. Is it required for runtime or only dev?

## AI/Coding Agent Caution

AI coding agents must not install random packages without approval for:

```txt
auth
payment
crypto
encryption
file upload
webhook validation
```

## Current Audit Exceptions

Audit command:

```bash
npm --prefix server run security:audit
```

Current accepted temporary exceptions on this branch:

- `multer`: upstream DoS advisories are partially mitigated in-app by parser file-size limits, single-file upload limits, and route rate limiting. Package still needs upgrade planning.
- `express` / `path-to-regexp` / `qs`: inherited from current Express 4 stack. Risk is reduced by stricter route handling plus request-size/rate limiting, but dependency upgrade remains required.
- `nodemailer`: current runtime stays on a non-breaking 6.x range. Major-version remediation should be scheduled with regression testing.
- `form-data`, `jws`, `uuid`: transitive/runtime packages remain visible in audit output until dependency tree refresh is completed.

These are documented exceptions, not permanent approvals.
