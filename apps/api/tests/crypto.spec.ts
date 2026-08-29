import { describe, expect, it } from 'vitest';
import { encrypt, decrypt, makeIdempotencyKey } from '../src/lib/crypto.js';

const KEY = 'test-encryption-key-32-bytes-abc123';

describe('crypto helpers', () => {
  it('round-trips an encrypted credential', () => {
    const secret = 'sk-live-abc123';
    const payload = encrypt(secret, KEY);
    expect(payload).not.toContain(secret);
    expect(decrypt(payload, KEY)).toBe(secret);
  });

  it('produces unique ciphertext for the same plaintext', () => {
    const a = encrypt('same-value', KEY);
    const b = encrypt('same-value', KEY);
    expect(a).not.toBe(b);
  });

  it('throws on a wrong decryption key', () => {
    const payload = encrypt('secret', KEY);
    expect(() => decrypt(payload, 'wrong-key')).toThrow();
  });

  it('generates deterministic idempotency keys', () => {
    const a = makeIdempotencyKey('publish', 'product-1->store-1');
    const b = makeIdempotencyKey('publish', 'product-1->store-1');
    const c = makeIdempotencyKey('publish', 'product-1->store-2');
    expect(a).toBe(b);
    expect(a).not.toBe(c);
  });
});
