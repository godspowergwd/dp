import { describe, expect, it } from 'vitest';
import { loginSchema, registerSchema } from '../src/modules/auth/auth.schema.js';

describe('auth schemas', () => {
  it('accepts valid login payload', () => {
    const parsed = loginSchema.parse({ email: 'a@b.com', password: 'password123' });
    expect(parsed.email).toBe('a@b.com');
  });

  it('rejects short passwords', () => {
    expect(() => loginSchema.parse({ email: 'a@b.com', password: 'short' })).toThrow();
    expect(() => registerSchema.parse({ email: 'a@b.com', password: 'short' })).toThrow();
  });
});
