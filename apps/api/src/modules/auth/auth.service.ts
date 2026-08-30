import { prisma } from '../../lib/prisma.js';
import { hashPassword, verifyPassword } from '../../lib/crypto.js';
import { conflict, unauthorized } from '../../lib/errors.js';
import type { LoginInput, RegisterInput } from './auth.schema.js';

export interface AuthResult {
  user: { id: string; email: string; name: string | null; role: string };
  token: string;
}

/**
 * Registration: allows signup if email is not already taken.
 */
export async function register(
  input: RegisterInput,
  signToken: (payload: object) => string,
): Promise<AuthResult> {
  const existing = await prisma.user.findUnique({
    where: { email: input.email.toLowerCase() },
  });
  if (existing) {
    throw conflict('An account with this email already exists.');
  }

  const passwordHash = await hashPassword(input.password);
  const user = await prisma.user.create({
    data: {
      email: input.email.toLowerCase(),
      name: input.name,
      passwordHash,
      role: 'owner',
    },
    select: { id: true, email: true, name: true, role: true },
  });

  const token = signToken({ sub: user.id, email: user.email, role: user.role });
  return { user, token };
}

/** Login for the operator. MFA challenge can be layered on here later. */
export async function login(
  input: LoginInput,
  signToken: (payload: object) => string,
): Promise<AuthResult> {
  const user = await prisma.user.findUnique({
    where: { email: input.email.toLowerCase() },
  });

  if (!user || !user.isActive || user.deletedAt) {
    throw unauthorized('Invalid credentials');
  }

  const valid = await verifyPassword(user.passwordHash, input.password);
  if (!valid) {
    throw unauthorized('Invalid credentials');
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });

  const token = signToken({ sub: user.id, email: user.email, role: user.role });
  return {
    user: { id: user.id, email: user.email, name: user.name, role: user.role },
    token,
  };
}
