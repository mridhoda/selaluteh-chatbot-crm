import express from 'express';
import { randomBytes } from 'node:crypto';
import multer from 'multer';
import { authRequired, attachUser } from '../middleware/auth.js';
import { attachWorkspaceContext } from '../middleware/workspaceContext.js';
import { authorizePermission } from '../middleware/authorization.js';
import { uploadRateLimit } from '../middleware/rate-limit.js';
import { getSupabaseServiceClient } from '../db/supabase.js';
import { hashQrToken } from '../db/repositories/qr-order-sessions.supabase.repository.js';
import { storefrontsRepository } from '../db/repositories/index.js';
import { uploadFile } from '../services/file.service.js';

const router = express.Router();
const upload = multer({
  dest: 'uploads/tmp/',
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
});
const OPTIONAL_SCHEMA_ERRORS = new Set(['42P01', '42703', 'PGRST200', 'PGRST201', 'PGRST205']);

router.use(authRequired, attachUser, attachWorkspaceContext, authorizePermission('products', 'read'));

function isOptionalSchemaError(error) {
  return OPTIONAL_SCHEMA_ERRORS.has(error?.code) || /could not find|does not exist|schema cache/i.test(error?.message || '');
}

function firstPresent(...values) {
  return values.find((value) => value !== undefined && value !== null && value !== '') ?? null;
}

function publicQrPath(token) {
  return `/qr/${encodeURIComponent(token)}`;
}

function storefrontPath(storefront) {
  return storefront?.slug ? `/store/${encodeURIComponent(storefront.slug)}` : null;
}

function normalizeStorefrontTarget(value) {
  if (!value) return null;
  return /\/store\/[^/?#]+$/i.test(value) ? `${value}/` : value;
}

function isOnlineStoreQr(row = {}) {
  const source = String(row.metadata?.createdFrom || row.metadata?.created_from || row.metadata?.source || '').trim().toLowerCase();
  return source === 'admin_online_store' || source === 'online_store_flow_test';
}

function normalizeScope(row = {}) {
  const raw = firstPresent(row.qr_scope, row.qrScope, row.scope, row.qr_type, row.qrType, row.type, row.metadata?.qrScope, row.metadata?.qr_scope, row.metadata?.qrType, row.metadata?.qr_type);
  const normalized = String(raw || '').trim().toLowerCase();
  if (['universal', 'universal_qr', 'global', 'any_outlet'].includes(normalized)) return 'universal';
  if (['outlet', 'outlet_qr', 'store', 'store_qr'].includes(normalized)) return 'outlet';
  if (['location', 'location_qr', 'table', 'table_qr'].includes(normalized)) return 'location';
  return row.qr_location_id || row.qrLocationId || row.qr_locations ? 'location' : row.outlet_id || row.outletId || row.outlets ? 'outlet' : 'universal';
}

function scopeLabel(scope) {
  if (scope === 'universal') return 'Universal QR';
  if (scope === 'outlet') return 'Outlet QR';
  if (scope === 'location') return 'Location QR';
  return 'QR Store';
}

function pickOutletIds(row = {}) {
  const metadata = row.metadata || {};
  const ids = firstPresent(
    metadata.outletIds,
    metadata.outlet_ids,
    metadata.eligibleOutletIds,
    metadata.eligible_outlet_ids,
    metadata.connectedOutletIds,
    metadata.connected_outlet_ids,
  );
  if (Array.isArray(ids)) return ids.map(String);
  return [];
}

function connectedOutletsFor(row = {}, outletsById = new Map()) {
  const directOutlet = row.outlets || row.outlet || null;
  const directOutletId = firstPresent(row.outlet_id, row.outletId, directOutlet?.id);
  if (directOutletId) {
    const outlet = outletsById.get(String(directOutletId)) || directOutlet;
    return outlet?.id ? [{ id: outlet.id, name: outlet.name || outlet.code || 'Outlet', status: outlet.status || null }] : [];
  }

  const metadataOutletIds = pickOutletIds(row);
  if (metadataOutletIds.length > 0) {
    return metadataOutletIds.map((id) => outletsById.get(String(id))).filter(Boolean).map((outlet) => ({ id: outlet.id, name: outlet.name || outlet.code || 'Outlet', status: outlet.status || null }));
  }

  if (normalizeScope(row) === 'universal') {
    return Array.from(outletsById.values()).filter((outlet) => String(outlet.status || '').toLowerCase() !== 'inactive').map((outlet) => ({ id: outlet.id, name: outlet.name || outlet.code || 'Outlet', status: outlet.status || null }));
  }

  return [];
}

function mapQrCode(row = {}, outletsById = new Map(), activeSessions = []) {
  const scope = normalizeScope(row);
  const location = row.qr_locations || row.qrLocation || null;
  const code = firstPresent(row.public_code, row.publicCode, row.code, row.id);
  const metadata = row.metadata || {};
  // The displayed QR target follows the storefront URL. QR scope routing can
  // be added later for outlet/location QR without changing the universal URL.
  const url = normalizeStorefrontTarget(firstPresent(metadata.targetUrl, metadata.target_url, metadata.templateUrl, metadata.template_url, metadata.publicUrl, metadata.public_url, metadata.publicPath, metadata.public_path, metadata.qrUrl, metadata.qr_url, metadata.url));
  const relatedSessions = activeSessions.filter((session) => String(session.qr_code_id || '') === String(row.id || ''));
  return {
    id: row.id,
    code,
    name: firstPresent(row.name, metadata.name, location?.label, scopeLabel(scope)),
    scope,
    scope_label: scopeLabel(scope),
    status: row.status || (row.is_active === false ? 'inactive' : 'active'),
    is_active: String(row.status || '').toLowerCase() === 'active' || row.is_active === true,
    created_at: row.created_at || row.createdAt || null,
    expires_at: row.expires_at || row.expiresAt || null,
    public_url: url,
    location: location ? { id: location.id, label: location.label || location.code || null, type: location.location_type || location.locationType || null, status: location.status || null } : null,
    outlets: connectedOutletsFor(row, outletsById),
    active_sessions_count: relatedSessions.length,
  };
}

function mapSessionOnly(row = {}, outletsById = new Map()) {
  const scope = normalizeScope(row);
  return {
    id: row.id,
    code: firstPresent(row.public_code, row.table_label, row.location_label, row.id),
    name: firstPresent(row.location_label, row.table_label, scopeLabel(scope)),
    scope,
    scope_label: scopeLabel(scope),
    status: row.session_status || (row.is_active ? 'active' : 'inactive'),
    is_active: row.is_active === true,
    created_at: row.created_at || row.createdAt || null,
    expires_at: row.expires_at || row.expiresAt || null,
    public_url: null,
    location: row.qr_locations ? { id: row.qr_locations.id, label: row.qr_locations.label || row.location_label || null, type: row.qr_locations.location_type || null, status: row.qr_locations.status || null } : null,
    outlets: connectedOutletsFor(row, outletsById),
    active_sessions_count: row.is_active ? 1 : 0,
  };
}

function mapStoreSettings(storefront = {}) {
  const metadata = storefront.metadata || {};
  const banners = Array.isArray(metadata.banners)
    ? metadata.banners.slice(0, 5).filter((banner) => banner?.imageUrl || banner?.image_url).map((banner) => ({
      image_url: banner.imageUrl || banner.image_url,
      link_url: banner.linkUrl || banner.link_url || '',
    }))
    : (metadata.bannerUrl || metadata.banner_url ? [{ image_url: metadata.bannerUrl || metadata.banner_url, link_url: metadata.bannerLinkUrl || metadata.banner_link_url || '' }] : []);
  return {
    storefront_id: storefront.id,
    name: storefront.name || metadata.storeName || '',
    description: metadata.description || metadata.storeDescription || '',
    logo_url: metadata.logoUrl || metadata.logo_url || null,
    logo_file_id: metadata.logoFileId || metadata.logo_file_id || null,
    banner_url: metadata.bannerUrl || metadata.banner_url || null,
    banner_file_id: metadata.bannerFileId || metadata.banner_file_id || null,
    banner_link_url: metadata.bannerLinkUrl || metadata.banner_link_url || '',
    banners,
    banner_interval_seconds: Math.min(60, Math.max(2, Number(metadata.bannerIntervalSeconds || metadata.banner_interval_seconds || 5))),
    favicon_url: metadata.faviconUrl || metadata.favicon_url || null,
    favicon_file_id: metadata.faviconFileId || metadata.favicon_file_id || null,
  };
}

async function safeSelect(client, table, queryBuilder) {
  const result = await queryBuilder(client.from(table));
  if (result.error && isOptionalSchemaError(result.error)) return [];
  if (result.error) throw result.error;
  return result.data || [];
}

router.get('/qr-codes', async (req, res, next) => {
  try {
    const workspaceId = req.me.workspaceId;
    const client = getSupabaseServiceClient();

    const outlets = await safeSelect(client, 'outlets', (q) => q.select('id, name, code, city, status').eq('workspace_id', workspaceId));
    const outletsById = new Map(outlets.map((outlet) => [String(outlet.id), outlet]));

    const activeSessions = await safeSelect(client, 'qr_order_sessions', (q) => q
      .select('*')
      .eq('workspace_id', workspaceId)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(100));

    const qrCodes = await safeSelect(client, 'qr_codes', (q) => q
      .select('*, outlets(id, name, code, city, status), qr_locations(id, location_type, label, code, status, metadata)')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false })
      .limit(100));

    const displayQrCodes = qrCodes.filter(isOnlineStoreQr);
    const data = displayQrCodes.length > 0
      ? displayQrCodes.map((row) => mapQrCode(row, outletsById, activeSessions))
      : activeSessions.map((row) => mapSessionOnly(row, outletsById));

    res.json({
      data,
      outlets: outlets.map((outlet) => ({ id: outlet.id, name: outlet.name || outlet.code || 'Outlet', status: outlet.status || null })),
      summary: {
        total: data.length,
        active: data.filter((item) => item.is_active).length,
        inactive: data.filter((item) => !item.is_active).length,
        connected_outlets: outlets.length,
      },
    });
  } catch (err) {
    next(err);
  }
});

router.post('/qr-codes', async (req, res, next) => {
  try {
    const workspaceId = req.me.workspaceId;
    const client = getSupabaseServiceClient();
    const scope = ['universal', 'outlet'].includes(String(req.body?.scope || '').toLowerCase())
      ? String(req.body.scope).toLowerCase()
      : 'universal';
    const outletId = scope === 'outlet' ? (req.body?.outletId || req.body?.outlet_id || null) : null;

    if (scope === 'outlet' && !outletId) {
      return res.status(400).json({ error: { code: 'OUTLET_REQUIRED', message: 'Outlet QR requires outletId.' } });
    }

    if (outletId) {
      const outletResult = await client.from('outlets').select('id').eq('workspace_id', workspaceId).eq('id', outletId).maybeSingle();
      if (outletResult.error) throw outletResult.error;
      if (!outletResult.data) return res.status(404).json({ error: { code: 'OUTLET_NOT_FOUND', message: 'Outlet not found.' } });
    }

    const storefrontResult = await client
      .from('storefronts')
      .select('id, name, slug, status')
      .eq('workspace_id', workspaceId)
      .eq('status', 'active')
      .limit(1)
      .maybeSingle();
    if (storefrontResult.error && !isOptionalSchemaError(storefrontResult.error)) throw storefrontResult.error;
    const storefront = storefrontResult.data || null;

    const token = randomBytes(24).toString('base64url');
    const publicCode = `QR-${Date.now().toString(36).toUpperCase()}`;
    const targetUrl = storefrontPath(storefront) ? `${storefrontPath(storefront)}/` : publicQrPath(token);
    const metadata = {
      name: scope === 'outlet' ? 'Outlet QR' : 'Universal QR',
      qrScope: scope,
      qrType: scope,
      publicPath: publicQrPath(token),
      targetUrl,
      templateUrl: targetUrl,
      template: 'default-storefront',
      storefrontSlug: storefront?.slug || null,
      storefrontName: storefront?.name || null,
      createdFrom: 'admin_online_store',
    };

    const insert = {
      workspace_id: workspaceId,
      outlet_id: outletId,
      public_code: publicCode,
      qr_token_hash: hashQrToken(token),
      status: 'active',
      scope,
      qr_type: scope,
      outlet_locked: scope === 'outlet',
      metadata,
      created_by: req.me.id || null,
    };

    const result = await client
      .from('qr_codes')
      .insert(insert)
      .select('*, outlets(id, name, code, city, status), qr_locations(id, location_type, label, code, status, metadata)')
      .single();

    if (result.error) throw result.error;

    const outlets = await safeSelect(client, 'outlets', (q) => q.select('id, name, code, city, status').eq('workspace_id', workspaceId));
    const outletsById = new Map(outlets.map((outlet) => [String(outlet.id), outlet]));
    const item = mapQrCode({ ...result.data, metadata: { ...(result.data.metadata || {}), publicUrl: targetUrl } }, outletsById, []);
    res.status(201).json({ data: item, qr_token: token, public_path: publicQrPath(token), target_url: targetUrl });
  } catch (err) {
    next(err);
  }
});

router.get('/settings', async (req, res, next) => {
  try {
    const storefront = await storefrontsRepository.findActiveByWorkspace({ workspaceId: req.me.workspaceId });
    if (!storefront) return res.status(404).json({ error: { code: 'STOREFRONT_NOT_FOUND', message: 'Active storefront not found.' } });
    res.json({ data: mapStoreSettings(storefront) });
  } catch (err) {
    next(err);
  }
});

router.put('/settings', async (req, res, next) => {
  try {
    const storefront = await storefrontsRepository.findActiveByWorkspace({ workspaceId: req.me.workspaceId });
    if (!storefront) return res.status(404).json({ error: { code: 'STOREFRONT_NOT_FOUND', message: 'Active storefront not found.' } });
    const current = storefront.metadata || {};
    const nextMetadata = {
      ...current,
      ...(req.body.description !== undefined ? { description: String(req.body.description || '').slice(0, 150) } : {}),
      ...(req.body.logoUrl !== undefined ? { logoUrl: req.body.logoUrl || null } : {}),
      ...(req.body.logoFileId !== undefined ? { logoFileId: req.body.logoFileId || null } : {}),
      ...(req.body.bannerUrl !== undefined ? { bannerUrl: req.body.bannerUrl || null } : {}),
      ...(req.body.bannerFileId !== undefined ? { bannerFileId: req.body.bannerFileId || null } : {}),
      ...(req.body.bannerLinkUrl !== undefined ? { bannerLinkUrl: req.body.bannerLinkUrl || '' } : {}),
      ...(req.body.bannerIntervalSeconds !== undefined ? { bannerIntervalSeconds: Math.min(60, Math.max(2, Number(req.body.bannerIntervalSeconds) || 5)) } : {}),
      ...(Array.isArray(req.body.banners) ? {
        banners: req.body.banners.slice(0, 5).filter((banner) => banner?.imageUrl || banner?.image_url).map((banner) => ({
          imageUrl: banner.imageUrl || banner.image_url,
          linkUrl: banner.linkUrl || banner.link_url || '',
        })),
      } : {}),
      ...(req.body.faviconUrl !== undefined ? { faviconUrl: req.body.faviconUrl || null } : {}),
      ...(req.body.faviconFileId !== undefined ? { faviconFileId: req.body.faviconFileId || null } : {}),
    };
    const updated = await storefrontsRepository.updateMetadata({
      workspaceId: req.me.workspaceId,
      storefrontId: storefront.id,
      name: req.body.name ? String(req.body.name).trim().slice(0, 80) : undefined,
      metadata: nextMetadata,
    });
    res.json({ data: mapStoreSettings(updated) });
  } catch (err) {
    next(err);
  }
});

router.post('/settings/assets', uploadRateLimit, upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: { code: 'NO_FILE', message: 'No file uploaded.' } });
    const purpose = ['logo', 'banner', 'favicon'].includes(String(req.body?.type || '').toLowerCase())
      ? String(req.body.type).toLowerCase()
      : 'asset';
    const file = await uploadFile({
      workspaceId: req.me.workspaceId,
      file: req.file,
      userId: req.me.id,
      source: 'public_asset',
      metadata: { public: true, purpose: `online_store_${purpose}` },
    });
    res.status(201).json({
      data: {
        id: file.id,
        stored_name: file.stored_name,
        original_name: file.original_name,
        mime_type: file.mime_type,
        size_bytes: file.size_bytes,
        url: `/public-files/${file.stored_name}`,
      },
    });
  } catch (err) {
    next(err);
  }
});

export default router;
