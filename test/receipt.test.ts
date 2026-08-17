import { describe, expect, it } from 'vitest';
import { generateReceiptPdf } from '../src/receipt';

describe('electronic receipt PDF', () => {
  it('generates a valid single-page PDF containing receipt data', () => {
    const pdf = generateReceiptPdf({
      receiptNumber: 'CD26-TEST123',
      participantName: 'Ayu Pratama',
      participantCode: 'CD2026-AYU',
      eventTitle: 'Collaboration Day 2026',
      eventTheme: 'Connecting Minds in the Digital Universe',
      venue: 'Bumi Perkemahan Munjuluhur',
      amount: 120000,
      paymentMethod: 'Transfer Bank',
      verifiedAt: '5 September 2026 10.00',
    });
    const text = new TextDecoder().decode(pdf);

    expect(text.startsWith('%PDF-1.4')).toBe(true);
    expect(text).toContain('CD26-TEST123');
    expect(text).toContain('Ayu Pratama');
    expect(text).toContain('Rp 120.000');
    expect(text).toContain('%%EOF');
  });
});
