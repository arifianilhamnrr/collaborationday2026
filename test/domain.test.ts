import { describe, expect, it } from 'vitest';
import { detectProofContentType, escapeHtml, formatRupiah, hmacHex, normalizeEmail, normalizeIndonesianPhone, safeEqual, sha256, validCashEntry, validEmail, validGallerySignature, validProofSignature } from '../src/domain';

describe('domain utilities', () => {
  it('normalizes and validates email', () => {
    expect(normalizeEmail(' Peserta@Example.COM ')).toBe('peserta@example.com');
    expect(validEmail('peserta@example.com')).toBe(true);
    expect(validEmail('not-an-email')).toBe(false);
  });

  it('escapes untrusted HTML', () => {
    expect(escapeHtml('<script>"x"</script>')).toBe('&lt;script&gt;&quot;x&quot;&lt;/script&gt;');
  });

  it('formats integer rupiah without decimals', () => {
    expect(formatRupiah(175000)).toMatch(/Rp\s?175\.000/);
  });

  it('validates cash installments against the remaining balance and settlement timing', () => {
    expect(validCashEntry(80000, 80000, 'paid')).toBe(true);
    expect(validCashEntry(40000, 80000, 'event')).toBe(true);
    expect(validCashEntry(80000, 80000, 'event')).toBe(false);
    expect(validCashEntry(40000, 80000, 'paid')).toBe(false);
    expect(validCashEntry(80001, 80000, 'technical_meeting')).toBe(false);
  });

  it('hashes and signs deterministically', async () => {
    expect(await sha256('abc')).toBe('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
    expect(await hmacHex('secret', 'message')).toHaveLength(64);
  });

  it('compares equal-length secrets', () => {
    expect(safeEqual('same', 'same')).toBe(true);
    expect(safeEqual('same', 'diff')).toBe(false);
    expect(safeEqual('short', 'longer')).toBe(false);
  });

  it('normalizes Indonesian WhatsApp numbers to E.164', () => {
    expect(normalizeIndonesianPhone('0812-3456-7890')).toBe('+6281234567890');
    expect(normalizeIndonesianPhone('+62 812 3456 7890')).toBe('+6281234567890');
    expect(normalizeIndonesianPhone('123')).toBeNull();
  });

  it('validates upload signatures instead of trusting MIME alone', async () => {
    const png = new File([new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])], 'proof.png', { type: 'image/png' });
    const androidJpg = new File([new Uint8Array([0xff, 0xd8, 0xff, 0xe1, 0, 0, 0, 0])], 'proof.jpg', { type: 'image/jpg' });
    const unknownJpg = new File([new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0])], 'camera.jpg');
    const fake = new File(['not a png'], 'proof.png', { type: 'image/png' });
    expect(await validProofSignature(png)).toBe(true);
    expect(await detectProofContentType(androidJpg)).toBe('image/jpeg');
    expect(await detectProofContentType(unknownJpg)).toBe('image/jpeg');
    expect(await validProofSignature(fake)).toBe(false);
  });

  it('validates supported gallery image signatures', async () => {
    const webp = new File([new Uint8Array([0x52,0x49,0x46,0x46,0,0,0,0,0x57,0x45,0x42,0x50])], 'gallery.webp', { type: 'image/webp' });
    const fake = new File(['not webp'], 'gallery.webp', { type: 'image/webp' });
    expect(await validGallerySignature(webp)).toBe(true);
    expect(await validGallerySignature(fake)).toBe(false);
  });
});
