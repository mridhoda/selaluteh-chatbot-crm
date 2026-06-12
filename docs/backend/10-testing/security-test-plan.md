# Security Test Plan

## Workspace Isolation

- workspace A user cannot access workspace B orders/payments/outlets

## Outlet Isolation

- outlet A manager cannot list outlet B orders
- outlet A manager cannot view outlet B payment
- outlet A manager cannot update outlet B order
- outlet A manager cannot view outlet B chat

## AI Security

- AI cannot checkout without outlet
- AI cannot bypass product availability
- AI cannot mark payment paid
