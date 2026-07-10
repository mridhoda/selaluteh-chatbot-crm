import test from 'node:test'
import assert from 'node:assert/strict'
import { buildReportRows, buildReportSummary } from '../../src/modules/reports/reportModel.js'

test('buildReportRows creates outlet report columns from real aggregates', () => {
  const rows = buildReportRows({
    dimension: 'outlet',
    metrics: ['revenue', 'orders', 'averageOrder'],
    outlets: [{ id: 'outlet-1', name: 'Samarinda' }],
    outletRows: [{ outletId: 'outlet-1', grossSales: 100000, orderCount: 4 }],
  })
  assert.deepEqual(rows, [{ key: 'outlet-1', label: 'Samarinda', revenue: 100000, orders: 4, averageOrder: 25000 }])
})

test('buildReportSummary totals selected metrics without introducing dummy values', () => {
  const summary = buildReportSummary([{ revenue: 100, orders: 2 }, { revenue: 50, orders: 1 }], ['revenue', 'orders'])
  assert.deepEqual(summary, { revenue: 150, orders: 3 })
})

test('product report uses quantity and product revenue', () => {
  const rows = buildReportRows({ dimension: 'product', metrics: ['quantity', 'revenue'], productRows: [{ productId: 'p1', productName: 'Soft Latte', quantitySold: 3, grossRevenue: 45000 }] })
  assert.equal(rows[0].label, 'Soft Latte')
  assert.equal(rows[0].quantity, 3)
  assert.equal(rows[0].revenue, 45000)
})
