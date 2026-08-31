import type { FastifyInstance } from 'fastify';
import { loginSchema, registerSchema, updateProfileSchema } from './auth.schema.js';
import { login, register, updateProfile, getCurrentUser } from './auth.service.js';

/**
 * Auth routes — /api/v1/auth
 * POST /register   create an account
 * POST /login      obtain a session token
 * GET  /me         return the current user (protected)
 * PATCH /me        update profile (name, password)
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
    async (request, reply) => {
      const user = await getCurrentUser(request.authUser!.id);
      if (!user) return reply.code(401).send({ error: 'Unauthorized' });
      return { user };
    },
  );

  app.patch(
    '/me',
    { preHandler: [app.authenticate] },
    async (request, reply) => {
      const result = await updateProfile(request.authUser!.id, updateProfileSchema.parse(request.body), sign);
      return reply.code(200).send(result);
    },
  );
}
