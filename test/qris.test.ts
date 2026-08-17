import { describe, expect, it } from 'vitest';
import { qrisWithAmount } from '../src/qris';

const staticPayload = '00020101021126610014COM.GO-JEK.WWW01189360091438473797550210G8473797550303UMI51440014ID.CO.QRIS.WWW0215ID10265704879870303UMI5204549953033605802ID5921Arkan_Store, SIRAMPOG6006BREBES61055227262070703A01630483ED';

describe('dynamic QRIS payload', () => {
  it('injects the registration amount, switches to dynamic mode, and recalculates CRC', () => {
    const result = qrisWithAmount(staticPayload, 120000);

    expect(result).toContain('010212');
    expect(result).toContain('5406120000');
    expect(result).not.toContain('010211');
    expect(result).not.toBe(staticPayload);
    expect(result).toMatch(/6304[0-9A-F]{4}$/);
    expect(qrisWithAmount(result, 120000)).toBe(result);
  });

  it('rejects invalid amounts and malformed payloads', () => {
    expect(() => qrisWithAmount(staticPayload, 0)).toThrow('Nominal QRIS tidak valid');
    expect(() => qrisWithAmount('not-qris', 120000)).toThrow('Struktur payload QRIS tidak valid');
  });
});
