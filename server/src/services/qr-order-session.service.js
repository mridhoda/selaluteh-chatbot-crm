import { qrOrderSessionsRepository } from '../db/repositories/qr-order-sessions.supabase.repository.js';
import { AppError } from '../utils/errors.js';

export async function getQrContext({ qrToken }) {
  const session = await qrOrderSessionsRepository.findActiveByToken({ token: qrToken });
  if (!session) throw new AppError('QR_NOT_FOUND', 'QR session not found', 404);
  if (session.expiresAt && new Date(session.expiresAt).getTime() <= Date.now()) {
    throw new AppError('QR_EXPIRED', 'QR session has expired', 410);
  }

  return {
    qr_token: qrToken,
    outlet_id: session.outletId,
    outlet_name: session.outlet?.name || null,
    table_id: session.tableId || null,
    table_label: session.tableLabel || null,
    location_label: session.locationLabel || null,
    fulfillment_type: session.fulfillmentType || 'pickup',
    expires_at: session.expiresAt || null,
    is_active: session.isActive !== false,
  };
}
