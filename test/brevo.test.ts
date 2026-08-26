import { describe, expect, it } from 'vitest';
import { brandedEmailTemplate, cashPaymentRequestEmailContent, confirmedPaymentEmailContent } from '../src/brevo';

describe('branded transactional email', () => {
  it('wraps content in an email-safe Collaboration Day identity', () => {
    const html = brandedEmailTemplate('https://collaborationday2026.web.id', 'Verifikasi akun', '<h1>Verifikasi email</h1><p><a href="https://example.com">Verifikasi</a></p>');

    expect(html).toContain('<!doctype html>');
    expect(html).toContain('role="presentation"');
    expect(html).toContain('https://collaborationday2026.web.id/brand/collaboration-day-2026.png');
    expect(html).toContain('Official Event Service');
    expect(html).toContain('<h1>Verifikasi email</h1>');
    expect(html).toContain('INFORMATIKA UIN SAIZU');
    expect(html).toContain('Email ini dikirim otomatis');
  });
});

describe('payment confirmation email', () => {
  it('includes the assigned group and private WhatsApp link', () => {
    const html = confirmedPaymentEmailContent('https://collaborationday2026.web.id', { participantName: 'Ayu', receiptNumber: 'CD26-123', groupName: 'Orion', groupWhatsappUrl: 'https://chat.whatsapp.com/orion-private' });

    expect(html).toContain('Kelompok Orion');
    expect(html).toContain('https://chat.whatsapp.com/orion-private');
    expect(html).toContain('Gabung grup WhatsApp');
    expect(html).toContain('https://collaborationday2026.web.id/dashboard');
  });
});

describe('cash payment request email', () => {
  it('notifies the pendamping with participant and WhatsApp context', () => {
    const html = cashPaymentRequestEmailContent('https://collaborationday2026.web.id', { participantName: 'Ayu', participantRef: 'CD26-123', participantPhone: '+6281234567890', groupName: 'Orion' });

    expect(html).toContain('Pengajuan pembayaran tunai baru');
    expect(html).toContain('Kelompok <b>Orion</b>');
    expect(html).toContain('CD26-123');
    expect(html).toContain('https://wa.me/6281234567890?text=');
    expect(html).toContain('Hubungi peserta via WhatsApp');
    expect(html).toContain('https://collaborationday2026.web.id/dashboard');
  });
});
