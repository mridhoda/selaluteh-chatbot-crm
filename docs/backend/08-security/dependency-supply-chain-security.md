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
