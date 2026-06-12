# Admin Experience

## Purpose

Admin dashboard adalah control center untuk CRM dan marketplace operations.

## Core Admin Areas

```txt
Dashboard
Inbox
Contacts
Products
Orders
Payments
Agents
Platforms
Complaints
Settings
```

## Inbox Experience

Admin dapat:

- melihat daftar chat terbaru,
- filter unread/escalated/resolved,
- membuka chat detail,
- melihat contact info,
- melihat order context,
- takeover chat,
- mengirim human reply,
- resolve chat.

Important behavior:

- Jika `takeover_by` aktif, AI tidak boleh membalas.
- Human reply harus dikirim ke provider dan disimpan sebagai message.

## Product Management

Admin dapat:

- create product,
- edit product,
- upload product image,
- manage variants,
- set product active/inactive,
- assign category,
- set price.

MVP UI should avoid complexity:

- no bulk import first,
- no advanced inventory first,
- simple product form first.

## Order Management

Admin dapat:

- melihat order list,
- membuka order detail,
- melihat customer/chat linked to order,
- melihat order items,
- melihat payment status,
- update fulfillment status.

Order detail should show:

```txt
Order id
Customer
Telegram handle/contact
Chat link
Items
Subtotal/total
Payment status
Fulfillment status
Created at
Updated at
```

## Payment Monitoring

Admin dapat:

- melihat payment pending/success/failed/expired,
- melihat provider transaction id,
- melihat payment webhook event history,
- melihat error webhook jika ada.

Admin tidak boleh manually mark paid kecuali role/permission khusus dan harus audit logged.

## Complaint Handling

Admin dapat:

- melihat complaint,
- membuka linked chat,
- update status complaint,
- add note if needed.

## Platform Setup

Owner/admin dapat:

- add Telegram platform,
- save bot token,
- set webhook,
- test webhook status,
- connect future platforms like WhatsApp/Instagram.

## Agent Setup

Admin dapat:

- manage AI prompt,
- manage knowledge,
- configure welcome message,
- set AI behavior,
- configure escalation behavior.

## Admin UX Principles

1. **Context first** — chat, customer, order, payment should be connected.
2. **Safe actions** — destructive actions need confirmation.
3. **Clear state** — payment/order status should be obvious.
4. **Workspace-safe** — admin only sees their workspace.
5. **AI transparency** — AI actions should be visible/logged.
