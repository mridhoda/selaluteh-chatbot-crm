import { Router } from 'express';
import { authRequired, attachUser } from '../middleware/auth.js';
import { attachWorkspaceContext } from '../middleware/workspaceContext.js';

export default function createLocationInternalRouter() {
  const router = Router();

  router.use(authRequired, attachUser, attachWorkspaceContext);

  // POST /api/location/resolve-nearest-outlets
  router.post('/resolve-nearest-outlets', async (req, res, next) => {
    try {
      const { latitude, longitude } = req.body;
      if (!latitude || !longitude) return res.status(400).json({ error: 'latitude and longitude required' });
      if (typeof latitude !== 'number' || typeof longitude !== 'number') return res.status(400).json({ error: 'Invalid coordinates' });
      const outlets = [
        { outletId: 'outlet-smd-1', name: 'SelaluTeh Samarinda', latitude: -0.502106, longitude: 117.153709, locationStatus: 'VERIFIED', city: 'Samarinda' },
        { outletId: 'outlet-smd-2', name: 'SelaluTeh Samarinda 2', latitude: -0.493793, longitude: 117.147362, locationStatus: 'VERIFIED', city: 'Samarinda' },
      ];
      const { findNearestOutlets } = await import('../services/location-intelligence/nearest-outlet-service.js');
      const nearest = findNearestOutlets({ latitude, longitude }, outlets);
      res.json(nearest);
    } catch (err) { next(err); }
  });

  return router;
}
