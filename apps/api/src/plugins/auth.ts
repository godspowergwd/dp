import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import fp from 'fastify-plugin';
import { prisma } from '../lib/prisma.js';
import { unauthorized } from '../lib/errors.js';

declare module 'fastify' {
  interface FastifyInstance {
    /** Verifies the JWT and loads the operator. Use as a route preHandler. */
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
  interface FastifyRequest {
    /** Authenticated operator user, populated by `authenticate`. */
    authUser?: {
      id: string;
      email: string;
      role: string;
    };
  }
}

/**
 * Fastify plugin registering an `authenticate` preHandler that verifies the
 * JWT (BEARER token) and loads the current operator user onto `request.authUser`.
 */
export const authPlugin = fp(async (app: FastifyInstance) => {
  app.decorate('authenticate', async (request: FastifyRequest, _reply: FastifyReply) => {
    try {
      await request.jwtVerify();
    } catch {
      throw unauthorized('Missing or invalid authentication token');
    }

    const payload = request.user as { sub: string; email?: string; role?: string };
    if (!payload?.sub) {
      throw unauthorized('Malformed authentication token');
    }

    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user || !user.isActive || user.deletedAt) {
      throw unauthorized('User account is inactive or no longer exists');
    }

    request.authUser = { id: user.id, email: user.email, role: user.role };
  });
});

