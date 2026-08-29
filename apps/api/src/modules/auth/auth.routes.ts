import type { FastifyInstance } from 'fastify';
import { loginSchema, registerSchema } from './auth.schema.js';
import { login, register } from './auth.service.js';

/**
 * Auth routes — /api/v1/auth
 * POST /register   bootstrap the owner (only when no account exists)
 * POST /login      obtain a JWT
 * GET  /me         return the current operator (protected)
 */
export async function authRoutes(app: FastifyInstance): Promise<void> {
  const sign = (payload: object) => app.jwt.sign(payload);

  app.post('/register', async (request, reply) => {
    const result = await register(registerSchema.parse(request.body), sign);
    return reply.code(201).send(result);
  });

  app.post('/login', async (request) => {
    return login(loginSchema.parse(request.body), sign);
  });

  app.get(
    '/me',
    { preHandler: [app.authenticate] },
    async (request) => {
      return { user: request.authUser };
    },
  );
}
