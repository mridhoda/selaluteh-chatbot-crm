import { getSupabaseServiceClient } from '../db/supabase.js';
import { requireWorkspaceId } from '../db/supabase-query.js';
import { AppError } from '../utils/errors.js';

function applyOutletScope(query, outletIds) {
  return Array.isArray(outletIds) ? query.in('outlet_id', outletIds) : query;
}

export async function getDashboardSummary({ workspaceId, startDate, endDate, outletIds, timezone = 'Asia/Makassar' }) {
  requireWorkspaceId(workspaceId);
  const client = getSupabaseServiceClient();

  const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const end = endDate || new Date().toISOString();

  let query = client
    .from('orders')
    .select('id, order_number, status, payment_status, total_amount, paid_at, created_at, customer_name_snapshot, contacts(name), outlets(name)')
    .eq('workspace_id', workspaceId)
    .gte('created_at', start)
    .lte('created_at', end);
  query = applyOutletScope(query, outletIds);
  const { data: orders } = await query.order('created_at', { ascending: false });

  const totalOrders = orders?.length ?? 0;
  const paidOrders = orders?.filter(o => o.payment_status === 'paid') ?? [];
  const pendingPayment = orders?.filter(o => o.status !== 'cancelled' && o.payment_status !== 'paid') ?? [];
  const cancelled = orders?.filter(o => o.status === 'cancelled') ?? [];

  const grossSales = paidOrders.reduce((sum, o) => sum + Number(o.total_amount || 0), 0);
  const paidCount = paidOrders.length;

  return {
    orderCount: totalOrders,
    paidCount,
    pendingCount: pendingPayment.length,
    cancelledCount: cancelled.length,
    grossSales,
    period: { start, end },
    recentOrders: (orders || []).slice(0, 8).map((order) => ({
      id: order.id,
      orderNumber: order.order_number,
      customerName: order.contacts?.name || order.customer_name_snapshot || 'Customer',
      outletName: order.outlets?.name || '-',
      totalAmount: order.total_amount,
      paymentStatus: order.payment_status,
      status: order.status,
    })),
  };
}

export async function getOutletPerformance({ workspaceId, outletId, outletIds, startDate, endDate }) {
  requireWorkspaceId(workspaceId);
  const client = getSupabaseServiceClient();

  let q = client
    .from('orders')
    .select('id, outlet_id, status, payment_status, total_amount, created_at, outlets(name)')
    .eq('workspace_id', workspaceId);
  q = applyOutletScope(q, outletIds);
  if (outletId) q = q.eq('outlet_id', outletId);
  if (startDate) q = q.gte('created_at', startDate);
  if (endDate) q = q.lte('created_at', endDate);

  const { data: orders } = await q.order('created_at', { ascending: false });

  const map = {};
  for (const o of orders ?? []) {
    const key = o.outlet_id;
    if (!map[key]) map[key] = { outletId: key, outletName: o.outlets?.name || 'Outlet', orderCount: 0, paidCount: 0, grossSales: 0 };
    map[key].orderCount += 1;
    if (o.payment_status === 'paid') {
      map[key].paidCount += 1;
      map[key].grossSales += Number(o.total_amount || 0);
    }
  }

  return Object.values(map).sort((a, b) => b.grossSales - a.grossSales);
}

export async function getProductPerformance({ workspaceId, outletId, outletIds, startDate, endDate }) {
  requireWorkspaceId(workspaceId);
  const client = getSupabaseServiceClient();

  let q = client
    .from('order_items')
    .select('*, orders!inner(workspace_id, outlet_id, status, payment_status)');
  q = q.eq('orders.workspace_id', workspaceId);
  if (Array.isArray(outletIds)) q = q.in('orders.outlet_id', outletIds);
  if (outletId) q = q.eq('orders.outlet_id', outletId);
  if (startDate) q = q.gte('orders.created_at', startDate);
  if (endDate) q = q.lte('orders.created_at', endDate);

  const { data: items } = await q;

  const map = {};
  for (const item of items ?? []) {
    if (item.orders?.payment_status !== 'paid') continue;
    const key = item.product_id;
    if (!map[key]) {
      map[key] = {
        productId: key,
        productName: item.product_name_snapshot || 'Unknown',
        quantitySold: 0,
        grossRevenue: 0,
      };
    }
    map[key].quantitySold += item.quantity || 0;
    map[key].grossRevenue += Number(item.subtotal_amount || 0);
  }
  return Object.values(map).sort((a, b) => b.grossRevenue - a.grossRevenue);
}

export async function getChannelPerformance({ workspaceId, outletIds, startDate, endDate }) {
  requireWorkspaceId(workspaceId);
  const client = getSupabaseServiceClient();

  let q = client
    .from('orders')
    .select('id, channel_snapshot, payment_status, total_amount, created_at')
    .eq('workspace_id', workspaceId);
  q = applyOutletScope(q, outletIds);
  if (startDate) q = q.gte('created_at', startDate);
  if (endDate) q = q.lte('created_at', endDate);

  const { data: orders } = await q;

  const map = {};
  for (const o of orders ?? []) {
    const channel = o.channel_snapshot || 'direct';
    if (!map[channel]) map[channel] = { channel, orderCount: 0, paidCount: 0, grossSales: 0 };
    map[channel].orderCount += 1;
    if (o.payment_status === 'paid') {
      map[channel].paidCount += 1;
      map[channel].grossSales += Number(o.total_amount || 0);
    }
  }
  return Object.values(map).sort((a, b) => b.grossSales - a.grossSales);
}

export async function getDimensionPerformance({ workspaceId, dimension, outletId, startDate, endDate }) {
  requireWorkspaceId(workspaceId);
  const supported = ['status', 'paymentStatus', 'customer'];
  if (!supported.includes(dimension)) return [];
  const client = getSupabaseServiceClient();
  let q = client.from('orders').select('id, contact_id, status, payment_status, total_amount, outlet_id, created_at').eq('workspace_id', workspaceId);
  if (outletId) q = q.eq('outlet_id', outletId);
  if (startDate) q = q.gte('created_at', startDate);
  if (endDate) q = q.lte('created_at', endDate);
  const { data: orders } = await q;
  const contactIds = [...new Set((orders || []).map((order) => order.contact_id).filter(Boolean))];
  const contactNames = new Map();
  if (dimension === 'customer' && contactIds.length) {
    const { data: contacts } = await client.from('contacts').select('id, name').eq('workspace_id', workspaceId).in('id', contactIds);
    for (const contact of contacts || []) contactNames.set(String(contact.id), contact.name || String(contact.id));
  }
  const map = {};
  for (const order of orders || []) {
    const rawKey = dimension === 'status' ? order.status : dimension === 'paymentStatus' ? order.payment_status : order.contact_id;
    const key = rawKey || 'unknown';
    if (!map[key]) map[key] = { key, label: dimension === 'customer' ? (contactNames.get(String(key)) || key) : key, orderCount: 0, grossSales: 0 };
    map[key].orderCount += 1;
    if (String(order.payment_status).toLowerCase() === 'paid') map[key].grossSales += Number(order.total_amount || 0);
  }
  return Object.values(map).sort((a, b) => b.grossSales - a.grossSales);
}

export async function getPaymentMetrics({ workspaceId, startDate, endDate }) {
  requireWorkspaceId(workspaceId);
  const client = getSupabaseServiceClient();

  let q = client
    .from('payments')
    .select('id, status, reconciliation_status, amount, provider_fee, net_amount, created_at')
    .eq('workspace_id', workspaceId);
  if (startDate) q = q.gte('created_at', startDate);
  if (endDate) q = q.lte('created_at', endDate);

  const { data: payments } = await q;

  const paid = [], pending = [], failed = [], needsRecon = [];
  let grossAmount = 0, totalFee = 0, totalNet = 0;

  for (const p of payments ?? []) {
    const amt = Number(p.amount || 0);
    if (p.status === 'paid') {
      paid.push(p);
      grossAmount += amt;
      totalFee += Number(p.provider_fee ?? 0);
      totalNet += Number(p.net_amount ?? 0);
    } else if (['pending', 'created'].includes(p.status)) {
      pending.push(p);
    } else {
      failed.push(p);
    }
    if (['missing_webhook', 'unmatched', 'amount_mismatch'].includes(p.reconciliation_status)) {
      needsRecon.push(p);
    }
  }

  return {
    paid: { count: paid.length, grossAmount, totalFee, totalNet },
    pending: { count: pending.length },
    failedExpired: { count: failed.length },
    needsReconciliation: { count: needsRecon.length },
  };
}

export async function getCSVReport({ workspaceId, type, startDate, endDate }) {
  const encoder = new TextEncoder();
  const sep = ',';

  if (type === 'orders') {
    const client = getSupabaseServiceClient();
    let q = client.from('orders').select('*, order_items(*)').eq('workspace_id', workspaceId);
    if (startDate) q = q.gte('created_at', startDate);
    if (endDate) q = q.lte('created_at', endDate);
    const { data: orders } = await q.order('created_at', { ascending: false });

    const headers = 'order_number,status,payment_status,total_amount,currency,channel,created_at,paid_at\n';
    const rows = (orders ?? []).map(o =>
      [o.order_number, o.status, o.payment_status, o.total_amount, o.currency, o.channel_snapshot, o.created_at, o.paid_at].join(sep)
    ).join('\n');

    return { csv: headers + rows, filename: `orders-${startDate || 'all'}.csv` };
  }

  if (type === 'payments') {
    const client = getSupabaseServiceClient();
    let q = client.from('payments').select('*').eq('workspace_id', workspaceId);
    if (startDate) q = q.gte('created_at', startDate);
    if (endDate) q = q.lte('created_at', endDate);
    const { data: payments } = await q.order('created_at', { ascending: false });

    const headers = 'id,status,reconciliation_status,amount,provider_fee,net_amount,currency,provider,created_at\n';
    const rows = (payments ?? []).map(p =>
      [p.id, p.status, p.reconciliation_status, p.amount, p.provider_fee, p.net_amount, p.currency, p.provider, p.created_at].join(sep)
    ).join('\n');

    return { csv: headers + rows, filename: `payments-${startDate || 'all'}.csv` };
  }

  throw new AppError('INVALID_REPORT_TYPE', `Unknown report type: ${type}`, 400, null, null);
}
