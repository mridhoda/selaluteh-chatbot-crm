# Security Checklist

## Workspace

- [ ] Tenant data has workspace_id.
- [ ] API does not trust client workspace_id.
- [ ] Workspace membership is checked.
- [ ] Multi-workspace future is not hardcoded away.

## Outlet

- [ ] Outlet belongs to workspace.
- [ ] User has outlet access or all-outlet role.
- [ ] Orders are filtered by allowed outlet ids.
- [ ] Payments are filtered by allowed outlet ids.
- [ ] Chats are filtered by allowed outlet ids.
- [ ] Product availability changes require permission.
- [ ] Cross-outlet access returns 403/404.

## Payment

- [ ] Webhook signature verified.
- [ ] Xendit `x-callback-token` verified for Payment Session webhook.
- [ ] Webhook idempotency implemented.
- [ ] Payment maps to correct order/outlet.
- [ ] Amount verified.
- [ ] Currency and merchant reference verified.
- [ ] Paid payment cannot be downgraded by stale provider event.
- [ ] Payment provider secrets are server-only and never exposed to frontend or AI.

## AI

- [ ] AI cannot checkout without outlet.
- [ ] AI cannot offer unavailable products.
- [ ] AI cannot mark payment paid.
