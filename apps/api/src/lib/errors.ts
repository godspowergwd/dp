/**
 * Application errors. Serialised to the standard API error envelope
 * (docs/06-API-SPECIFICATION.md): { error: { code, message, details } }.
 */

export type HttpStatus = 400 | 401 | 403 | 404 | 409 | 422 | 429 | 500;

export class AppError extends Error {
  readonly status: HttpStatus;
  readonly code: string;
  readonly details?: unknown;
  readonly expose: boolean;

  constructor(
    status: HttpStatus,
    code: string,
    message: string,
    options: { details?: unknown; expose?: boolean } = {},
  ) {
    super(message);
    this.name = 'AppError';
    this.status = status;
    this.code = code;
    this.details = options.details;
    this.expose = options.expose ?? true;
  }
}

export const badRequest = (message = 'Bad request', details?: unknown) =>
  new AppError(400, 'BAD_REQUEST', message, { details });

export const unauthorized = (message = 'Authentication required') =>
  new AppError(401, 'UNAUTHORIZED', message);

export const forbidden = (message = 'Forbidden') =>
  new AppError(403, 'FORBIDDEN', message);

export const notFound = (message = 'Not found', code = 'NOT_FOUND') =>
  new AppError(404, code, message);

export const conflict = (message = 'Conflict', details?: unknown) =>
  new AppError(409, 'CONFLICT', message, { details });

export const unprocessable = (message = 'Unprocessable entity', details?: unknown) =>
  new AppError(422, 'VALIDATION_ERROR', message, { details });

export const rateLimited = (message = 'Too many requests') =>
  new AppError(429, 'RATE_LIMITED', message);
