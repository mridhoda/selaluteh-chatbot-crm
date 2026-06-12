# Context Packing

Dokumen ini menjelaskan cara mengemas context untuk AI coding agent ketika task besar.

## Preferred Context Order

Untuk task backend besar, berikan AI context dengan urutan:

1. `09-ai-context/prompt-context.md`
2. `09-ai-context/current-task.md`
3. `09-ai-context/do-not-break.md`
4. Relevant folder docs:
   - `04-tech-spec` untuk arsitektur,
   - `05-api-spec` untuk endpoint,
   - `06-data` untuk schema,
   - `08-security` untuk security,
   - `02-flows` untuk flow.
5. Specific source files yang akan diubah.

## Avoid Context Overload

Jangan lempar semua docs kalau task kecil. Pilih context sesuai task:

| Task | Required Context |
|---|---|
| Telegram callback | telegram-bot-context, webhook API, Telegram flow |
| Payment webhook | payment-context, payment API, payment security |
| Product CRUD | product rules, product API, schema |
| AI action | ai-action-contract, guardrails, AI pipeline |
| Migration | data docs, mapping, checklist |

## Combined Docs

Combined docs boleh dipakai untuk:

- AI onboarding,
- project audit,
- big refactor planning.

Tapi untuk implementation task, lebih baik beri file spesifik agar AI tidak bingung.

## Expected AI Response

Saat AI diberi task, minta output:

```txt
Understanding
Plan
Files to change
Implementation
Tests/manual checks
Risks
```
