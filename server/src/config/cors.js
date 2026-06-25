import cors from 'cors';
import { getAllowedCorsOrigins } from './env.js';
import { env } from './env.js';

function isOriginAllowed(origin, allowedOrigins) {
  if (!origin) return true;
  if (allowedOrigins === '*') return !env.isProduction;
  return allowedOrigins.includes(origin);
}

export function corsMiddleware() {
  const allowedOrigins = getAllowedCorsOrigins();
  return cors({
    origin(origin, callback) {
      if (isOriginAllowed(origin, allowedOrigins)) {
        callback(null, true);
        return;
      }
      callback(new Error('CORS origin denied'));
    },
    credentials: allowedOrigins !== '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id', 'X-Workspace-Id', 'Idempotency-Key', 'X-Telegram-Bot-Api-Secret-Token'],
    exposedHeaders: ['X-Request-Id'],
  });
}
