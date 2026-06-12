# Data Table Actions

## Purpose

This document defines table columns, filters, and actions needed for backend admin pages.

## Products Table

Columns:

- image
- name
- category
- base price
- status
- telegram visible
- variants count
- updated at
- actions

Filters:

- status
- category
- visibility
- search

Actions:

- view/edit
- publish
- archive
- duplicate
- delete

## Orders Table

Columns:

- order number/id
- customer/contact
- platform
- total amount
- order status
- payment status
- created at
- actions

Filters:

- status
- payment status
- platform
- date range
- customer search

Actions:

- view detail
- open chat
- update status
- cancel order
- send update

## Payments Table

Columns:

- payment id
- order id
- provider
- amount
- status
- provider reference
- created at
- paid at
- actions

Filters:

- status
- provider
- date range
- order id

Actions:

- view event timeline
- copy payment link
- refresh status
- manual action if allowed

## Chats Table/List

Fields:

- contact name
- platform
- last message
- unread
- assigned/takeover
- status
- tags
- last message at

Actions:

- open chat
- takeover
- resolve
- add tag
- delete

## Contacts Table

Columns:

- name
- platform
- handle/account id
- tags
- last seen
- notes
- created at

Actions:

- view
- edit tags
- edit notes
- open chat

## Platforms Table

Columns:

- type
- label
- enabled
- account id
- webhook status
- created at

Actions:

- edit
- set webhook
- test
- disable
- delete

## Webhook Events Table

Columns:

- provider
- event id
- status
- workspace
- related entity
- received at
- processed at
- error

Actions:

- view payload
- retry if safe
- mark ignored if needed
