export const REPORT_DIMENSIONS = [
  { id: 'outlet', label: 'Toko / Outlet' },
  { id: 'product', label: 'Produk' },
  { id: 'channel', label: 'Channel' },
  { id: 'paymentStatus', label: 'Status pembayaran' },
  { id: 'status', label: 'Status pesanan' },
  { id: 'customer', label: 'Nama Pelanggan' },
]

export const REPORT_METRICS = [
  { id: 'revenue', label: 'Pendapatan' },
  { id: 'orders', label: 'Jumlah pesanan' },
  { id: 'quantity', label: 'Jumlah item' },
  { id: 'averageOrder', label: 'Rata-rata pesanan' },
  { id: 'discount', label: 'Diskon' },
  { id: 'tax', label: 'Pajak' },
  { id: 'shipping', label: 'Pengiriman' },
  { id: 'refund', label: 'Pengembalian Dana' },
]

export const getDimensionLabel = (id) => REPORT_DIMENSIONS.find((item) => item.id === id)?.label || id
export const getMetricLabel = (id) => REPORT_METRICS.find((item) => item.id === id)?.label || id

export function buildReportRows({ dimension, metrics, outlets = [], outletRows = [], productRows = [], channelRows = [], genericRows = [] }) {
  let source = []
  if (dimension === 'outlet') {
    source = outletRows.map((row) => ({
      key: row.outletId || 'unknown',
      label: outlets.find((outlet) => outlet.id === row.outletId)?.name || row.outletName || 'Outlet tidak diketahui',
      revenue: Number(row.grossSales || 0), orders: Number(row.orderCount || 0), quantity: 0,
    }))
  } else if (dimension === 'product') {
    source = productRows.map((row) => ({ key: row.productId || row.productName, label: row.productName || 'Produk tidak diketahui', revenue: Number(row.grossRevenue || 0), orders: 0, quantity: Number(row.quantitySold || 0) }))
  } else if (dimension === 'channel') {
    source = channelRows.map((row) => ({ key: row.channel || 'unknown', label: row.channel || 'Channel tidak diketahui', revenue: Number(row.grossSales || 0), orders: Number(row.orderCount || 0), quantity: 0 }))
  } else {
    source = genericRows.map((row) => ({ key: row.key, label: row.label, revenue: Number(row.grossSales || 0), orders: Number(row.orderCount || 0), quantity: 0 }))
  }
  return source.map((row) => {
    const result = { key: row.key, label: row.label }
    metrics.forEach((metric) => {
      if (metric === 'averageOrder') result[metric] = row.orders ? row.revenue / row.orders : 0
      else result[metric] = row[metric] ?? 0
    })
    return result
  })
}

export function buildReportSummary(rows, metrics) {
  return metrics.reduce((summary, metric) => {
    summary[metric] = rows.reduce((total, row) => total + Number(row[metric] || 0), 0)
    return summary
  }, {})
}
