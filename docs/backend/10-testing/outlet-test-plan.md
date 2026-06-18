# Outlet Test Plan

## Access Tests

- owner can view all outlets
- admin can view all outlets
- outlet manager sees assigned outlet only
- human agent sees assigned outlet chats only
- unauthorized outlet query returns 403/404

## Telegram Tests

- [x] customer must choose outlet before product list
- [x] inactive outlet not shown
- [x] product list filtered by outlet availability
- switch outlet with active cart requires confirmation
- cart cannot mix outlets

## Cart/Checkout Tests

- cart has outlet_id
- checkout copies outlet_id
- order copies outlet_id
- payment copies outlet_id
- unavailable product cannot be added

## Payment Tests

- payment webhook updates correct outlet order
- duplicate webhook ignored
- amount mismatch rejected/logged
