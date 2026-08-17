import { describe, expect, it } from 'vitest';
import { brandedEmailTemplate } from '../src/brevo';

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
