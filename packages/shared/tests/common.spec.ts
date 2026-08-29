import { describe, expect, it } from 'vitest';
import { paginatedResponseSchema, paginationQuerySchema } from '../src/schemas/common';

describe('shared zod schemas', () => {
  it('parses a pagination query with defaults', () => {
    const parsed = paginationQuerySchema.parse({});
    expect(parsed.page).toBe(1);
    expect(parsed.limit).toBe(25);
  });

  it('coerces string pagination values', () => {
    const parsed = paginationQuerySchema.parse({ page: '3', limit: '50' });
    expect(parsed.page).toBe(3);
    expect(parsed.limit).toBe(50);
  });

  it('rejects out-of-range limit', () => {
    expect(() => paginationQuerySchema.parse({ limit: 500 })).toThrow();
  });

  it('builds a paginated response schema', () => {
    const schema = paginatedResponseSchema(
      schemaForTest,
    );
    const result = schema.parse({
      data: [{ id: 1 }],
      pagination: { page: 1, limit: 25, total: 1, totalPages: 1 },
    });
    expect(result.data).toHaveLength(1);
  });
});

import { z } from 'zod';
const schemaForTest = z.object({ id: z.number() });
