# Master Implementation Prompt — Five MVP Pages

You are working inside the `selaluteh-chatbot-crm` repository.

Your task is to implement/refine the frontend designs for:

1. Products
2. Payments
3. Chat Center
4. Settings
5. Connected Platforms

## Mandatory reading before code

Read these docs first:

```txt
docs/backend/index.md
docs/backend/READING-ORDER.md
docs/backend/00-overview/scope.md
docs/backend/00-overview/target-state.md
docs/backend/03-business-rules/workspace-tenant-rules.md
docs/backend/03-business-rules/outlet-rules.md
docs/backend/03-business-rules/outlet-access-rules.md
docs/backend/03-business-rules/product-catalog-rules.md
docs/backend/03-business-rules/payment-rules.md
docs/backend/03-business-rules/human-takeover-rules.md
docs/backend/05-api-spec/products-api.md
docs/backend/05-api-spec/payments-api.md
docs/backend/05-api-spec/chats-api.md
docs/backend/05-api-spec/platforms-api.md
docs/backend/05-api-spec/settings-api.md
docs/backend/06-data/database-schema.md
docs/backend/06-data/query-contracts.md
docs/backend/07-uiux/design-system.md
docs/backend/07-uiux/outlet-selector-pattern.md
docs/backend/07-uiux/ui-states.md
docs/backend/08-security/workspace-tenant-security.md
docs/backend/08-security/outlet-access-security.md
docs/backend/08-security/payment-security.md
docs/backend/08-security/webhook-security.md
docs/backend/09-ai-context/do-not-break.md

docs/frontend/README.md
docs/frontend/00-foundation/design-alignment.md
docs/frontend/00-foundation/multi-outlet-and-workspace-context.md
docs/frontend/01-pages/products-page.md
docs/frontend/01-pages/payments-page.md
docs/frontend/01-pages/chat-center-page.md
docs/frontend/01-pages/settings-page.md
docs/frontend/01-pages/connected-platforms-page.md
docs/frontend/02-contracts/api-and-data-contracts.md
docs/frontend/02-contracts/permissions-and-security.md
docs/frontend/04-testing/acceptance-test-plan.md
```

## Current architecture

Frontend is React + Vite and already uses feature modules:

```txt
web/src/modules/products
web/src/modules/payments
web/src/modules/chats
web/src/modules/settings
web/src/modules/platforms
```

MVP architecture:

```txt
one workspace/account
└── multiple outlets
```

Future architecture:

```txt
multiple workspace/accounts/franchise owners
└── multiple outlets each
```

## Critical rules

- Do not rebuild the application.
- Do not redesign the sidebar or Orders page.
- Reuse the current Selalu Teh design language and existing tokens.
- Do not introduce a new color palette.
- Keep backend as source of truth.
- Telegram is the first commerce channel.
- Do not implement fake production persistence.
- Do not show unsupported capabilities as complete.
- Do not create a manual `Mark as Paid` action.
- Do not expose bot tokens, payment keys, app secrets, or webhook secrets.
- Preserve existing Chat behavior: messages, polling, reply-to, takeover, resolve, attachments.
- Preserve existing Connected Platforms CRUD and Telegram setWebhook flow.
- Validate workspace/outlet access through backend.
- Do not trust `outlet_id` query params as authorization.
- Keep Product status separate from outlet availability.
- Keep Payment status separate from Order status.

## Required working mode

Before changing code, respond with:

1. Docs read.
2. Current relevant files inspected.
3. Existing API readiness per page.
4. Proposed implementation order.
5. Files expected to change.
6. Risks and do-not-break list.
7. Test plan.

Then implement in safe phases.

## Recommended implementation order

```txt
1. Shared page patterns
2. Connected Platforms
3. Chat Center
4. Products
5. Settings
6. Payments
7. Responsive/accessibility/hardening
```

Products and Payments may require missing backend APIs. When an endpoint is missing:

- document the missing contract;
- use a clearly isolated mock adapter only for visual work if explicitly approved;
- do not make the UI pretend the feature is production-ready;
- do not change backend without stating the need first.

## Page requirements

Follow the five detailed page specs exactly. Use:

- page header;
- filter/search toolbar;
- active-filter chips only for non-default filters;
- optional summary cards;
- table/list/canvas;
- right detail drawer;
- loading/empty/error/unauthorized states;
- responsive mobile sheets/cards;
- role and outlet-aware actions.

## Quality gates

Run:

```bash
cd web
npm run build
npm run lint
```

Run any existing tests. Add focused tests for new state/logic where the project test setup supports them.

## Final report

Report:

1. Pages completed.
2. Files changed.
3. Components created/reused.
4. API endpoints used and missing.
5. Mock adapters, if any.
6. Permissions implemented.
7. Responsive/accessibility status.
8. Build/lint/test results.
9. Remaining risks and next step.
