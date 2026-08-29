import { z } from 'zod';

/**
 * Shared Zod schemas: consistent error envelope, pagination and IDs.
 * Mirrors docs/06-API-SPECIFICATION.md conventions.
 */

/** UUID primary keys. */
export const idSchema = z.string().uuid();

/** Generic ID params object. */
export const idParamsSchema = z.object({
  id: idSchema,
});

/**
 * Consistent API error envelope.
 * { error: { code, message, details?, correlationId?, requestId? } }
 */
export const errorEnvelopeSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.unknown().optional(),
    correlationId: z.string().optional(),
  }),
});

/**
 * Pagination query accepted on list endpoints.
 * page: 1-based. limit: items per page (default 25, max 100).
 */
export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(25),
});

export type PaginationQuery = z.infer<typeof paginationQuerySchema>;

/**
 * Standard paginated response envelope.
 * { data, pagination: { page, limit, total, totalPages } }
 */
export function paginatedResponseSchema<T extends z.ZodTypeAny>(item: T) {
  return z.object({
    data: z.array(item),
    pagination: z.object({
      page: z.number().int(),
      limit: z.number().int(),
      total: z.number().int(),
      totalPages: z.number().int(),
    }),
  });
}
