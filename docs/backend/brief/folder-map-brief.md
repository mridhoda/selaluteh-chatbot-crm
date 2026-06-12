# Folder Map Brief

## Main Docs Folder Map

```txt
0000-business      Business strategy and validation
00-overview        High-level project overview
000-research       Market/technical research
01-product         Product requirements and personas
02-flows           Process/user/system flows
03-business-rules  Business rules and domain policies
04-tech-spec       Technical architecture and backend design
05-api-spec        Endpoint contracts
06-data            Database schema and migration
07-uiux            Admin/dashboard/UI/UX docs
08-security        Security design and threat model
09-ai-context      Context/rules for AI coding agents
10-testing         QA and testing plans
11-sprint          Execution planning and sprint docs
brief              Short summaries for quick onboarding
chatgpt-context    Context packs/prompts for AI tools
```

## When to Use Brief

Use `brief/` when:

- You need quick context.
- You are starting a new task.
- You want to brief an AI coding agent.
- You do not want to read all docs first.

## When Not to Use Brief

Do not use brief as the only source when implementing:

- Database migration.
- Payment webhook.
- Security logic.
- API contracts.
- RLS policy.
- Data import script.

For those, read the detailed folder.
