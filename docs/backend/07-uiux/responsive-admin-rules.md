# Responsive Admin Rules

## Desktop First

Admin dashboard should be desktop-first because tables, chat inbox, and order operations need space.

## Minimum Responsive Requirements

### Mobile

Must support:

- login
- view dashboard summary
- open chat
- send reply
- take over chat
- view order status

May not fully support:

- complex product editing
- bulk operations
- detailed analytics

### Tablet

Should support:

- inbox
- order list
- product list
- basic forms

## Layout Rules

### Inbox

Desktop:

```txt
Chat list | Chat panel | Contact/order panel
```

Mobile:

```txt
Chat list → Chat panel → Detail panel
```

### Tables

On small screens:

- hide less important columns
- use card list layout
- keep status and primary action visible

### Forms

- stack fields vertically
- keep save button sticky if form is long
