import type { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';
import { AppError } from '../lib/errors.js';
import { randomUUID } from 'node:crypto';

/**
 * Centralised error handler.
 * - Attaches a correlation ID to every reply
 * - Maps ZodError -> 422, AppError -> its status, Prisma known errors -> 409
 * - Never leaks internal stack traces to clients in production
 *
 * Wrapped in fastify-plugin so it applies at the root scope (not encapsulated).
 */
export const errorHandlerPlugin = fp(async (app: FastifyInstance): Promise<void> => {
  // Consistent 404 response using the same error envelope.
  app.setNotFoundHandler((request, reply) => {
    const correlationId =
      (request.headers['x-correlation-id'] as string) ?? randomUUID();
    return reply.code(404).headers({ 'x-correlation-id': correlationId }).send({
      error: {
        code: 'NOT_FOUND',
        message: `Route ${request.method} ${request.url} not found`,
        correlationId,
      },
    });
  });

  app.setErrorHandler((error, request, reply) => {
    const correlationId =
      (request.headers['x-correlation-id'] as string) ?? randomUUID();

    let status = 500;
    let code = 'INTERNAL_ERROR';
    let message = 'An unexpected error occurred';
    let details: unknown;

    if (error instanceof ZodError) {
      status = 422;
      code = 'VALIDATION_ERROR';
      message = 'Invalid request payload';
      details = error.flatten();
    } else if (error instanceof AppError) {
      status = error.status;
      code = error.code;
      message = error.message;
      details = error.details;
    } else if (error instanceof Prisma.PrismaClientKnownRequestError) {
      // P2002 = unique constraint violation, P2025 = record not found
      if (error.code === 'P2002') {
        status = 409;
        code = 'CONFLICT';
        message = 'A record with the same unique value already exists';
      } else if (error.code === 'P2025') {
        status = 404;
        code = 'NOT_FOUND';
        message = 'Record not found';
      }
    }

    // Always log server-side with correlation id; redaction is handled by pino.
    request.log.error(
      { err: error, status, code, correlationId },
      'request failed',
    );

    return reply.code(status).headers({ 'x-correlation-id': correlationId }).send({
      error: {
        code,
        message,
        ...(details !== undefined ? { details } : {}),
        correlationId,
      },
    });
  });
});

