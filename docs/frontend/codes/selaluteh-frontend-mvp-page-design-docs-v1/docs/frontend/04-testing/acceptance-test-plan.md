# Frontend Acceptance Test Plan

## Global

- [ ] All five routes render inside existing dashboard layout.
- [ ] Sidebar active state is correct.
- [ ] Workspace/outlet context is preserved.
- [ ] Default filters do not render redundant active-filter strip.
- [ ] Non-default filters render removable chips.
- [ ] Loading, empty, filtered-empty, error, and unauthorized states exist.
- [ ] Drawers/modals are keyboard accessible.
- [ ] Build passes.
- [ ] Lint has no errors.

## Products

- [ ] Owner can open Add Product.
- [ ] Required field validation works.
- [ ] Product status differs from outlet availability.
- [ ] Outlet availability matrix respects permissions.
- [ ] Archive confirmation appears.
- [ ] Search and filters combine correctly.

## Payments

- [ ] Payment list is outlet/date/status aware.
- [ ] Detail drawer shows order and event timeline.
- [ ] No manual mark-paid control exists.
- [ ] Link actions only appear in valid states.
- [ ] Secret/provider payload values are redacted.

## Chat

- [ ] Existing list/messages/send work.
- [ ] Unread resets as intended.
- [ ] Human takeover stops AI.
- [ ] Resolve/reopen behavior is correct.
- [ ] Outlet/order/payment context is visible.
- [ ] Polling does not duplicate messages.

## Settings

- [ ] Section-level dirty/save state works.
- [ ] Unsaved changes warning works.
- [ ] Secret field stays masked and write-only.
- [ ] Permission-restricted sections are protected.
- [ ] Provider test shows timestamp/result.

## Connected Platforms

- [ ] List and detail load.
- [ ] Connection and webhook health are separate.
- [ ] Telegram setup does not reveal token after save.
- [ ] Test/setWebhook feedback is clear.
- [ ] Disconnect requires confirmation.
- [ ] Unsupported capabilities are not shown as complete.
