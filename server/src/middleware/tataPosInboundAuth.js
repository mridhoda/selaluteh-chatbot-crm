/**
 * tataPosInboundAuth.js
 *
 * Verifies inbound requests from TATA-POS's backend on the new reverse
 * bridge (Fase 4 Stage E -- accept/ready/complete action buttons proxied
 * from the Flutter cashier app through TATA-POS's own backend). Mirrors
 * tata-pos-client.js's outbound signing scheme in reverse: a single static
 * shared secret (TATA_POS_INBOUND_HMAC_SECRET), not the per-outlet
 * integration_keys scheme the outbound direction uses -- there is exactly
 * one caller here, so no key_id lookup is needed.
 *
 * Required headers:
 *   X-Timestamp: unix seconds
 *   X-Signature: sha256=<hex hmac of "${timestamp}.${rawBody}">
 *
 * Relies on req.rawBody -- the raw JSON body Buffer already captured
 * globally by express.json()'s verify callback in index.js.
 */
import crypto from 'node:crypto';
import { env } from '../config/env.js';
import { AppError } from '../utils/errors.js';

const MAX_CLOCK_SKEW_SECONDS = 300; // 5 minutes, matches IntegrationHmacGuard's tolerance

export function tataPosInboundAuth(req, res, next) {
  try {
    // Fail closed: an unset secret must never be treated as "any request is
    // valid" -- that would silently disable auth on this router.
    if (!env.tataPosInboundHmacSecret) {
      throw new AppError('TATA_POS_INBOUND_NOT_CONFIGURED', 'TATA-POS inbound integration is not configured', 500);
    }

    const timestampHeader = req.headers['x-timestamp'];
    const signatureHeader = req.headers['x-signature'];
    if (!timestampHeader || !signatureHeader) {
      throw new AppError('UNAUTHORIZED', 'Missing X-Timestamp/X-Signature headers', 401);
    }

    const timestamp = Number(timestampHeader);
    if (!Number.isFinite(timestamp)) {
      throw new AppError('UNAUTHORIZED', 'Invalid X-Timestamp header', 401);
    }
    const nowSeconds = Math.floor(Date.now() / 1000);
    if (Math.abs(nowSeconds - timestamp) > MAX_CLOCK_SKEW_SECONDS) {
      throw new AppError('UNAUTHORIZED', 'Request timestamp outside allowed window', 401);
    }

    const match = /^sha256=([0-9a-f]+)$/i.exec(String(signatureHeader));
    if (!match) {
      throw new AppError('UNAUTHORIZED', 'Invalid X-Signature format', 401);
    }

    const rawBody = req.rawBody || Buffer.alloc(0);
    const expectedHex = crypto
      .createHmac('sha256', env.tataPosInboundHmacSecret)
      .update(`${timestampHeader}.${rawBody}`)
      .digest('hex');

    const provided = Buffer.from(match[1], 'hex');
    const expected = Buffer.from(expectedHex, 'hex');
    // timingSafeEqual throws on mismatched lengths rather than returning
    // false -- guard with a length check first.
    const signatureValid = provided.length === expected.length && crypto.timingSafeEqual(provided, expected);
    if (!signatureValid) {
      throw new AppError('UNAUTHORIZED', 'Invalid signature', 401);
    }

    next();
  } catch (err) {
    next(err);
  }
}
