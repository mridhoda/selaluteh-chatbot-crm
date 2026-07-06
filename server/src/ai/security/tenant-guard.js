export const AUTHORITY_FIELDS = new Set([
  'workspaceId', 'workspace_id', 'channelConnectionId', 'channel_connection_id',
  'conversationId', 'conversation_id', 'contactId', 'contact_id', 'outletId', 'outlet_id',
  'cartId', 'cart_id', 'checkoutId', 'checkout_id', 'orderId', 'order_id',
  'unitPrice', 'unit_price', 'effectivePrice', 'effective_price', 'basePrice', 'base_price',
  'subtotal', 'subtotalAmount', 'subtotal_amount', 'total', 'totalAmount', 'total_amount',
  'paymentStatus', 'payment_status', 'provider', 'paymentProvider', 'payment_provider',
]);

const PUBLIC_TENANT_ERROR_MESSAGE = 'Data tidak tersedia untuk konteks percakapan ini.';

function createGuardError(code, message, publicMessage = message) {
  const error = new Error(`${code}: ${message}`);
  error.code = code;
  error.publicMessage = publicMessage;
  return error;
}

export function assertNoAuthorityFields(payload, path = []) {
  if (!payload || typeof payload !== 'object') return;

  if (Array.isArray(payload)) {
    payload.forEach((item, index) => assertNoAuthorityFields(item, [...path, String(index)]));
    return;
  }

  for (const [key, value] of Object.entries(payload)) {
    if (AUTHORITY_FIELDS.has(key)) {
      throw createGuardError(
        'AI_TOOL_AUTHORITY_FIELD_REJECTED',
        `Model-supplied authority field rejected at ${[...path, key].join('.')}`,
        'Permintaan tidak dapat diproses karena berisi field otoritatif.',
      );
    }
    assertNoAuthorityFields(value, [...path, key]);
  }
}

function assertMatches({ actual, expected, code = 'AI_CONTEXT_TENANT_MISMATCH' }) {
  if (expected == null || actual == null) return;
  if (actual !== expected) {
    throw createGuardError(code, 'AI context tenant mismatch', PUBLIC_TENANT_ERROR_MESSAGE);
  }
}

export function assertTenantConsistency({ context = {}, entities = {} } = {}) {
  const { connection, conversation, contact, outlet, cart, checkout } = entities;
  const workspaceId = context.workspaceId;

  for (const entity of [connection, conversation, contact, outlet, cart, checkout]) {
    if (entity?.workspaceId || entity?.workspace_id) {
      assertMatches({ actual: entity.workspaceId || entity.workspace_id, expected: workspaceId });
    }
  }

  assertMatches({ actual: connection?.id, expected: context.channelConnectionId });
  assertMatches({ actual: conversation?.id, expected: context.conversationId });
  assertMatches({ actual: conversation?.channelConnectionId || conversation?.channel_connection_id, expected: context.channelConnectionId });
  assertMatches({ actual: conversation?.contactId || conversation?.contact_id, expected: context.contactId });
  assertMatches({ actual: contact?.id, expected: context.contactId });
  assertMatches({ actual: outlet?.id, expected: context.selectedOutletId });
  assertMatches({ actual: cart?.id, expected: context.activeCartId });
  assertMatches({ actual: cart?.outletId || cart?.outlet_id, expected: context.selectedOutletId });
  assertMatches({ actual: cart?.contactId || cart?.contact_id, expected: context.contactId });
  assertMatches({ actual: checkout?.id, expected: context.checkoutId });
  assertMatches({ actual: checkout?.cartId || checkout?.cart_id, expected: context.activeCartId });
  assertMatches({ actual: checkout?.contactId || checkout?.contact_id, expected: context.contactId });
}
