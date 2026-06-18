export function errorHandler(err, req, res, _next) {
  const requestId = req.requestId || req.id || 'unknown';
  const status = err.status || err.statusCode || 500;
  const code = err.code || 'INTERNAL_ERROR';
  const message = err.expose || err.status < 500 ? err.message : 'Internal server error';

  if (status >= 500) {
    console.error(`[ERROR] ${requestId} ${status} ${code}:`, err.message);
    if (err.stack) console.error(err.stack);
  } else {
    console.warn(`[WARN] ${requestId} ${status} ${code}:`, err.message);
  }

  res.status(status).json({
    error: { code, message },
    meta: { request_id: requestId },
  });
}
