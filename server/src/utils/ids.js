import crypto from 'crypto';

export function randomId() {
  return crypto.randomUUID();
}
