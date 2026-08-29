import pino from 'pino';

/**
 * Structured logger with redaction for secrets. Correlation IDs are attached
 * per-request by the error-handler / plugins layer (docs/16-OBSERVABILITY).
 */
export const logger = pino({
  level: process.env.LOG_LEVEL ?? 'info',
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      '*.password',
      '*.passwordHash',
      '*.token',
      '*.apiKey',
      '*.secret',
      '*.credentials',
    ],
    censor: '[REDACTED]',
  },
  base: { service: 'pd-api' },
  timestamp: pino.stdTimeFunctions.isoTime,
});

export type Logger = typeof logger;
