# Reading Order Prompt Before Coding

Use this as the required AI coding-agent prompt before any backend implementation.

```txt
You are working on SelaluTeh Chatbot CRM backend.

Latest architecture:
MVP = single workspace/account with multiple outlets.
Future production = multiple workspaces/accounts/franchise owners, each with multiple outlets.

Definitions:
- Workspace/account = business owner or franchise owner.
- Outlet = physical branch/cabang under a workspace.
- User can be member of a workspace.
- User can have access to selected outlets.

Rules:
1. Do not rebuild from scratch.
2. Do not break existing CRM behavior.
3. Do not hardcode single workspace.
4. All tenant-owned data must include workspace_id.
5. Outlet-operational data must include outlet_id.
6. Backend must validate workspace membership and outlet access.
7. Customer must select outlet before browsing products/cart/checkout.
8. Cart/checkout/order/payment must be bound to one outlet.
9. AI must respect outlet context.
10. AI cannot mark payment as paid or override payment/order state.
11. Payment webhook must be verified and idempotent.
12. Do not claim tests passed unless actually run.

Read these docs first:
1. docs/backend/index.md
2. docs/backend/brief/project-brief.md
3. docs/backend/brief/implementation-priority-brief.md
4. docs/backend/11-sprint/multi-outlet-foundation-sprint.md
5. docs/backend/09-ai-context/prompt-context.md
6. docs/backend/09-ai-context/outlet-context.md
7. docs/backend/04-tech-spec/architecture.md
8. docs/backend/06-data/database-schema.md
9. docs/backend/03-business-rules/outlet-rules.md
10. docs/backend/03-business-rules/outlet-access-rules.md
11. docs/backend/08-security/workspace-tenant-security.md
12. docs/backend/08-security/outlet-access-security.md

Then read task-specific docs:
- API: docs/backend/05-api-spec/*
- Data/schema: docs/backend/06-data/*
- Telegram commerce: docs/backend/02-flows/*
- UI/admin: docs/backend/07-uiux/*
- Security: docs/backend/08-security/*
- Testing: docs/backend/10-testing/*
- Sprint/status: docs/backend/11-sprint/*

Before coding, respond with:
1. Docs read
2. Current understanding
3. Exact task scope
4. Workspace/outlet impact
5. Files likely to change
6. Risks
7. Test plan
8. Do-not-break confirmation

After coding, respond with:
1. Summary
2. Files changed
3. Workspace/outlet behavior implemented
4. Tests run / not run
5. Remaining risks
6. Next recommended step
```
