# Filters, Search, and Sort

## Purpose

Define filter/search/sort needs so backend can provide proper query support.

## Products

Search:

- name
- sku
- description

Filters:

- status
- category
- visibility
- stock status

Sort:

- created_at
- updated_at
- name
- price
- sort_order

## Orders

Search:

- order id
- customer name
- platform account id

Filters:

- order status
- payment status
- platform
- date range

Sort:

- created_at desc
- updated_at desc
- total amount

## Payments

Search:

- payment id
- provider reference
- order id

Filters:

- provider
- status
- date range

Sort:

- created_at desc
- paid_at desc
- amount

## Chats

Search:

- contact name
- last message
- platform account id

Filters:

- platform
- unread
- assigned/takeover
- status
- tags
- escalated

Sort:

- last_message_at desc

## Webhook Events

Search:

- event id
- provider reference
- related entity id

Filters:

- provider
- status
- date range

Sort:

- received_at desc
