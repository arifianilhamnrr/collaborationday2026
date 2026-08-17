import { describe, expect, it } from 'vitest';
import { hashPassword, validPassword, verifyPassword } from '../src/auth';

describe('password authentication', () => {
  it('round-trips a password through the Worker PBKDF2 format', async () => {
    const hash = await hashPassword('Collab-admin');

    expect(hash).toMatch(/^pbkdf2-sha256\$100000\$/);
    expect(await verifyPassword('Collab-admin', hash)).toBe(true);
    expect(await verifyPassword('wrong-password', hash)).toBe(false);
  });

  it('enforces password length', () => {
    expect(validPassword('short')).toBe(false);
    expect(validPassword('Collab-admin')).toBe(true);
  });
});
