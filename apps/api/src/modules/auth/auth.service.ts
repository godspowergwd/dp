import { prisma } from '../../lib/prisma.js';
import { hashPassword, verifyPassword } from '../../lib/crypto.js';
import { conflict, unauthorized } from '../../lib/errors.js';
import type { LoginInput, RegisterInput, UpdateProfileInput } from './auth.schema.js';

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

/** Fetch the current user's public profile from the database. */
export async function getCurrentUser(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, name: true, role: true, isActive: true },
  });
  if (!user || !user.isActive || user.deletedAt) return null;
  return user;
}

/** Update current user's profile (name and/or password). */
export async function updateProfile(
  userId: string,
  input: UpdateProfileInput,
  signToken: (payload: object) => string,
): Promise<AuthResult> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || !user.isActive || user.deletedAt) {
    throw unauthorized('Your account is unavailable.');
  }

  const data: { name?: string; passwordHash?: string } = {};

  if (input.name !== undefined && input.name.trim()) {
    data.name = input.name.trim();
  }

  if (input.password) {
    if (!input.currentPassword) {
      throw unauthorized('Enter your current password to change it.');
    }
    const valid = await verifyPassword(user.passwordHash ?? '', input.currentPassword);
    if (!valid) {
      throw unauthorized('Your current password is incorrect.');
    }
    data.passwordHash = await hashPassword(input.password);
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data,
    select: { id: true, email: true, name: true, role: true },
  });

  const token = signToken({ sub: updated.id, email: updated.email, role: updated.role });
  return { user: updated, token };
}