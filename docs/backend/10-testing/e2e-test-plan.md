# E2E Test Plan

## Happy Path

```txt
Admin creates outlet
Admin creates product
Admin enables product for outlet
Customer starts Telegram
Customer selects outlet
Customer views product
Customer adds item to cart
Customer checks out
Payment link generated
Payment webhook marks paid
Admin filters Orders by outlet
Admin marks order processing/completed
```

## Multi-Outlet Case

Product available in Outlet A but not Outlet B.

Expected:

- not shown in Outlet B
- shown in Outlet A
