import type { Bindings } from './types';
import { decryptSetting } from './config-crypto';
import { escapeHtml } from './domain';

type BrevoResult = { messageId?: string };

export function brandedEmailTemplate(appOrigin: string, subject: string, content: string): string {
  const origin = appOrigin.replace(/\/$/, '');
  const year = new Date().getUTCFullYear();
  const safeSubject = escapeHtml(subject);
  return `<!doctype html><html lang="id"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${safeSubject}</title><style>body{margin:0;background:#eef0f6;color:#101532;font-family:Trebuchet MS,Verdana,sans-serif}table{border-collapse:collapse}img{border:0;display:block}a{color:#3757a6}.content h1{margin:0 0 18px;font-size:30px;line-height:1.15;color:#060a37}.content p{margin:0 0 18px;font-size:16px;line-height:1.65;color:#414862}.content a{display:inline-block;padding:14px 22px;background:#3757a6;color:#fff!important;text-decoration:none;font-weight:700}.content b{color:#060a37}@media(max-width:620px){.shell{width:100%!important}.pad{padding:28px 22px!important}.content h1{font-size:26px!important}}</style></head><body><div style="display:none;max-height:0;overflow:hidden;opacity:0">${safeSubject} · Collaboration Day 2026</div><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#eef0f6"><tr><td align="center" style="padding:32px 12px"><table role="presentation" class="shell" width="600" cellpadding="0" cellspacing="0" style="width:600px;max-width:100%;background:#fff;border:1px solid #d9ddeb"><tr><td class="pad" style="padding:28px 38px;background:#060a37"><table role="presentation" width="100%"><tr><td><img src="${origin}/brand/collaboration-day-2026.png" width="62" alt="Collaboration Day 2026" style="width:62px;height:auto"></td><td align="right" style="color:#c2b3da;font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase">Official Event Service</td></tr></table></td></tr><tr><td style="height:7px;background:#835eb5"></td></tr><tr><td class="pad content" style="padding:44px 38px">${content}<p style="margin-top:30px;padding-top:20px;border-top:1px solid #d9ddeb;font-size:13px;color:#68708c">Jika tombol tidak dapat dibuka, salin alamat tautan dari tombol melalui menu browser atau email client Anda.</p></td></tr><tr><td class="pad" style="padding:28px 38px;background:#c2b3da;color:#060a37"><p style="margin:0 0 8px;font-size:13px;font-weight:700">COLLABORATION DAY 2026 · INFORMATIKA UIN SAIZU</p><p style="margin:0 0 14px;font-size:12px;line-height:1.6">Email ini dikirim otomatis untuk keamanan dan operasional akun Collaboration Day. Jangan membalas atau membagikan tautan pribadi dari email ini.</p><p style="margin:0;font-size:12px"><a href="${origin}" style="color:#060a37">collaborationday2026.web.id</a> · © ${year} Collaboration Day</p></td></tr></table></td></tr></table></body></html>`;
}

export async function sendTransactionalEmail(env: Bindings, recipient: string, subject: string, html: string, attachment?: { name: string; contentBase64: string }): Promise<string | null> {
  const settingsRows = (await env.DB.prepare("SELECT key, value FROM app_settings WHERE key LIKE 'brevo_%'").all<{ key: string; value: string }>()).results;
  const settings = Object.fromEntries(settingsRows.map((row) => [row.key, row.value]));
  const encrypted = await env.DB.prepare("SELECT ciphertext, iv FROM encrypted_app_settings WHERE key='brevo_api_key'").first<{ ciphertext: string; iv: string }>();
  const apiKey = encrypted && env.CONFIG_ENCRYPTION_KEY ? await decryptSetting(env.CONFIG_ENCRYPTION_KEY, encrypted.ciphertext, encrypted.iv) : env.BREVO_API_KEY;
  const senderEmail = settings.brevo_sender_email || env.BREVO_SENDER_EMAIL;
  const senderName = settings.brevo_sender_name || env.BREVO_SENDER_NAME || 'Collaboration Day';
  if (settings.brevo_active === '0') throw new Error('Brevo integration is disabled');
  if (!apiKey || !senderEmail) {
    if (new URL(env.APP_ORIGIN).hostname === 'localhost') return null;
    throw new Error('Brevo is not configured');
  }
  const response = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'api-key': apiKey },
    body: JSON.stringify({
      sender: { email: senderEmail, name: senderName },
      to: [{ email: recipient }],
      subject,
      htmlContent: brandedEmailTemplate(env.APP_ORIGIN, subject, html),
      attachment: attachment ? [{ name: attachment.name, content: attachment.contentBase64 }] : undefined,
    }),
  });
  if (!response.ok) throw new Error(`Brevo request failed with status ${response.status}`);
  const result = await response.json<BrevoResult>();
  return result.messageId ?? null;
}
