<!--
Tech Spec Pack: Telegram-first Marketplace Backend
Project: KALIS.AI / eskala-bot evolution
Target: Chatbot CRM + Telegram Marketplace MVP
Generated: 2026-06-11
-->

# Rendering and Export

## Purpose

This project is mainly a chatbot CRM and Telegram marketplace backend. Rendering/export is not core MVP, but backend may need exports for admin operations, reports, order invoices, or chat transcripts.

## MVP Export Needs

Potential exports:

- orders CSV/XLSX
- contacts CSV/XLSX
- payment events CSV
- chat transcript JSON/CSV
- simple invoice PDF later

## Export Principles

1. Export should be workspace-scoped.
2. Large exports should run as background jobs.
3. Export files should be stored in local storage and tracked in `files` table.
4. Export links should expire or require auth if sensitive.

## Recommended Export Flow

```txt
Admin requests export
  -> create export job
  -> worker queries data
  -> generate CSV/XLSX/PDF
  -> store file under uploads/exports
  -> insert files row
  -> notify admin or show download link
```

## Folder Layout

```txt
server/uploads/exports/
  orders/
  contacts/
  chats/
  payments/
```

## CSV/XLSX Exports

Recommended libraries:

- `csv-stringify` for CSV
- `xlsx` if XLSX needed

## PDF Rendering

For simple invoice:

- start with HTML template
- render with Playwright/Puppeteer only when needed

Do not add heavy rendering dependency before MVP requires it.

## Invoice MVP

Payment link from Midtrans/Xendit may already provide payment page. Backend invoice PDF can be postponed.

If needed, invoice fields:

```txt
order_number
customer_name
items
subtotal
discount
tax
shipping_fee
total
payment_status
created_at
```

## Security

Sensitive exports must not be public under `/files` without auth. Prefer protected `/media/:fileId` for exports.

## Recommendation

For current MVP:

- implement order/contact CSV export only if admin needs it
- postpone PDF invoice
- avoid rendering service complexity until after commerce flow works
