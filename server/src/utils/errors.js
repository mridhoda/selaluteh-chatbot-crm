export class AppError extends Error {
  constructor(code, message, status = 500, details = null, cause = null) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.status = status;
    this.details = details;
    this.cause = cause;
    this.expose = status < 500;
  }
}

export function httpError(status, message) {
  const err = new Error(message);
  err.status = status;
  return err;
}
