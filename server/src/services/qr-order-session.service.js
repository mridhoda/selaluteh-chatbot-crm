import { qrOrderSessionsRepository } from '../db/repositories/qr-order-sessions.supabase.repository.js';
import { outletsSupabaseRepository as outletsRepository } from '../db/repositories/outlets.supabase.repository.js';
import { AppError } from '../utils/errors.js';
import { listCustomerProductsForOutlet } from './product.service.js';

export async function getQrContext({ qrToken }) {
  const qrCode = await qrOrderSessionsRepository.findActiveQrCodeByToken({ token: qrToken });
  const qrSession = qrCode ? null : await qrOrderSessionsRepository.findActiveByToken({ token: qrToken });
  const contextRecord = qrCode || qrSession;
  if (!contextRecord) throw new AppError('QR_INVALID', 'QR session not found', 404);
  if (qrSession?.sessionStatus && qrSession.sessionStatus !== 'active') throw new AppError('QR_INVALID', 'QR session not found', 404);
  if (contextRecord.expiresAt && new Date(contextRecord.expiresAt).getTime() <= Date.now()) {
    throw new AppError('QR_EXPIRED', 'QR session has expired', 410);
  }
  if (contextRecord.revokedAt) throw new AppError('QR_REVOKED', 'QR session has been revoked', 410);

  return {
    qr_token: qrToken,
    outlet_id: contextRecord.outletId,
    outlet_name: contextRecord.outlet?.name || null,
    table_id: qrSession?.tableId || null,
    table_label: qrSession?.tableLabel || null,
    location_label: contextRecord.qrLocation?.label || qrSession?.locationLabel || null,
    fulfillment_type: contextRecord.qrLocation?.defaultFulfillmentType || qrSession?.fulfillmentType || 'pickup',
    expires_at: contextRecord.expiresAt || null,
    is_active: contextRecord.isActive !== false,
  };
}

function toQrMenuProduct(product) {
  const availability = product.outletAvailability || {};
  const price = Number(availability.priceOverride ?? product.basePrice ?? product.price ?? 0);
  return {
    id: product.id,
    name: product.name,
    description: product.shortDescription || product.description || '',
    category: product.category || product.metadata?.category || 'Menu',
    image_url: product.thumbnailUrl || null,
    currency: product.currency || 'IDR',
    unit_price: price,
    availability: 'available',
  };
}

function inferQrScope(contextRecord = {}) {
  const rawScope = contextRecord.scope || contextRecord.qrType || contextRecord.qr_type || contextRecord.metadata?.scope || contextRecord.metadata?.qr_scope || contextRecord.metadata?.qrScope || contextRecord.metadata?.qr_type || contextRecord.metadata?.qrType;
  const normalizedScope = String(rawScope || '').trim().toLowerCase();
  if (['universal', 'outlet', 'location'].includes(normalizedScope)) return normalizedScope;
  if (['universal_qr', 'global', 'any_outlet'].includes(normalizedScope)) return 'universal';
  if (['outlet_qr', 'store', 'store_qr'].includes(normalizedScope)) return 'outlet';
  if (['location_qr', 'table', 'table_qr'].includes(normalizedScope)) return 'location';
  if (contextRecord.qrLocation || contextRecord.qrLocationId || contextRecord.lockedLocationId) return 'location';
  return 'outlet';
}

function isOutletOrderableForQr(outlet) {
  if (!outlet) return false;
  if (String(outlet.status || '').toLowerCase() !== 'active') return false;
  const metadata = outlet.metadata || {};
  return metadata.orderingEnabled !== false && metadata.ordering_enabled !== false && metadata.acceptsOrders !== false && metadata.pickupEnabled !== false;
}

function toSelectableOutlet(outlet = {}) {
  return {
    id: outlet.id,
    name: outlet.name || null,
    address: outlet.address || null,
    city: outlet.city || null,
    is_open: String(outlet.status || '').toLowerCase() === 'active',
    ordering_enabled: isOutletOrderableForQr(outlet),
  };
}

function buildQrStoreContextResponse({ contextRecord, qrCodeRecord = null, qrSessionRecord = null, selectedOutlet = null, selectableOutlets = [], products = [] }) {
  const publicProducts = products.map(toQrMenuProduct);
  const categoryNames = [...new Set(publicProducts.map((product) => product.category || 'Menu'))];
  const scope = inferQrScope(contextRecord);
  const lockedOutlet = contextRecord.outlet || null;
  const outlet = selectedOutlet || lockedOutlet || null;
  const qrLocation = contextRecord.qrLocation || null;

  return {
    qr_session: {
      id: qrSessionRecord?.id || null,
      workspace_id: contextRecord.workspaceId,
      qr_code_id: qrCodeRecord?.id || qrSessionRecord?.qrCodeId || qrSessionRecord?.qrCode?.id || qrSessionRecord?.metadata?.qrCodeId || null,
      channel: 'qr_store',
      outlet_locked: scope !== 'universal',
      scope,
      qr_type: scope,
      expires_at: contextRecord.expiresAt || null,
    },
    outlet: outlet ? toSelectableOutlet(outlet) : null,
    outlets: selectableOutlets.map(toSelectableOutlet),
    qr_context: {
      location_type: qrLocation?.locationType || (scope === 'location' ? 'table' : 'pickup'),
      location_label: qrLocation?.label || qrSessionRecord?.locationLabel || qrSessionRecord?.tableLabel || null,
      table_id: qrSessionRecord?.tableId || null,
      fulfillment_type: qrLocation?.defaultFulfillmentType || qrSessionRecord?.fulfillmentType || 'pickup',
      qr_location_id: qrLocation?.id || qrSessionRecord?.qrLocationId || contextRecord.lockedLocationId || null,
    },
    menu: {
      categories: categoryNames.map((name, index) => ({ id: `cat_${index + 1}`, name })),
      products: publicProducts,
    },
  };
}

export async function getQrStoreContext({ qrToken, outletId = null }) {
  const qrCodeRecord = await qrOrderSessionsRepository.findActiveQrCodeByToken({ token: qrToken });
  const qrSessionRecord = qrCodeRecord ? null : await qrOrderSessionsRepository.findActiveByToken({ token: qrToken });
  const contextRecord = qrCodeRecord || qrSessionRecord;
  if (!contextRecord) throw new AppError('QR_INVALID', 'QR tidak valid. Silakan scan ulang QR resmi dari outlet.', 404);
  if (qrSessionRecord?.sessionStatus && qrSessionRecord.sessionStatus !== 'active') throw new AppError('QR_INVALID', 'QR tidak valid. Silakan scan ulang QR resmi dari outlet.', 404);
  if (contextRecord.expiresAt && new Date(contextRecord.expiresAt).getTime() <= Date.now()) {
    throw new AppError('QR_EXPIRED', 'QR sudah kedaluwarsa. Silakan scan ulang QR terbaru.', 410);
  }
  if (contextRecord.revokedAt) throw new AppError('QR_REVOKED', 'QR sudah tidak aktif. Silakan scan ulang QR resmi dari outlet.', 410);
  const scope = inferQrScope(contextRecord);
  const lockedOutletId = contextRecord.outletId || contextRecord.lockedOutletId || contextRecord.qrCode?.outletId || null;
  let selectedOutlet = contextRecord.outlet || null;
  let selectableOutlets = [];

  if (scope === 'universal') {
    selectableOutlets = (await outletsRepository.listActiveOutlets({ workspaceId: contextRecord.workspaceId })).filter(isOutletOrderableForQr);
    if (outletId) {
      selectedOutlet = selectableOutlets.find((outlet) => String(outlet.id) === String(outletId)) || null;
      if (!selectedOutlet) throw new AppError('QR_OUTLET_UNAVAILABLE', 'Outlet pilihan tidak tersedia untuk QR ini.', 409);
    } else {
      selectedOutlet = null;
    }
  } else {
    if (outletId && String(outletId) !== String(lockedOutletId)) {
      throw new AppError('QR_OUTLET_MISMATCH', 'QR ini hanya berlaku untuk outlet yang tertera.', 409);
    }
    if (!isOutletOrderableForQr(selectedOutlet)) {
      throw new AppError('QR_OUTLET_UNAVAILABLE', 'Outlet untuk QR ini sedang tidak tersedia.', 409);
    }
  }

  const products = selectedOutlet
    ? (await listCustomerProductsForOutlet({ workspaceId: contextRecord.workspaceId, outletId: selectedOutlet.id, page: 0, limit: 200 })).products
    : [];
  return buildQrStoreContextResponse({ contextRecord, qrCodeRecord, qrSessionRecord, selectedOutlet, selectableOutlets, products });
}

export async function expireQrSessions({ now = new Date() } = {}, deps = {}) {
  const repo = deps.qrOrderSessionsRepository || qrOrderSessionsRepository;
  const expired = await repo.expireOldSessions(now);
  return { expiredCount: expired.length, sessions: expired };
}

export const qrOrderSessionInternals = {
  buildQrStoreContextResponse,
  inferQrScope,
  isOutletOrderableForQr,
  toQrMenuProduct,
};
