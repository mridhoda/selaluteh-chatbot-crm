# Replace-Safe Notes

This package is a **full merged backend docs bundle**.

It already combines:
- previous backend docs packs (overview, product, flows, business rules, tech spec, api, data, uiux, security, ai-context, testing, sprint, ops, brief, business, root)
- multi-outlet + future multi-workspace/franchise-ready updates

## Safe Replace Guidance

You can replace your existing `docs/backend` folder with the `docs/backend` folder from this package.

## Important

The most authoritative updated files are:
- `index.md`
- `READING-ORDER.md`
- `03-business-rules/outlet-rules.md`
- `03-business-rules/outlet-access-rules.md`
- `04-tech-spec/architecture.md`
- `05-api-spec/outlets-api.md`
- `05-api-spec/outlet-access-api.md`
- `06-data/database-schema.md`
- `06-data/migrations/sql/009_multi_workspace_outlet_foundation.sql`
- `07-uiux/outlet-ui-requirements.md`
- `07-uiux/orders-page-multi-outlet.md`
- `08-security/workspace-tenant-security.md`
- `08-security/outlet-access-security.md`
- `09-ai-context/outlet-context.md`
- `10-testing/outlet-test-plan.md`
- `11-sprint/multi-outlet-foundation-sprint.md`

## Architecture Decision

MVP:
- single workspace/account
- multiple outlets

Future production:
- multiple workspaces/accounts/franchise owners
- each workspace has multiple outlets
