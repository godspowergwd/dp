import { z } from 'zod';

/**
 * Validated application configuration.
 * All secrets are read from the environment and validated once at startup.
 * Never log the values here.
 */
const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),
  APP_URL: z.string().url().default('http://localhost:3000'),
  APP_PORT: z.coerce.number().int().min(0).default(4000),
  DATABASE_URL: z.string().min(1),
  AUTH_SECRET: z.string().min(32, 'AUTH_SECRET must be at least 32 chars'),
  AUTH_TOKEN_TTL: z.string().default('7d'),
  ENCRYPTION_KEY: z.string().default('development-insecure-key'),
});

export type AppEnv = z.infer<typeof envSchema>;

let cached: AppEnv | null = null;

/** Parse + cache the environment. Throws at startup if required vars are missing. */
export function getConfig(overrides: Partial<AppEnv> = {}): AppEnv {
  if (cached) return cached;
  const parsed = envSchema.safeParse({ ...process.env, ...overrides });
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `${i.path.join('.')}: ${i.message}`)
      .join('\n');
    throw new Error(`Invalid environment configuration:\n${issues}`);
  }
  cached = parsed.data;
  return cached;
}

/** Reset the cached config (used in tests). */
export function resetConfig(): void {
  cached = null;
}
