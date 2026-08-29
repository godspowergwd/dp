import type { FastifyInstance } from 'fastify';
import { idParamsSchema } from '@pd/shared';
import {
  createProductSchema,
  productQuerySchema,
  updateProductSchema,
} from './product.schema.js';
import {
  archiveProduct,
  createProduct,
  getProduct,
  listProducts,
  setProductStatus,
  updateProduct,
} from './product.service.js';
import { badRequest } from '../../lib/errors.js';

/**
 * Product Hub routes — /api/v1/products (docs/02-FEATURE-MAP.md)
 */
export async function productRoutes(app: FastifyInstance): Promise<void> {
  const auth = [app.authenticate];

  app.get('/', { preHandler: auth }, async (request) => {
    return listProducts(productQuerySchema.parse(request.query));
  });

  app.post('/', { preHandler: auth }, async (request, reply) => {
    const created = await createProduct(createProductSchema.parse(request.body));
    return reply.code(201).send(created);
  });

  app.get('/:id', { preHandler: auth }, async (request) => {
    const { id } = idParamsSchema.parse(request.params);
    return getProduct(id);
  });

  app.patch('/:id', { preHandler: auth }, async (request) => {
    const { id } = idParamsSchema.parse(request.params);
    return updateProduct(id, updateProductSchema.parse(request.body));
  });

  // Status transitions per product lifecycle (docs/00-MASTER-SPECIFICATION.md)
  app.patch('/:id/status', { preHandler: auth }, async (request) => {
    const { id } = idParamsSchema.parse(request.params);
    const { status } = (request.body ?? {}) as { status?: string };
    if (!status || !status.length) {
      throw badRequest('status is required');
    }
    return setProductStatus(id, status);
  });

  app.delete('/:id', { preHandler: auth }, async (request) => {
    const { id } = idParamsSchema.parse(request.params);
    return archiveProduct(id);
  });
}
