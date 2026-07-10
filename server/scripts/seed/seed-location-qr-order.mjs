/**
 * seed-location-qr-order.mjs
 *
 * Dev-only visual verification seed for the legacy Orders UI.
 * Inserts or updates exactly one Location QR order that should render as:
 *   Universal QR
 *
 * Requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in the environment.
 * Run from server/ so dotenv can load server/.env:
 *   node scripts/seed/seed-location-qr-order.mjs
 *   node scripts/seed/seed-location-qr-order.mjs --dry-run
 */

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const isDryRun = process.argv.includes('--dry-run');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const ORDER_NUMBER = 'SLTH-LOCATION-QR-A3';
const CUSTOMER_NAME = 'Jarni';
const CUSTOMER_PHONE = '6285347731924';
const LOCATION_LABEL = 'Table A3';
const TABLE_CODE = 'A3';
const ITEM_NAME = 'Es Teh Original';
const TOTAL_AMOUNT = 1000;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('ERROR: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in server/.env');
  process.exit(1);
}

const client = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

function log(message) {
  console.log(`${isDryRun ? '[DRY-RUN]' : '[SEED]'} ${message}`);
}

function requireRow(row, label) {
  if (!row?.id) throw new Error(`${label} not found`);
  return row;
}

function isMissingOptionalColumn(error) {
  return error?.code === '42703' || error?.code === 'PGRST204' || /column .* does not exist/i.test(error?.message || '');
}

function isMissingOptionalRelation(error) {
  return isMissingOptionalColumn(error) || error?.code === '42P01' || error?.code === 'PGRST205' || /relation .* does not exist/i.test(error?.message || '');
}

function isInvalidEnumValue(error) {
  return error?.code === '22P02' || /invalid input value for enum/i.test(error?.message || '');
}

async function maybeSingleOrThrow(query, label) {
  const { data, error } = await query.maybeSingle();
  if (error) throw new Error(`${label} failed: ${error.message}`);
  return data;
}

async function singleOrThrow(query, label) {
  const { data, error } = await query.single();
  if (error) throw new Error(`${label} failed: ${error.message}`);
  return data;
}

async function findWorkspace() {
  const demoWorkspace = await maybeSingleOrThrow(
    client.from('workspaces').select('id, name').eq('name', 'SelaluTeh Demo').order('created_at', { ascending: true }).limit(1),
    'find SelaluTeh Demo workspace',
  );
  if (demoWorkspace) return demoWorkspace;

  return requireRow(
    await singleOrThrow(
      client.from('workspaces').select('id, name').eq('status', 'active').order('created_at', { ascending: true }).limit(1),
      'find first active workspace',
    ),
    'Active workspace',
  );
}

async function findOutlet(workspaceId) {
  return requireRow(
    await singleOrThrow(
      client
        .from('outlets')
        .select('id, name, code')
        .eq('workspace_id', workspaceId)
        .eq('status', 'active')
        .order('created_at', { ascending: true })
        .limit(1),
      'find active outlet',
    ),
    'Active outlet',
  );
}

async function upsertContact(workspaceId, outletId) {
  const externalId = `location-qr-demo-${CUSTOMER_PHONE}`;
  const existing = await maybeSingleOrThrow(
    client.from('contacts').select('id').eq('workspace_id', workspaceId).eq('external_id', externalId),
    'find demo contact',
  );

  const payload = {
    workspace_id: workspaceId,
    platform_id: null,
    external_id: externalId,
    name: CUSTOMER_NAME,
    phone: CUSTOMER_PHONE,
    handle: null,
    last_outlet_id: outletId,
    metadata: { seed: 'location_qr_order_demo' },
  };

  if (isDryRun) {
    log(`${existing ? 'Would update' : 'Would create'} contact ${CUSTOMER_NAME} (${CUSTOMER_PHONE})`);
    return { id: existing?.id || 'dry-run-contact-id' };
  }

  if (existing) {
    return singleOrThrow(
      client.from('contacts').update(payload).eq('id', existing.id).select('id').single(),
      'update demo contact',
    );
  }

  return singleOrThrow(client.from('contacts').insert(payload).select('id').single(), 'create demo contact');
}

async function upsertQrLocation(workspaceId, outletId) {
  const existingResult = await client
    .from('qr_locations')
    .select('id, label, code')
    .eq('workspace_id', workspaceId)
    .eq('outlet_id', outletId)
    .eq('code', TABLE_CODE)
    .maybeSingle();

  if (existingResult.error) {
    if (isMissingOptionalRelation(existingResult.error)) {
      log('qr_locations table is not available; order will still use qr_location_label=Table A3.');
      return null;
    }
    throw new Error(`find QR location failed: ${existingResult.error.message}`);
  }

  const existing = existingResult.data;

  const payload = {
    workspace_id: workspaceId,
    outlet_id: outletId,
    location_type: 'table',
    label: LOCATION_LABEL,
    code: TABLE_CODE,
    default_fulfillment_type: 'dine_in',
    sort_order: 3,
    status: 'active',
    metadata: { seed: 'location_qr_order_demo' },
  };

  if (isDryRun) {
    log(`${existing ? 'Would update' : 'Would create'} QR location ${LOCATION_LABEL}`);
    return { id: existing?.id || 'dry-run-qr-location-id' };
  }

  if (existing) {
    const { data, error } = await client.from('qr_locations').update(payload).eq('id', existing.id).select('id').single();
    if (error) {
      if (isMissingOptionalRelation(error)) return null;
      throw new Error(`update QR location failed: ${error.message}`);
    }
    return data;
  }

  const { data, error } = await client.from('qr_locations').insert(payload).select('id').single();
  if (error) {
    if (isMissingOptionalRelation(error)) return null;
    throw new Error(`create QR location failed: ${error.message}`);
  }
  return data;
}

function orderPayload({ workspace, outlet, contact, qrLocation, source = 'public_store' }) {
  const seededAt = new Date().toISOString();
  return {
    workspace_id: workspace.id,
    outlet_id: outlet.id,
    contact_id: contact.id,
    platform_id: null,
    chat_id: null,
    agent_id: null,
    cart_id: null,
    checkout_id: null,
    outlet_name_snapshot: outlet.name || outlet.code || '',
    order_number: ORDER_NUMBER,
    source,
    status: 'PREPARING',
    public_order_token: 'demo-location-qr-a3-token',
    channel: 'qr_store',
    qr_session_id: null,
    table_id: qrLocation?.id || null,
    qr_location_id: qrLocation?.id || null,
    qr_location_label: LOCATION_LABEL,
    fulfillment_type: 'dine_in',
    payment_status: 'paid',
    fulfillment_status: 'preparing',
    customer_name_snapshot: CUSTOMER_NAME,
    customer_phone_snapshot: CUSTOMER_PHONE,
    channel_snapshot: 'Location QR',
    customer_snapshot: {
      name: CUSTOMER_NAME,
      contactName: CUSTOMER_NAME,
      phone: CUSTOMER_PHONE,
      source: 'location_qr_demo_seed',
    },
    fulfillment_snapshot: {
      type: 'dine_in',
      locationLabel: LOCATION_LABEL,
      tableLabel: LOCATION_LABEL,
      tableCode: TABLE_CODE,
      customerNote: 'Demo Location QR order for legacy Orders UI verification.',
    },
    subtotal_amount: TOTAL_AMOUNT,
    discount_amount: 0,
    delivery_fee: 0,
    total_amount: TOTAL_AMOUNT,
    currency: 'IDR',
    payment_method: 'demo_paid',
    notes: 'Dev-only Location QR seed order. Safe to update or delete.',
    form_data: { source: 'location_qr_demo_seed', location_label: LOCATION_LABEL, table_code: TABLE_CODE },
    paid_at: seededAt,
    created_at: seededAt,
    updated_at: seededAt,
    metadata: {
      seed: 'location_qr_order_demo',
      qrScope: 'universal',
      qrType: 'universal',
      expected_legacy_label: 'Universal QR',
    },
  };
}

async function writeOrder(payload, existingOrderId = null) {
  const withoutOptionalOrderColumns = (nextPayload) => {
    const fallback = { ...nextPayload };
    delete fallback.qr_location_id;
    delete fallback.fulfillment_type;
    return fallback;
  };

  const insertOrUpdate = async (nextPayload) => {
    if (existingOrderId) {
      return singleOrThrow(
        client.from('orders').update(nextPayload).eq('id', existingOrderId).select('id, order_number').single(),
        'update demo order',
      );
    }
    return singleOrThrow(client.from('orders').insert(nextPayload).select('id, order_number').single(), 'create demo order');
  };

  try {
    return await insertOrUpdate(payload);
  } catch (error) {
    if (isInvalidEnumValue(error) && payload.source === 'public_store') {
      log('Target schema rejected source=public_store; retrying with source=custom and channel=qr_store.');
      try {
        return await insertOrUpdate({ ...payload, source: 'custom' });
      } catch (fallbackError) {
        if (isMissingOptionalColumn(fallbackError)) return insertOrUpdate(withoutOptionalOrderColumns({ ...payload, source: 'custom' }));
        throw fallbackError;
      }
    }
    if (isMissingOptionalColumn(error)) {
      return insertOrUpdate(withoutOptionalOrderColumns(payload));
    }
    throw error;
  }
}

async function refreshOrderItem(workspaceId, orderId) {
  const itemPayload = {
    workspace_id: workspaceId,
    order_id: orderId,
    product_id: null,
    variant_id: null,
    product_name_snapshot: ITEM_NAME,
    unit_price: TOTAL_AMOUNT,
    quantity: 1,
    subtotal_amount: TOTAL_AMOUNT,
    metadata: { seed: 'location_qr_order_demo' },
  };

  if (isDryRun) {
    log(`Would replace order_items for ${ORDER_NUMBER} with 1 x ${ITEM_NAME}`);
    return;
  }

  const { error: deleteError } = await client.from('order_items').delete().eq('workspace_id', workspaceId).eq('order_id', orderId);
  if (deleteError) throw new Error(`delete existing demo order items failed: ${deleteError.message}`);

  const { error: insertError } = await client.from('order_items').insert(itemPayload);
  if (insertError) throw new Error(`insert demo order item failed: ${insertError.message}`);
}

async function main() {
  console.log('='.repeat(72));
  console.log('SelaluTeh Location QR demo order seed');
  if (isDryRun) console.log('DRY RUN MODE - no changes will be made');
  console.log('='.repeat(72));

  const workspace = await findWorkspace();
  const outlet = await findOutlet(workspace.id);
  const contact = await upsertContact(workspace.id, outlet.id);
  const qrLocation = await upsertQrLocation(workspace.id, outlet.id);

  const existingOrder = await maybeSingleOrThrow(
    client.from('orders').select('id, order_number').eq('workspace_id', workspace.id).eq('order_number', ORDER_NUMBER),
    'find existing demo order',
  );

  log(`${existingOrder ? 'Updating' : 'Creating'} ${ORDER_NUMBER} in workspace "${workspace.name}" and outlet "${outlet.name || outlet.code}".`);

  if (isDryRun) {
    log(`Would upsert paid QR order for ${CUSTOMER_NAME} (${CUSTOMER_PHONE}) at ${LOCATION_LABEL}.`);
  } else {
    const order = await writeOrder(orderPayload({ workspace, outlet, contact, qrLocation }), existingOrder?.id || null);
    await refreshOrderItem(workspace.id, order.id);
    log(`Seeded order ${order.order_number} (${order.id}).`);
  }

  console.log('='.repeat(72));
  console.log('Run the app, open /app/orders, and look for:');
  console.log(`  ${ORDER_NUMBER}`);
  console.log('  Universal QR');
  console.log(`  Customer: ${CUSTOMER_NAME} / ${CUSTOMER_PHONE}`);
  console.log('='.repeat(72));
}

main().catch((error) => {
  console.error('Seed failed:', error.message);
  process.exit(1);
});
