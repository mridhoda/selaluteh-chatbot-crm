# Troubleshooting

## User Cannot See Orders

Check:

- workspace membership
- outlet access
- requested outlet_id
- order.outlet_id
- API access validation

## Product Not Showing in Telegram

Check:

- outlet selected
- outlet active
- product active
- product telegram_visible
- product_outlet_availability exists
- is_available = true

## Payment Updated Wrong Order

Check:

- provider reference mapping
- payment.order_id
- payment.outlet_id
- order.outlet_id
- webhook idempotency
