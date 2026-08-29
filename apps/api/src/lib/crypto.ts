import argon2 from 'argon2';
import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
  createHash,
} from 'node:crypto';

/** Argon2 password hashing for operator authentication. */
export async function hashPassword(plain: string): Promise<string> {
  return argon2.hash(plain, { type: argon2.argon2id });
}

export async function verifyPassword(
  hash: string | null | undefined,
  plain: string,
): Promise<boolean> {
  if (!hash) return false;
  try {
    return await argon2.verify(hash, plain);
  } catch {
    return false;
  }
}

const ALGO = 'aes-256-gcm';

function deriveKey(secret: string): Buffer {
  return createHash('sha256').update(secret).digest();
}

/**
 * Encryption for stored integration credentials (docs/13-SECURITY-PRIVACY.md).
 * Uses AES-256-GCM; output is returned with the IV + auth tag embedded.
 * Never store decrypted secrets in DB or logs.
 */
export function encrypt(plain: string, encryptionKey: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGO, deriveKey(encryptionKey), iv);
  const encrypted = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString('base64')}.${tag.toString('base64')}.${encrypted.toString('base64')}`;
}

export function decrypt(payload: string, encryptionKey: string): string {
  const [ivB64, tagB64, dataB64] = payload.split('.');
  if (!ivB64 || !tagB64 || !dataB64) {
    throw new Error('Malformed encrypted payload');
  }
  const decipher = createDecipheriv(
    ALGO,
    deriveKey(encryptionKey),
    Buffer.from(ivB64, 'base64'),
  );
  decipher.setAuthTag(Buffer.from(tagB64, 'base64'));
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(dataB64, 'base64')),
    decipher.final(),
  ]);
  return decrypted.toString('utf8');
}

/** Deterministic idempotency key generation helper (for external writes). */
export function makeIdempotencyKey(prefix: string, input: string): string {
  const digest = createHash('sha256').update(input).digest('hex').slice(0, 32);
  return `${prefix}_${digest}`;
}
