/**
 * tata-pos-client.js
 *
 * Outbound HTTP client for TATA-POS's Online Store sales ingestion endpoint
 * (TATA-POS repo: specs/backlog/modul-online-store-ingestion/design.md §2).
 * Mirrors this repo's xendit-client.js style: plain `fetch`, no extra
 * dependency, throws AppError with provider status/body on failure.
 *
 * Not called from anywhere yet -- the outbox worker
 * (server/src/workers/integration-outbox-dispatch.worker.js) is the only
 * intended caller, and it isn't registered/started yet either.
 */
import crypto from 'node:crypto';
import { env } from '../../config/env.js';
import { AppError } from '../../utils/errors.js';

const INGESTION_PATH = '/api/v1/integrations/orders';

function assertConfigured() {
  if (!env.tataPosBaseUrl || !env.tataPosIntegrationKeyId || !env.tataPosIntegrationSecret) {
    throw new AppError('TATA_POS_NOT_CONFIGURED', 'TATA-POS integration is not configured', 500);
  }
}

function signRequest(rawBody) {
  const timestamp = Math.floor(Date.now() / 1000);
  const signature = crypto
    .createHmac('sha256', env.tataPosIntegrationSecret)
    .update(`${timestamp}.${rawBody}`)
    .digest('hex');
  return { timestamp, signature };
}

/**
 * Send one integration_outbox event to TATA-POS. `payload` is the exact
 * object stored on the outbox row -- serialized to JSON exactly once here,
 * and that same raw string is both signed and sent as the body (re-
 * serializing the object a second time could produce different key
 * ordering/whitespace than what was signed, which would fail TATA-POS's
 * signature verification even though the data is "the same").
 *
 * Throws AppError on any non-2xx response. 401 (bad signature / revoked
 * key), 409 (timestamp drift), and 422 (outlet mapping / totals / payload
 * rejected) are marked `details.permanent = true` -- retrying an identical
 * payload will never turn these into a success, unlike a 5xx. Both cases
 * still go through the outbox's normal retry/dead-letter loop for
 * simplicity (per plan), but the distinction is preserved in the thrown
 * error (and therefore in `last_error` on a 'dead' row) so a human reviewing
 * dead rows can tell "this will never succeed as-is" apart from "TATA-POS
 * was just down".
 */
export async function sendIntegrationEvent(payload) {
  assertConfigured();
  const rawBody = JSON.stringify(payload);
  const { timestamp, signature } = signRequest(rawBody);

  const response = await fetch(`${env.tataPosBaseUrl}${INGESTION_PATH}`, {
    method: 'POST',
    headers: {
      'X-Integration-Key': env.tataPosIntegrationKeyId,
      'X-Timestamp': String(timestamp),
      'X-Signature': `sha256=${signature}`,
      'Content-Type': 'application/json',
    },
    body: rawBody,
  });

  const text = await response.text();
  let body;
  try {
    body = text ? JSON.parse(text) : {};
  } catch {
    body = { raw: text };
  }

  if (!response.ok) {
    const permanent = [401, 409, 422].includes(response.status);
    throw new AppError(
      permanent ? 'TATA_POS_REJECTED' : 'TATA_POS_UNAVAILABLE',
      `TATA-POS integration request failed with status ${response.status}` +
        (permanent
          ? ' (client-side: bad signature, timestamp drift, or payload/mapping rejected -- retrying the same payload will not help)'
          : ' (transient/server error -- safe to retry)'),
      response.status,
      { providerStatus: response.status, providerBody: body, permanent },
    );
  }

  return body;
}
