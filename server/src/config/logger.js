import morgan from 'morgan';
import { redactSecrets, redactSecretsInText } from '../utils/redaction.js';

export function httpLogger() {
  morgan.token('safe-url', (req) => redactSecretsInText(req.originalUrl || req.url || ''));
  return morgan((tokens, req, res) => {
    const line = [
      tokens.method(req, res),
      tokens['safe-url'](req, res),
      tokens.status(req, res),
      tokens.res(req, res, 'content-length') || '-',
      '-',
      tokens['response-time'](req, res), 'ms',
    ].join(' ');
    return redactSecretsInText(line);
  });
}

export function logSecurityEvent(level, message, payload = {}) {
  const logger = level === 'error' ? console.error : level === 'warn' ? console.warn : console.log;
  logger(message, redactSecrets(payload));
}
