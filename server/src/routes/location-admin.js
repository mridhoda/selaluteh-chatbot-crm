import { Router } from 'express';
import { authRequired, attachUser } from '../middleware/auth.js';
import { attachWorkspaceContext } from '../middleware/workspaceContext.js';
import { outletLocationsRepository } from '../db/repositories/outlet-locations.supabase.repository.js';

export default function createLocationAdminRouter() {
  const router = Router({ mergeParams: true });

  router.use(authRequired, attachUser, attachWorkspaceContext);

  // POST /api/outlets/:outletId/location/resolve
  router.post('/resolve', async (req, res, next) => {
    try {
      const { outletId } = req.params;
      const { url } = req.body;
      const workspaceId = req.me?.workspaceId;
      if (!workspaceId) return res.status(400).json({ error: 'Workspace required' });
      if (!url) return res.status(400).json({ error: 'url required' });
      const existing = await outletLocationsRepository.getByOutlet(workspaceId, outletId);
      const preview = { previewToken: `preview-${Date.now()}`, status: 'preview_created', existingLocationUnchanged: !!existing };
      res.json(preview);
    } catch (err) { next(err); }
  });

  // POST /api/outlets/:outletId/location/confirm
  router.post('/confirm', async (req, res, next) => {
    try {
      const { outletId } = req.params;
      const { previewToken, latitude, longitude, formattedAddress, providerPlaceId, googleMapsUri } = req.body;
      const workspaceId = req.me?.workspaceId;
      if (!workspaceId) return res.status(400).json({ error: 'Workspace required' });
      if (!previewToken) return res.status(400).json({ error: 'previewToken required' });
      const saved = await outletLocationsRepository.saveConfirmedLocation(workspaceId, outletId, {
        provider: 'google', formattedAddress: formattedAddress || 'Admin confirmed', latitude: latitude || 0, longitude: longitude || 0,
        providerPlaceId, googleMapsUri, status: 'VERIFIED', resolverVersion: '1.0.0',
        resolvedAt: new Date().toISOString(), verifiedAt: new Date().toISOString(),
        lastVerificationAt: new Date().toISOString(),
        nextVerificationAt: new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString(),
      });
      if (saved?.id) {
        await outletLocationsRepository.addHistoryEntry({
          outletLocationId: saved.id, actorUserId: req.me?.id, action: 'confirmed',
          newSnapshot: saved, metadata: { previewToken },
        });
      }
      res.json({ success: true, location: saved });
    } catch (err) { next(err); }
  });

  // POST /api/outlets/:outletId/location/refresh
  router.post('/refresh', async (req, res, next) => {
    try {
      const { outletId } = req.params;
      const workspaceId = req.me?.workspaceId;
      if (!workspaceId) return res.status(400).json({ error: 'Workspace required' });
      const existing = await outletLocationsRepository.getByOutlet(workspaceId, outletId);
      res.json({ dryRun: true, existing, proposedChange: null });
    } catch (err) { next(err); }
  });

  // GET /api/outlets/:outletId/location
  router.get('/', async (req, res, next) => {
    try {
      const { outletId } = req.params;
      const workspaceId = req.me?.workspaceId;
      if (!workspaceId) return res.status(400).json({ error: 'Workspace required' });
      const location = await outletLocationsRepository.getByOutlet(workspaceId, outletId);
      if (!location) return res.status(404).json({ error: 'Location not found' });
      const safe = { ...location };
      delete safe.rawProviderPayload;
      res.json(safe);
    } catch (err) { next(err); }
  });

  // GET /api/outlets/:outletId/location/history
  router.get('/history', async (req, res, next) => {
    try {
      const { outletId } = req.params;
      const workspaceId = req.me?.workspaceId;
      if (!workspaceId) return res.status(400).json({ error: 'Workspace required' });
      const history = await outletLocationsRepository.getHistory(workspaceId, outletId, req.query);
      res.json(history.map(h => { const s = { ...h }; delete s.rawProviderPayload; return s; }));
    } catch (err) { next(err); }
  });

  return router;
}

