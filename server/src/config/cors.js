import cors from 'cors';
import { getAllowedCorsOrigins } from './env.js';
import { env } from './env.js';

function isOriginAllowed(origin, allowedOrigins) {
  if (!origin) return true;
  if (allowedOrigins === '*') return !env.isProduction;
  if (!env.isProduction && isLocalDevelopmentOrigin(origin)) return true;
  return allowedOrigins.includes(origin);
}

function isLocalDevelopmentOrigin(origin) {
  try {
    const { hostname } = new URL(origin);
    return (
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname === '0.0.0.0' ||
      hostname.endsWith('.local') ||
      hostname.startsWith('10.') ||
      hostname.startsWith('192.168.') ||
      /^172\.(1[6-9]|2\d|3[0-1])\./.test(hostname)
    );
  } catch (_) {
    return false;
  }
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
