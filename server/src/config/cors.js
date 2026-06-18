import cors from 'cors';
import { getAllowedCorsOrigins } from './env.js';

export function corsMiddleware() {
  const allowedOrigins = getAllowedCorsOrigins();
  return cors({
    origin: allowedOrigins === '*' ? true : allowedOrigins,
    credentials: true,
  });
}
