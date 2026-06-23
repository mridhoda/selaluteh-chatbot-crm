import { redactSecrets } from '../utils/redaction.js';

export function errorHandler(err, req, res, _next) {
  const requestId = req.requestId || req.id || 'unknown';
  const status = err.status || err.statusCode || err.httpStatus || 500;
  const code = err.code || 'INTERNAL_ERROR';
  const message = err.expose || status < 500 ? err.message : 'Internal server error';
  const redactedDetails = redactSecrets(err.details || null);

  if (status >= 500) {
    console.error(`[ERROR] ${requestId} ${status} ${code}:`, redactSecrets(err.message));
    if (redactedDetails) console.error(redactedDetails);
    if (err.stack) console.error(err.stack);
  } else {
    console.warn(`[WARN] ${requestId} ${status} ${code}:`, redactSecrets(err.message));
  }

  res.status(status).json({
    error: { code, message, ...(status < 500 && redactedDetails ? { details: redactedDetails } : {}) },
    meta: { request_id: requestId },
  });
}
