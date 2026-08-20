import { Hono, type Context } from 'hono';
import QRCode from 'qrcode';
import { createSession, csrfValid, destroySession, hashPassword, loadSession, originAllowed, validPassword, verifyPassword } from './auth';
import { sendTransactionalEmail } from './brevo';
import { encryptSetting } from './config-crypto';
import { ALLOWED_GALLERY_TYPES, MAX_GALLERY_BYTES, MAX_PROOF_BYTES, bytesToBase64, detectProofContentType, escapeHtml, hmacHex, normalizeEmail, normalizeIndonesianPhone, randomToken, safeEqual, sha256, validCashEntry, validEmail, validGallerySignature, type ProofContentType } from './domain';
import { generateReceiptPdf } from './receipt';
import { qrisWithAmount } from './qris';
import { rateLimit, verifyTurnstile } from './security';
import type { Bindings, Profile, StaffProfile, User, Variables } from './types';
import { accountProfilePage, adminEventPage, adminGalleryPage, adminIntegrationsPage, adminOverviewPage, adminParticipantsPage, adminPaymentsPage, adminTeamPage, authPage, landing, layout, participantDashboard, paymentMethodsPage, pendampingDashboardPage, staffVerificationPage, temporaryFailurePage, verifyEmailPage, whatsarPairingPage, type BenefitItem, type Edition, type Gallery, type PaymentMethod } from './views';
import { getWhatsarConfig, loadWhatsarOverview, WhatsarRequestError, whatsarRequest, type WhatsarSession } from './whatsar';

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>();

async function autoAssignParticipantGroup(db: D1Database, participantId: number): Promise<boolean> {
  const edition = await db.prepare("SELECT id FROM event_editions WHERE status='published' ORDER BY year DESC,id DESC LIMIT 1").first<{ id: number }>();
  if (!edition) return false;
  const result = await db.prepare(`INSERT OR IGNORE INTO participant_group_memberships (group_id,edition_id,participant_id)
    SELECT pg.id,pg.edition_id,p.id
    FROM participants p
    JOIN participant_groups pg ON pg.edition_id=?
    WHERE p.id=? AND p.gender IN ('male','female') AND p.phone IS NOT NULL AND p.phone!=''
      AND NOT EXISTS (SELECT 1 FROM participant_group_memberships existing WHERE existing.edition_id=? AND existing.participant_id=p.id)
    ORDER BY
      (SELECT COUNT(*) FROM participant_group_memberships same_gender JOIN participants member ON member.id=same_gender.participant_id WHERE same_gender.group_id=pg.id AND member.gender=p.gender),
      (SELECT COUNT(*) FROM participant_group_memberships all_members WHERE all_members.group_id=pg.id),
      ((pg.id * 1103515245 + p.id * 12345) & 2147483647),
      pg.id
    LIMIT 1`).bind(edition.id, participantId, edition.id).run();
  if (result.meta.changes) return true;
  return Boolean(await db.prepare('SELECT 1 FROM participant_group_memberships WHERE edition_id=? AND participant_id=?').bind(edition.id, participantId).first());
}

app.use('*', async (c, next) => {
  c.set('user', await loadSession(c));
  await next();
  const proofPreview = /^\/dashboard\/payments\/[^/]+\/proof$/.test(c.req.path) && c.req.query('preview') === '1';
  c.header('X-Content-Type-Options', 'nosniff');
  c.header('Referrer-Policy', 'strict-origin-when-cross-origin');
  c.header('X-Frame-Options', proofPreview ? 'SAMEORIGIN' : 'DENY');
  c.header('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  c.header('Content-Security-Policy', proofPreview ? "default-src 'none'; frame-ancestors 'self';" : "default-src 'self'; img-src 'self' data:; style-src 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; script-src 'self' https://challenges.cloudflare.com https://static.cloudflareinsights.com; frame-src 'self' https://challenges.cloudflare.com https://www.google.com; connect-src 'self' https://challenges.cloudflare.com https://cloudflareinsights.com; form-action 'self'; frame-ancestors 'none'; base-uri 'self'");
  if (c.get('user')) c.header('Cache-Control', 'private, no-store');
});

app.use('*', async (c, next) => {
  if (!['GET', 'HEAD', 'OPTIONS'].includes(c.req.method) && !originAllowed(c)) return c.text('Origin tidak valid.', 403);
  await next();
});

app.get('/', async (c) => {
  c.header('Cache-Control', 'no-cache, must-revalidate');
  const current = await c.env.DB.prepare("SELECT * FROM event_editions WHERE status = 'published' ORDER BY year DESC LIMIT 1").first<Edition>();
  if (!current) return c.html(layout('Collaboration Day', '<main class="panel"><h1>Segera hadir.</h1></main>'), 503);
  const archived = (await c.env.DB.prepare("SELECT * FROM event_editions WHERE status = 'archived' ORDER BY year DESC").all<Edition>()).results;
  const gallery = (await c.env.DB.prepare(`SELECT g.image_url, g.alt_text, g.caption, g.photographer, e.year FROM galleries g JOIN event_editions e ON e.id=g.edition_id WHERE e.status='archived' AND g.is_published=1 ORDER BY e.year DESC, g.sort_order, g.id`).all<Gallery>()).results;
  const benefits = (await c.env.DB.prepare('SELECT id, title, description FROM event_benefits WHERE edition_id=? ORDER BY sort_order,id').bind(current.id).all<BenefitItem>()).results;
  return c.html(landing(current, archived, gallery, benefits));
});

app.get('/assets/demo-qris.svg', (c) => c.body('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300"><rect width="300" height="300" fill="#fff"/><rect x="15" y="15" width="270" height="270" fill="none" stroke="#060a37" stroke-width="8"/><text x="150" y="140" text-anchor="middle" font-family="sans-serif" font-weight="bold" font-size="24">DEMO QRIS</text><text x="150" y="175" text-anchor="middle" font-family="sans-serif" font-size="12">BUKAN KODE PEMBAYARAN</text></svg>', 200, { 'Content-Type': 'image/svg+xml', 'Cache-Control': 'public, max-age=86400' }));

app.get('/media/gallery/:filename', async (c) => {
  const match = /^(\d+)\.webp$/.exec(c.req.param('filename'));
  if (!match) return c.text('Foto tidak ditemukan.', 404);
  const item = await c.env.DB.prepare('SELECT object_key FROM galleries WHERE id=? AND object_key IS NOT NULL AND is_published=1').bind(Number(match[1])).first<{ object_key: string }>();
  if (!item) return c.text('Foto tidak ditemukan.', 404);
  const object = await c.env.PROOFS.get(item.object_key);
  if (!object) return c.text('Berkas foto tidak ditemukan.', 404);
  return new Response(object.body, { headers: { 'Content-Type': 'image/webp', 'Cache-Control': 'public, max-age=31536000, immutable', 'Content-Length': String(object.size), 'X-Content-Type-Options': 'nosniff' } });
});

app.get('/archive', (c) => c.redirect('/#arsip', 302));
app.get('/archive/:year', (c) => c.redirect('/#arsip', 302));

app.get('/signup', (c) => c.get('user') ? c.redirect('/dashboard') : c.html(authPage('signup', '', '', c.env.TURNSTILE_SITE_KEY)));
app.post('/signup', async (c) => {
  const body = await c.req.parseBody();
  const email = normalizeEmail(String(body.email ?? ''));
  const password = String(body.password ?? '');
  if (!(await rateLimit(c, 'signup', 5, 3600))) return c.html(authPage('signup', 'Terlalu banyak percobaan. Coba lagi nanti.', '', c.env.TURNSTILE_SITE_KEY), 429);
  if (!(await verifyTurnstile(c, body['cf-turnstile-response']))) return c.html(authPage('signup', 'Verifikasi keamanan belum berhasil.', '', c.env.TURNSTILE_SITE_KEY), 400);
  if (!validEmail(email) || !validPassword(password) || body.consent !== 'yes') return c.html(authPage('signup', 'Gunakan email valid, password minimal 10 karakter, dan setujui kebijakan privasi.', '', c.env.TURNSTILE_SITE_KEY), 400);
  const passwordHash = await hashPassword(password);
  const adminEmails = (c.env.ADMIN_EMAILS ?? '').split(',').map(normalizeEmail).filter(Boolean);
  const role = adminEmails.includes(email) ? 'admin' : 'participant';
  let userId: number;
  try {
    const result = await c.env.DB.prepare('INSERT INTO users (email, password_hash, role) VALUES (?, ?, ?)').bind(email, passwordHash, role).run();
    userId = Number(result.meta.last_row_id);
  } catch (error) {
    if (String(error).includes('UNIQUE')) return c.html(authPage('signup', 'Akun tidak dapat dibuat. Jika email sudah terdaftar, silakan masuk atau reset password.'), 409);
    throw error;
  }
  try {
    await issueEmailVerification(c.env, userId, email);
  } catch (error) {
    console.error(error instanceof Error ? `Email verification delivery failed: ${error.message}` : 'Email verification delivery failed');
  }
  await createSession(c, userId);
  return c.redirect('/dashboard', 303);
});

app.get('/login', (c) => c.get('user') ? c.redirect('/dashboard') : c.html(authPage('login', '', '', c.env.TURNSTILE_SITE_KEY)));
app.post('/login', async (c) => {
  const body = await c.req.parseBody();
  const email = normalizeEmail(String(body.email ?? ''));
  const password = String(body.password ?? '');
  if (!(await rateLimit(c, 'login', 10, 900))) return c.html(authPage('login', 'Terlalu banyak percobaan masuk. Coba lagi nanti.', '', c.env.TURNSTILE_SITE_KEY), 429);
  if (!(await verifyTurnstile(c, body['cf-turnstile-response']))) return c.html(authPage('login', 'Verifikasi keamanan belum berhasil.', '', c.env.TURNSTILE_SITE_KEY), 400);
  const user = await c.env.DB.prepare('SELECT * FROM users WHERE email=? AND status=\'active\'').bind(email).first<User>();
  if (!user || !(await verifyPassword(password, user.password_hash))) return c.html(authPage('login', 'Email atau password tidak sesuai.', '', c.env.TURNSTILE_SITE_KEY), 401);
  await createSession(c, user.id);
  return c.redirect('/dashboard', 303);
});

app.post('/logout', async (c) => {
  const body = await c.req.parseBody();
  if (!csrfValid(c, body.csrf_token)) return c.text('Permintaan tidak valid.', 403);
  await destroySession(c);
  return c.redirect('/', 303);
});

app.get('/verify-email', (c) => c.html(verifyEmailPage(c.req.query('token') ?? '')));
app.post('/verify-email', async (c) => {
  const body = await c.req.parseBody();
  const token = String(body.token ?? '');
  const tokenHash = await sha256(`${token}:${c.env.TOKEN_PEPPER}`);
  const challenge = await c.env.DB.prepare("SELECT id, user_id FROM email_verification_challenges WHERE token_hash=? AND consumed_at IS NULL AND datetime(expires_at)>datetime('now')").bind(tokenHash).first<{ id: number; user_id: number }>();
  if (!challenge) return c.html(verifyEmailPage('', 'Tautan verifikasi tidak valid atau sudah kedaluwarsa.'), 400);
  await c.env.DB.batch([
    c.env.DB.prepare('UPDATE email_verification_challenges SET consumed_at=CURRENT_TIMESTAMP WHERE id=?').bind(challenge.id),
    c.env.DB.prepare('UPDATE users SET email_verified_at=CURRENT_TIMESTAMP, updated_at=CURRENT_TIMESTAMP WHERE id=?').bind(challenge.user_id),
  ]);
  return c.redirect('/dashboard', 303);
});

app.get('/forgot-password', (c) => c.html(authPage('forgot')));
app.post('/forgot-password', async (c) => {
  const body = await c.req.parseBody();
  const email = normalizeEmail(String(body.email ?? ''));
  const user = await c.env.DB.prepare("SELECT id, email FROM users WHERE email=? AND status='active'").bind(email).first<{ id: number; email: string }>();
  if (user) await issuePasswordReset(c.env, user.id, user.email);
  return c.html(authPage('forgot', 'Jika akun ditemukan, tautan reset telah dikirim.'));
});
app.get('/reset-password', (c) => c.html(authPage('reset', '', c.req.query('token') ?? '')));
app.post('/reset-password', async (c) => {
  const body = await c.req.parseBody();
  const token = String(body.token ?? '');
  const password = String(body.password ?? '');
  if (!validPassword(password)) return c.html(authPage('reset', 'Password harus 10–128 karakter.', token), 400);
  const tokenHash = await sha256(`${token}:${c.env.TOKEN_PEPPER}`);
  const challenge = await c.env.DB.prepare("SELECT id, user_id FROM password_reset_challenges WHERE token_hash=? AND consumed_at IS NULL AND datetime(expires_at)>datetime('now')").bind(tokenHash).first<{ id: number; user_id: number }>();
  if (!challenge) return c.html(authPage('reset', 'Tautan reset tidak valid atau sudah kedaluwarsa.'), 400);
  const passwordHash = await hashPassword(password);
  await c.env.DB.batch([
    c.env.DB.prepare('UPDATE users SET password_hash=?, updated_at=CURRENT_TIMESTAMP WHERE id=?').bind(passwordHash, challenge.user_id),
    c.env.DB.prepare('UPDATE password_reset_challenges SET consumed_at=CURRENT_TIMESTAMP WHERE id=?').bind(challenge.id),
    c.env.DB.prepare('UPDATE sessions SET revoked_at=CURRENT_TIMESTAMP WHERE user_id=? AND revoked_at IS NULL').bind(challenge.user_id),
  ]);
  return c.html(authPage('login', 'Password berhasil diperbarui. Silakan masuk.'));
});

app.use('/dashboard/*', async (c, next) => {
  const user = c.get('user');
  if (!user) return c.redirect('/login');
  if (user.role !== 'participant' && !user.email_verified_at && c.req.path !== '/dashboard' && c.req.path !== '/dashboard/email/resend') return c.text('Verifikasi email staf terlebih dahulu.', 403);
  await next();
});

app.get('/dashboard', async (c) => {
  const user = c.get('user')!;
  const message = c.req.query('message') ?? '';
  if (user.role !== 'participant' && !user.email_verified_at) return c.html(staffVerificationPage(user, message));
  if (user.role === 'admin' && user.email_verified_at) {
    const counts = await c.env.DB.prepare(`SELECT (SELECT COUNT(*) FROM registrations WHERE status!='cancelled') participants, (SELECT COUNT(*) FROM payment_submissions WHERE status='pending') pending, (SELECT COUNT(*) FROM registrations WHERE status='confirmed') confirmed`).first<Record<string, number>>();
    const recent = (await c.env.DB.prepare(`SELECT ps.status, ps.submitted_at, r.public_id, p.full_name FROM payment_submissions ps JOIN registrations r ON r.id=ps.registration_id JOIN participants p ON p.id=r.participant_id ORDER BY ps.submitted_at DESC LIMIT 8`).all<Record<string, unknown>>()).results;
    return c.html(adminOverviewPage(user, counts ?? {}, recent, message));
  }
  if (user.role === 'bendahara') {
    const payments = user.email_verified_at ? (await c.env.DB.prepare(`SELECT ps.id, ps.status, ps.submitted_at, r.public_id, r.amount_due, p.full_name, pm.label AS payment_method, pm.type AS payment_type, er.id AS receipt_id, er.email_status, er.whatsapp_status FROM payment_submissions ps JOIN registrations r ON r.id=ps.registration_id JOIN participants p ON p.id=r.participant_id JOIN payment_methods pm ON pm.id=ps.payment_method_id LEFT JOIN electronic_receipts er ON er.registration_id=r.id WHERE pm.type!='cash' ORDER BY ps.submitted_at DESC LIMIT 200`).all<Record<string, unknown>>()).results : [];
    return c.html(adminPaymentsPage(user, payments, message));
  }
  if (user.role === 'pendamping') {
    const staff = await c.env.DB.prepare('SELECT * FROM staff_profiles WHERE user_id=?').bind(user.id).first<StaffProfile>();
    const group = await c.env.DB.prepare(`SELECT pg.* FROM participant_groups pg JOIN event_editions e ON e.id=pg.edition_id WHERE pg.pendamping_user_id=? AND e.status='published' ORDER BY e.year DESC LIMIT 1`).bind(user.id).first<Record<string, unknown>>();
    const members = group ? (await c.env.DB.prepare(`SELECT p.id,p.full_name,p.phone,sfp.id AS social_proof_id,sfp.status AS social_proof_status,sfp.rejection_reason FROM participant_group_memberships pgm JOIN participants p ON p.id=pgm.participant_id LEFT JOIN social_follow_proofs sfp ON sfp.participant_id=p.id WHERE pgm.group_id=? ORDER BY p.full_name`).bind(group.id).all<Record<string, unknown>>()).results : [];
    const cashPayments = group ? (await c.env.DB.prepare(`SELECT ps.id,r.public_id,r.amount_due,p.full_name,COALESCE((SELECT SUM(cpe.amount_received) FROM cash_payment_entries cpe WHERE cpe.payment_submission_id=ps.id),0) AS amount_paid,(SELECT cpe.settlement_timing FROM cash_payment_entries cpe WHERE cpe.payment_submission_id=ps.id ORDER BY cpe.id DESC LIMIT 1) AS last_timing FROM payment_submissions ps JOIN payment_methods pm ON pm.id=ps.payment_method_id JOIN registrations r ON r.id=ps.registration_id JOIN participants p ON p.id=r.participant_id JOIN participant_group_memberships pgm ON pgm.participant_id=p.id AND pgm.edition_id=r.edition_id WHERE pgm.group_id=? AND pm.type='cash' AND ps.status='pending' ORDER BY ps.submitted_at`).bind(group.id).all<Record<string, unknown>>()).results : [];
    return c.html(pendampingDashboardPage(user, staff, group, members, cashPayments, message));
  }
  if (user.role !== 'participant') return c.text('Role akun tidak dikenali.', 403);
  let profile = await c.env.DB.prepare(`SELECT p.*,
    (SELECT pg.name FROM participant_group_memberships pgm JOIN participant_groups pg ON pg.id=pgm.group_id JOIN event_editions e ON e.id=pgm.edition_id WHERE pgm.participant_id=p.id AND e.status='published' LIMIT 1) AS group_name,
    (SELECT pg.whatsapp_invite_url FROM participant_group_memberships pgm JOIN participant_groups pg ON pg.id=pgm.group_id JOIN event_editions e ON e.id=pgm.edition_id WHERE pgm.participant_id=p.id AND e.status='published' LIMIT 1) AS group_whatsapp_url
    FROM participants p WHERE p.user_id=?`).bind(user.id).first<Profile>();
  if (profile?.gender && profile.phone && !profile.group_name) {
    await autoAssignParticipantGroup(c.env.DB, profile.id);
    profile = await c.env.DB.prepare(`SELECT p.*,
      (SELECT pg.name FROM participant_group_memberships pgm JOIN participant_groups pg ON pg.id=pgm.group_id JOIN event_editions e ON e.id=pgm.edition_id WHERE pgm.participant_id=p.id AND e.status='published' ORDER BY e.year DESC LIMIT 1) AS group_name,
      (SELECT pg.whatsapp_invite_url FROM participant_group_memberships pgm JOIN participant_groups pg ON pg.id=pgm.group_id JOIN event_editions e ON e.id=pgm.edition_id WHERE pgm.participant_id=p.id AND e.status='published' ORDER BY e.year DESC LIMIT 1) AS group_whatsapp_url
      FROM participants p WHERE p.id=?`).bind(profile.id).first<Profile>();
  }
  const edition = await c.env.DB.prepare("SELECT * FROM event_editions WHERE status='published' ORDER BY year DESC LIMIT 1").first<Edition>();
  const socialProof = profile ? await c.env.DB.prepare('SELECT id,status FROM social_follow_proofs WHERE participant_id=?').bind(profile.id).first<{ id: number; status: string }>() : null;
  const admissionProof = profile ? await c.env.DB.prepare('SELECT id FROM admission_proofs WHERE participant_id=?').bind(profile.id).first() : null;
  const registration = profile ? await c.env.DB.prepare(`SELECT r.*, e.title, e.theme, e.venue,
    r.participant_ref AS ticket_reference,
    (SELECT id FROM electronic_receipts WHERE registration_id=r.id) AS receipt_id,
    (SELECT rejection_reason FROM payment_submissions WHERE registration_id=r.id AND status='rejected' ORDER BY reviewed_at DESC LIMIT 1) AS rejection_reason,
    (SELECT COALESCE(SUM(cpe.amount_received),0) FROM payment_submissions cps JOIN payment_methods cpm ON cpm.id=cps.payment_method_id LEFT JOIN cash_payment_entries cpe ON cpe.payment_submission_id=cps.id WHERE cps.registration_id=r.id AND cpm.type='cash') AS cash_paid,
    (SELECT cpe.settlement_timing FROM payment_submissions cps JOIN payment_methods cpm ON cpm.id=cps.payment_method_id JOIN cash_payment_entries cpe ON cpe.payment_submission_id=cps.id WHERE cps.registration_id=r.id AND cpm.type='cash' ORDER BY cpe.id DESC LIMIT 1) AS cash_timing,
    (SELECT pg.name FROM participant_group_memberships pgm JOIN participant_groups pg ON pg.id=pgm.group_id WHERE pgm.participant_id=r.participant_id AND pgm.edition_id=r.edition_id LIMIT 1) AS group_name,
    (SELECT pg.whatsapp_invite_url FROM participant_group_memberships pgm JOIN participant_groups pg ON pg.id=pgm.group_id WHERE pgm.participant_id=r.participant_id AND pgm.edition_id=r.edition_id LIMIT 1) AS group_whatsapp_url
    FROM registrations r JOIN event_editions e ON e.id=r.edition_id WHERE r.participant_id=? ORDER BY r.id DESC LIMIT 1`).bind(profile.id).first<Record<string, unknown>>() : null;
  const methods = registration ? (await c.env.DB.prepare('SELECT * FROM payment_methods WHERE edition_id=? AND is_active=1 ORDER BY sort_order').bind(registration.edition_id).all<PaymentMethod>()).results : [];
  return c.html(participantDashboard(user, profile, edition, registration, methods, socialProof?.status ?? '', Boolean(admissionProof), message));
});

app.get('/dashboard/payments', async (c) => {
  const user = c.get('user')!;
  if (!['admin', 'bendahara'].includes(user.role) || !user.email_verified_at) return c.text('Tidak diizinkan.', 403);
  const payments = (await c.env.DB.prepare(`SELECT ps.id, ps.status, ps.submitted_at, r.public_id, r.amount_due, p.full_name, pm.label AS payment_method, pm.type AS payment_type, er.id AS receipt_id, er.email_status, er.whatsapp_status FROM payment_submissions ps JOIN registrations r ON r.id=ps.registration_id JOIN participants p ON p.id=r.participant_id JOIN payment_methods pm ON pm.id=ps.payment_method_id LEFT JOIN electronic_receipts er ON er.registration_id=r.id WHERE pm.type!='cash' ORDER BY ps.submitted_at DESC LIMIT 200`).all<Record<string, unknown>>()).results;
  return c.html(adminPaymentsPage(user, payments, c.req.query('message') ?? ''));
});

app.get('/dashboard/payment-methods', async (c) => {
  const user = c.get('user')!;
  if (!['admin', 'bendahara'].includes(user.role) || !user.email_verified_at) return c.text('Tidak diizinkan.', 403);
  const edition = await c.env.DB.prepare("SELECT * FROM event_editions WHERE status='published' ORDER BY year DESC LIMIT 1").first<Edition>();
  const methods = edition ? (await c.env.DB.prepare('SELECT * FROM payment_methods WHERE edition_id=? ORDER BY sort_order,id').bind(edition.id).all<PaymentMethod>()).results : [];
  return c.html(paymentMethodsPage(user, edition, methods, c.req.query('message') ?? ''));
});

app.get('/dashboard/account', async (c) => {
  const user = c.get('user')!;
  if (!['admin', 'bendahara', 'pendamping'].includes(user.role) || !user.email_verified_at) return c.text('Tidak diizinkan.', 403);
  const staff = user.role === 'admin' ? null : await c.env.DB.prepare('SELECT * FROM staff_profiles WHERE user_id=?').bind(user.id).first<StaffProfile>();
  return c.html(accountProfilePage(user, staff, c.req.query('message') ?? ''));
});

app.post('/dashboard/account', async (c) => {
  const user = c.get('user')!;
  const body = await c.req.parseBody();
  const displayName = String(body.display_name ?? '').trim();
  if (!['admin', 'bendahara', 'pendamping'].includes(user.role) || !csrfValid(c, body.csrf_token) || displayName.length < 2 || displayName.length > 100) return c.text('Profil tidak valid.', 400);
  const statements: D1PreparedStatement[] = [
    c.env.DB.prepare('UPDATE users SET display_name=?,updated_at=CURRENT_TIMESTAMP WHERE id=?').bind(displayName, user.id),
  ];
  if (user.role !== 'admin') {
    const rawPhone = String(body.phone ?? '').trim();
    const phone = rawPhone ? normalizeIndonesianPhone(rawPhone) : null;
    if ((user.role === 'pendamping' && !phone) || (rawPhone && !phone)) return c.text('Nomor WhatsApp tidak valid.', 400);
    statements.push(c.env.DB.prepare(`UPDATE staff_profiles SET full_name=?,phone_e164=?,whatsapp_verified_at=CASE WHEN ? IS NOT NULL THEN CURRENT_TIMESTAMP ELSE NULL END,updated_at=CURRENT_TIMESTAMP WHERE user_id=?`).bind(displayName, phone, phone, user.id));
  }
  statements.push(c.env.DB.prepare("INSERT INTO audit_logs (actor_user_id,action,subject_type,subject_id) VALUES (?,'account.profile_updated','user',?)").bind(user.id, String(user.id)));
  try {
    await c.env.DB.batch(statements);
  } catch (error) {
    if (String(error).includes('UNIQUE')) return c.text('Nomor WhatsApp sudah digunakan akun lain.', 409);
    throw error;
  }
  return redirectMessage(c, 'Profil berhasil diperbarui.');
});

app.post('/dashboard/account/password', async (c) => {
  const user = c.get('user')!;
  const body = await c.req.parseBody();
  const currentPassword = String(body.current_password ?? '');
  const newPassword = String(body.new_password ?? '');
  const confirmPassword = String(body.confirm_password ?? '');
  if (!['admin', 'bendahara', 'pendamping'].includes(user.role) || !csrfValid(c, body.csrf_token)) return c.text('Tidak diizinkan.', 403);
  if (!(await rateLimit(c, 'account-password', 8, 900))) return c.text('Terlalu banyak percobaan password. Coba lagi nanti.', 429);
  if (!(await verifyPassword(currentPassword, user.password_hash))) return redirectMessage(c, 'Password saat ini tidak sesuai.');
  if (!validPassword(newPassword) || newPassword !== confirmPassword || newPassword === currentPassword) return redirectMessage(c, 'Password baru harus 10–128 karakter, sama pada kedua kolom, dan berbeda dari password saat ini.');
  const passwordHash = await hashPassword(newPassword);
  await c.env.DB.batch([
    c.env.DB.prepare('UPDATE users SET password_hash=?,updated_at=CURRENT_TIMESTAMP WHERE id=?').bind(passwordHash, user.id),
    c.env.DB.prepare('UPDATE sessions SET revoked_at=CURRENT_TIMESTAMP WHERE user_id=? AND id!=? AND revoked_at IS NULL').bind(user.id, user.session_id),
    c.env.DB.prepare("INSERT INTO audit_logs (actor_user_id,action,subject_type,subject_id) VALUES (?,'account.password_changed','user',?)").bind(user.id, String(user.id)),
  ]);
  return redirectMessage(c, 'Password berhasil diperbarui. Sesi di perangkat lain telah dikeluarkan.');
});

app.get('/dashboard/team', async (c) => {
  const user = c.get('user')!;
  if (user.role !== 'admin') return c.text('Tidak diizinkan.', 403);
  const edition = await c.env.DB.prepare("SELECT * FROM event_editions WHERE status='published' ORDER BY year DESC LIMIT 1").first<Edition>();
  const staff = (await c.env.DB.prepare(`SELECT u.id AS user_id,u.email,sp.role,sp.full_name,sp.phone_e164,sp.whatsapp_verified_at FROM staff_profiles sp JOIN users u ON u.id=sp.user_id ORDER BY sp.role,COALESCE(sp.full_name,u.email)`).all<Record<string, unknown>>()).results;
  const groups = edition ? (await c.env.DB.prepare(`SELECT pg.*,u.email AS pendamping_email,sp.full_name AS pendamping_name,COUNT(pgm.participant_id) AS member_count FROM participant_groups pg LEFT JOIN users u ON u.id=pg.pendamping_user_id LEFT JOIN staff_profiles sp ON sp.user_id=u.id LEFT JOIN participant_group_memberships pgm ON pgm.group_id=pg.id WHERE pg.edition_id=? GROUP BY pg.id ORDER BY pg.name`).bind(edition.id).all<Record<string, unknown>>()).results : [];
  const participants = edition ? (await c.env.DB.prepare(`SELECT p.id,p.full_name,p.email,pgm.group_id,pg.name AS group_name FROM participants p LEFT JOIN participant_group_memberships pgm ON pgm.participant_id=p.id AND pgm.edition_id=? LEFT JOIN participant_groups pg ON pg.id=pgm.group_id ORDER BY p.full_name`).bind(edition.id).all<Record<string, unknown>>()).results : [];
  return c.html(adminTeamPage(user, edition, staff, groups, participants, c.req.query('message') ?? ''));
});

app.post('/dashboard/team/roles', async (c) => {
  const user = c.get('user')!;
  const body = await c.req.parseBody();
  if (user.role !== 'admin' || !csrfValid(c, body.csrf_token)) return c.text('Tidak diizinkan.', 403);
  const email = normalizeEmail(String(body.email ?? ''));
  const role = String(body.role ?? '');
  if (!validEmail(email) || !['pendamping', 'bendahara'].includes(role)) return c.text('Role atau email tidak valid.', 400);
  const target = await c.env.DB.prepare("SELECT u.id,COALESCE(sp.role,u.role) AS role,p.full_name FROM users u LEFT JOIN staff_profiles sp ON sp.user_id=u.id LEFT JOIN participants p ON p.user_id=u.id WHERE u.email=? AND u.role!='admin'").bind(email).first<{ id: number; role: string; full_name: string | null }>();
  if (!target) return c.text('Akun tidak ditemukan atau tidak dapat diubah.', 404);
  if (target.role === 'pendamping' && role !== 'pendamping' && await c.env.DB.prepare('SELECT id FROM participant_groups WHERE pendamping_user_id=? LIMIT 1').bind(target.id).first()) return c.text('Pindahkan kelompok dari pendamping ini sebelum mengubah role.', 409);
  await c.env.DB.batch([
    c.env.DB.prepare(`INSERT INTO staff_profiles (user_id,role,full_name) VALUES (?,?,?) ON CONFLICT(user_id) DO UPDATE SET role=excluded.role,updated_at=CURRENT_TIMESTAMP`).bind(target.id, role, target.full_name || email),
    c.env.DB.prepare('UPDATE users SET display_name=COALESCE(display_name,?),updated_at=CURRENT_TIMESTAMP WHERE id=?').bind(target.full_name || email, target.id),
    c.env.DB.prepare("INSERT INTO audit_logs (actor_user_id,action,subject_type,subject_id,metadata_json) VALUES (?,'user.role_updated','user',?,?)").bind(user.id, String(target.id), JSON.stringify({ previousRole: target.role, role })),
  ]);
  return redirectMessage(c, `Role ${email} diubah menjadi ${role}.`);
});

app.post('/dashboard/team/groups', async (c) => {
  const user = c.get('user')!;
  const body = await c.req.parseBody();
  const editionId = Number(body.edition_id);
  const pendampingValue = String(body.pendamping_user_id ?? '').trim();
  const pendampingUserId = pendampingValue ? Number(pendampingValue) : null;
  const name = String(body.name ?? '').trim();
  if (user.role !== 'admin' || !csrfValid(c, body.csrf_token) || !Number.isInteger(editionId) || (pendampingUserId !== null && !Number.isInteger(pendampingUserId)) || name.length < 2 || name.length > 80) return c.text('Data kelompok tidak valid.', 400);
  const validPendamping = pendampingUserId === null || await c.env.DB.prepare("SELECT u.id FROM users u JOIN staff_profiles sp ON sp.user_id=u.id WHERE u.id=? AND sp.role='pendamping' AND u.status='active'").bind(pendampingUserId).first();
  const edition = await c.env.DB.prepare('SELECT id FROM event_editions WHERE id=?').bind(editionId).first();
  if (!validPendamping || !edition) return c.text('Pendamping atau edition tidak valid.', 400);
  try {
    const result = await c.env.DB.prepare('INSERT INTO participant_groups (edition_id,name,pendamping_user_id,created_by_user_id) VALUES (?,?,?,?)').bind(editionId, name, pendampingUserId, user.id).run();
    await c.env.DB.prepare("INSERT INTO audit_logs (actor_user_id,action,subject_type,subject_id) VALUES (?,'participant_group.created','participant_group',?)").bind(user.id, String(result.meta.last_row_id)).run();
  } catch (error) {
    if (String(error).includes('UNIQUE')) return c.text('Nama kelompok atau pendamping sudah digunakan pada edition ini.', 409);
    throw error;
  }
  return redirectMessage(c, 'Kelompok berhasil dibuat.');
});

app.post('/dashboard/team/groups/:id/pendamping', async (c) => {
  const user = c.get('user')!;
  const body = await c.req.parseBody();
  const groupId = Number(c.req.param('id'));
  const pendampingUserId = Number(body.pendamping_user_id);
  if (user.role !== 'admin' || !csrfValid(c, body.csrf_token) || !Number.isInteger(groupId) || !Number.isInteger(pendampingUserId)) return c.text('Perubahan pendamping tidak valid.', 400);
  const pendamping = await c.env.DB.prepare("SELECT u.id FROM users u JOIN staff_profiles sp ON sp.user_id=u.id WHERE u.id=? AND sp.role='pendamping' AND u.status='active'").bind(pendampingUserId).first();
  if (!pendamping) return c.text('Pendamping tidak ditemukan.', 404);
  try {
    const result = await c.env.DB.prepare('UPDATE participant_groups SET pendamping_user_id=?,updated_at=CURRENT_TIMESTAMP WHERE id=?').bind(pendampingUserId, groupId).run();
    if (!result.meta.changes) return c.text('Kelompok tidak ditemukan.', 404);
  } catch (error) {
    if (String(error).includes('UNIQUE')) return c.text('Pendamping tersebut sudah menangani kelompok lain pada edition ini.', 409);
    throw error;
  }
  return redirectMessage(c, 'Pendamping kelompok diperbarui.');
});

app.post('/dashboard/team/memberships', async (c) => {
  const user = c.get('user')!;
  const body = await c.req.parseBody();
  const editionId = Number(body.edition_id);
  const groupId = Number(body.group_id);
  const participantId = Number(body.participant_id);
  if (user.role !== 'admin' || !csrfValid(c, body.csrf_token) || ![editionId, groupId, participantId].every(Number.isInteger)) return c.text('Pembagian kelompok tidak valid.', 400);
  const group = await c.env.DB.prepare('SELECT id FROM participant_groups WHERE id=? AND edition_id=?').bind(groupId, editionId).first();
  const participant = await c.env.DB.prepare('SELECT id FROM participants WHERE id=?').bind(participantId).first();
  if (!group || !participant) return c.text('Kelompok atau peserta tidak ditemukan.', 404);
  await c.env.DB.prepare(`INSERT INTO participant_group_memberships (group_id,edition_id,participant_id,assigned_by_user_id) VALUES (?,?,?,?) ON CONFLICT(edition_id,participant_id) DO UPDATE SET group_id=excluded.group_id,assigned_by_user_id=excluded.assigned_by_user_id,assigned_at=CURRENT_TIMESTAMP`).bind(groupId, editionId, participantId, user.id).run();
  return redirectMessage(c, 'Pembagian kelompok peserta disimpan.');
});

app.post('/dashboard/pendamping/profile', async (c) => {
  const user = c.get('user')!;
  const body = await c.req.parseBody();
  const fullName = String(body.full_name ?? '').trim();
  const phone = normalizeIndonesianPhone(String(body.phone ?? ''));
  if (user.role !== 'pendamping' || !user.email_verified_at || !csrfValid(c, body.csrf_token) || fullName.length < 2 || fullName.length > 100 || !phone) return c.text('Profil pendamping tidak valid.', 400);
  try {
    await c.env.DB.batch([
      c.env.DB.prepare(`INSERT INTO staff_profiles (user_id,role,full_name,phone_e164,whatsapp_verified_at) VALUES (?,'pendamping',?,?,CURRENT_TIMESTAMP) ON CONFLICT(user_id) DO UPDATE SET full_name=excluded.full_name,phone_e164=excluded.phone_e164,whatsapp_verified_at=CURRENT_TIMESTAMP,updated_at=CURRENT_TIMESTAMP`).bind(user.id, fullName, phone),
      c.env.DB.prepare('UPDATE users SET display_name=?,updated_at=CURRENT_TIMESTAMP WHERE id=?').bind(fullName, user.id),
    ]);
  } catch (error) {
    if (String(error).includes('UNIQUE')) return c.text('Nomor WhatsApp sudah digunakan akun lain.', 409);
    throw error;
  }
  return redirectMessage(c, 'Profil pendamping disimpan.');
});

app.post('/dashboard/pendamping/group', async (c) => {
  const user = c.get('user')!;
  const body = await c.req.parseBody();
  const inviteUrl = String(body.whatsapp_invite_url ?? '').trim();
  if (user.role !== 'pendamping' || !csrfValid(c, body.csrf_token) || (inviteUrl !== '' && !/^https:\/\/chat\.whatsapp\.com\/[A-Za-z0-9_/?=&-]{10,}$/.test(inviteUrl))) return c.text('Tautan grup WhatsApp tidak valid.', 400);
  const result = await c.env.DB.prepare(`UPDATE participant_groups SET whatsapp_invite_url=?,updated_at=CURRENT_TIMESTAMP WHERE pendamping_user_id=? AND edition_id=(SELECT id FROM event_editions WHERE status='published' ORDER BY year DESC LIMIT 1)`).bind(inviteUrl, user.id).run();
  if (!result.meta.changes) return c.text('Kelompok tidak ditemukan.', 404);
  return redirectMessage(c, 'Tautan grup WhatsApp disimpan.');
});

app.get('/dashboard/participants', async (c) => {
  const user = c.get('user')!;
  if (user.role !== 'admin') return c.text('Tidak diizinkan.', 403);
  const participants = (await c.env.DB.prepare(`SELECT p.*,r.status registration_status,sfp.id social_proof_id,sfp.status social_proof_status,ap.id admission_proof_id,(SELECT pg.name FROM participant_group_memberships pgm JOIN participant_groups pg ON pg.id=pgm.group_id JOIN event_editions e ON e.id=pgm.edition_id WHERE pgm.participant_id=p.id AND e.status='published' LIMIT 1) group_name FROM participants p LEFT JOIN registrations r ON r.participant_id=p.id LEFT JOIN social_follow_proofs sfp ON sfp.participant_id=p.id LEFT JOIN admission_proofs ap ON ap.participant_id=p.id ORDER BY p.created_at DESC LIMIT 500`).all<Record<string, unknown>>()).results;
  return c.html(adminParticipantsPage(user, participants, c.req.query('message') ?? ''));
});

app.get('/dashboard/event', async (c) => {
  const user = c.get('user')!;
  if (user.role !== 'admin') return c.text('Tidak diizinkan.', 403);
  const edition = await c.env.DB.prepare("SELECT * FROM event_editions WHERE status='published' ORDER BY year DESC LIMIT 1").first<Edition>();
  const methods = edition ? (await c.env.DB.prepare('SELECT * FROM payment_methods WHERE edition_id=? ORDER BY sort_order,id').bind(edition.id).all<PaymentMethod>()).results : [];
  const benefits = edition ? (await c.env.DB.prepare('SELECT id,title,description FROM event_benefits WHERE edition_id=? ORDER BY sort_order,id').bind(edition.id).all<BenefitItem>()).results : [];
  return c.html(adminEventPage(user, edition, methods, benefits, c.req.query('message') ?? ''));
});

app.get('/dashboard/gallery', async (c) => {
  const user = c.get('user')!;
  if (user.role !== 'admin') return c.text('Tidak diizinkan.', 403);
  const editions = (await c.env.DB.prepare("SELECT * FROM event_editions WHERE status='archived' ORDER BY year DESC").all<Edition>()).results;
  const gallery = (await c.env.DB.prepare('SELECT g.*,e.year FROM galleries g JOIN event_editions e ON e.id=g.edition_id ORDER BY e.year DESC,g.sort_order,g.id').all<Gallery>()).results;
  return c.html(adminGalleryPage(user, editions, gallery, c.req.query('message') ?? ''));
});

app.get('/dashboard/integrations', async (c) => {
  const user = c.get('user')!;
  if (user.role !== 'admin') return c.text('Tidak diizinkan.', 403);
  const settingsRows = (await c.env.DB.prepare("SELECT key,value FROM app_settings WHERE key LIKE 'whatsapp_%' OR key LIKE 'brevo_%'").all<{ key:string; value:string }>()).results;
  if (await c.env.DB.prepare("SELECT key FROM encrypted_app_settings WHERE key='brevo_api_key'").first()) settingsRows.push({ key:'brevo_api_key_configured', value:'1' });
  if (await c.env.DB.prepare("SELECT key FROM encrypted_app_settings WHERE key='whatsar_api_key'").first()) settingsRows.push({ key:'whatsar_api_key_configured', value:'1' });
  return c.html(adminIntegrationsPage(user, Object.fromEntries(settingsRows.map(row => [row.key,row.value])), await loadWhatsarOverview(c.env), c.req.query('message') ?? ''));
});

app.post('/dashboard/email/resend', async (c) => {
  const user = c.get('user')!;
  const body = await c.req.parseBody();
  if (!csrfValid(c, body.csrf_token) || user.email_verified_at) return c.text('Permintaan tidak valid.', 403);
  const recent = await c.env.DB.prepare("SELECT id FROM email_verification_challenges WHERE user_id=? AND datetime(created_at)>datetime('now','-2 minutes')").bind(user.id).first();
  if (!recent) {
    try {
      await issueEmailVerification(c.env, user.id, user.email);
    } catch (error) {
      console.error(error instanceof Error ? `Email verification resend failed: ${error.message}` : 'Email verification resend failed');
      return redirectMessage(c, 'Email belum dapat dikirim. Konfigurasi email sedang diperiksa; akunmu tetap aman.');
    }
  }
  return redirectMessage(c, 'Email verifikasi telah dijadwalkan.');
});

app.post('/dashboard/profile', async (c) => {
  const user = c.get('user')!;
  const body = await c.req.parseBody();
  if (!csrfValid(c, body.csrf_token) || !user.email_verified_at || user.role !== 'participant') return c.text('Permintaan tidak valid.', 403);
  const fullName = String(body.full_name ?? '').trim();
  const phone = normalizeIndonesianPhone(String(body.phone ?? ''));
  const gender = String(body.gender ?? '');
  if (fullName.length < 2 || fullName.length > 100 || !phone || !['male', 'female'].includes(gender)) return c.text('Profil tidak valid.', 400);
  const existing = await c.env.DB.prepare(`SELECT p.id,p.phone,p.gender,p.whatsapp_verified_at,
    EXISTS(SELECT 1 FROM participant_group_memberships WHERE participant_id=p.id) AS has_membership
    FROM participants p WHERE p.user_id=?`).bind(user.id).first<{ id: number; phone: string; gender: string | null; whatsapp_verified_at: string | null; has_membership: number }>();
  if (existing) {
    if (existing.has_membership && existing.gender !== gender) return c.text('Jenis kelamin tidak dapat diubah setelah pembagian kelompok.', 409);
    await c.env.DB.batch([
      c.env.DB.prepare(`UPDATE participants SET full_name=?,phone=?,gender=?,whatsapp_verified_at=CURRENT_TIMESTAMP,documentation_consent_at=CASE WHEN ?='yes' THEN COALESCE(documentation_consent_at,CURRENT_TIMESTAMP) ELSE documentation_consent_at END,updated_at=CURRENT_TIMESTAMP WHERE id=?`).bind(fullName, phone, gender, String(body.documentation_consent ?? ''), existing.id),
      ...(existing.phone !== phone ? [c.env.DB.prepare('DELETE FROM whatsapp_verification_challenges WHERE user_id=? AND consumed_at IS NULL').bind(user.id)] : []),
    ]);
    await autoAssignParticipantGroup(c.env.DB, existing.id);
  } else {
    const inserted = await c.env.DB.prepare(`INSERT INTO participants (user_id, email, full_name, phone, gender, organization, privacy_consent_at, documentation_consent_at, whatsapp_verified_at)
      VALUES (?, ?, ?, ?, ?, 'Informatika', CURRENT_TIMESTAMP, CASE WHEN ?='yes' THEN CURRENT_TIMESTAMP ELSE NULL END, CURRENT_TIMESTAMP)`).bind(user.id, user.email, fullName, phone, gender, String(body.documentation_consent ?? '')).run();
    await autoAssignParticipantGroup(c.env.DB, Number(inserted.meta.last_row_id));
  }
  return redirectMessage(c, 'Profil berhasil disimpan.');
});

app.post('/dashboard/whatsapp/send', (c) => redirectMessage(c, 'OTP WhatsApp sudah tidak diperlukan. Nomor tersimpan langsung dari profil.'));
app.get('/dashboard/whatsapp/cooldown', (c) => c.json({ disabled: true, remainingSeconds: 0 }));
app.post('/dashboard/whatsapp/verify', (c) => redirectMessage(c, 'OTP WhatsApp sudah tidak diperlukan.'));

app.post('/dashboard/social-proofs', async (c) => {
  const user = c.get('user')!;
  let body: Awaited<ReturnType<typeof c.req.parseBody>>;
  try {
    body = await c.req.parseBody();
  } catch (error) {
    console.error(`[social-proofs:parse] user=${user.id}`, error);
    return c.text('Berkas unggahan tidak dapat dibaca. Pilih ulang ketiga screenshot lalu coba lagi.', 400);
  }
  if (!csrfValid(c, body.csrf_token) || user.role !== 'participant') return c.text('Permintaan tidak valid.', 403);
  if (!(await rateLimit(c, 'social-proofs', 5, 3600))) return c.text('Batas upload tercapai. Coba lagi nanti.', 429);
  const profile = await c.env.DB.prepare('SELECT * FROM participants WHERE user_id=? AND gender IS NOT NULL AND phone IS NOT NULL').bind(user.id).first<Profile>();
  if (!profile) return c.text('Lengkapi profil terlebih dahulu.', 409);
  const files = [
    ['collaboration_day_instagram', body.collaboration_day_instagram],
    ['hmps_instagram', body.hmps_instagram],
    ['hmps_tiktok', body.hmps_tiktok],
  ] as const;
  const validatedFiles: Array<readonly [string, File, ProofContentType]> = [];
  for (const [name, file] of files) {
    if (!(file instanceof File) || file.size === 0 || file.size > MAX_PROOF_BYTES) return c.text('Ketiga bukti harus berupa JPG atau PNG valid, masing-masing maksimal 5 MB.', 400);
    const contentType = await detectProofContentType(file);
    if (contentType !== 'image/jpeg' && contentType !== 'image/png') return c.text('Ketiga bukti harus berupa JPG atau PNG valid, masing-masing maksimal 5 MB.', 400);
    validatedFiles.push([name, file, contentType]);
  }
  const existing = await c.env.DB.prepare('SELECT * FROM social_follow_proofs WHERE participant_id=?').bind(profile.id).first<Record<string, string>>();
  const objectKeys: Record<string, string> = {};
  try {
    for (const [name, file, contentType] of validatedFiles) {
      const extension = contentType === 'image/png' ? 'png' : 'jpg';
      const key = `social-proofs/participant-${profile.id}/${name}-${randomToken(24)}.${extension}`;
      const content = await file.arrayBuffer();
      try {
        await c.env.PROOFS.put(key, content, { httpMetadata: { contentType }, customMetadata: { participantId: String(profile.id), proofType: name } });
      } catch (firstError) {
        console.warn(`[social-proofs:r2-retry] participant=${profile.id} proof=${name} size=${file.size}`, firstError);
        try {
          await c.env.PROOFS.put(key, content, { httpMetadata: { contentType }, customMetadata: { participantId: String(profile.id), proofType: name } });
        } catch (error) {
          console.error(`[social-proofs:r2-put] participant=${profile.id} proof=${name} size=${file.size}`, error);
          throw error;
        }
      }
      objectKeys[name] = key;
    }
    try {
      await c.env.DB.prepare(`INSERT INTO social_follow_proofs (participant_id, collaboration_day_instagram_key, hmps_instagram_key, hmps_tiktok_key)
        VALUES (?, ?, ?, ?) ON CONFLICT(participant_id) DO UPDATE SET collaboration_day_instagram_key=excluded.collaboration_day_instagram_key, hmps_instagram_key=excluded.hmps_instagram_key, hmps_tiktok_key=excluded.hmps_tiktok_key, status='pending',reviewed_by_user_id=NULL,reviewed_at=NULL,rejection_reason=NULL,updated_at=CURRENT_TIMESTAMP`).bind(profile.id, objectKeys.collaboration_day_instagram, objectKeys.hmps_instagram, objectKeys.hmps_tiktok).run();
    } catch (error) {
      console.error(`[social-proofs:d1-save] participant=${profile.id}`, error);
      throw error;
    }
  } catch (error) {
    await Promise.allSettled(Object.values(objectKeys).map((key) => c.env.PROOFS.delete(key)));
    throw error;
  }
  if (existing) {
    const oldKeys = ['collaboration_day_instagram_key', 'hmps_instagram_key', 'hmps_tiktok_key'].map((column) => existing[column]).filter(Boolean);
    c.executionCtx.waitUntil(Promise.allSettled(oldKeys.map((key) => c.env.PROOFS.delete(key))).then((results) => {
      results.forEach((result, index) => {
        if (result.status === 'rejected') console.error(`[social-proofs:r2-cleanup] participant=${profile.id} key=${oldKeys[index]}`, result.reason);
      });
    }));
  }
  return redirectMessage(c, 'Ketiga bukti follow berhasil disimpan.');
});

app.get('/dashboard/social-proofs/:id/:kind', async (c) => {
  const user = c.get('user')!;
  const columns: Record<string, string> = {
    'collaboration-day-instagram': 'collaboration_day_instagram_key',
    'hmps-instagram': 'hmps_instagram_key',
    'hmps-tiktok': 'hmps_tiktok_key',
  };
  const column = columns[c.req.param('kind')];
  if (!column) return c.text('Jenis bukti tidak valid.', 404);
  const proof = await c.env.DB.prepare(`SELECT sfp.${column} AS object_key,sfp.participant_id,p.user_id FROM social_follow_proofs sfp JOIN participants p ON p.id=sfp.participant_id WHERE sfp.id=?`).bind(c.req.param('id')).first<{ object_key: string; participant_id: number; user_id: number }>();
  if (user.role === 'pendamping') {
    const staff = await c.env.DB.prepare('SELECT phone_e164 FROM staff_profiles WHERE user_id=?').bind(user.id).first<{ phone_e164: string | null }>();
    if (!staff?.phone_e164) return c.text('Bukti tidak ditemukan.', 404);
  }
  const assigned = proof && user.role === 'pendamping' ? await c.env.DB.prepare(`SELECT 1 FROM participant_group_memberships pgm JOIN participant_groups pg ON pg.id=pgm.group_id WHERE pgm.participant_id=? AND pg.pendamping_user_id=? AND pg.edition_id=(SELECT id FROM event_editions WHERE status='published' ORDER BY year DESC LIMIT 1) LIMIT 1`).bind(proof.participant_id, user.id).first() : null;
  const permitted = proof && (user.role === 'admin' || proof.user_id === user.id || Boolean(assigned));
  if (!permitted) return c.text('Bukti tidak ditemukan.', 404);
  const object = await c.env.PROOFS.get(proof.object_key);
  if (!object) return c.text('Berkas tidak ditemukan.', 404);
  const contentType = object.httpMetadata?.contentType === 'image/png' ? 'image/png' : 'image/jpeg';
  return new Response(object.body, { headers: { 'Content-Type': contentType, 'Cache-Control': 'private, no-store', 'Content-Disposition': `attachment; filename="${c.req.param('kind')}.${contentType === 'image/png' ? 'png' : 'jpg'}"`, 'X-Content-Type-Options': 'nosniff' } });
});

app.post('/dashboard/social-proofs/:id/review', async (c) => {
  const user = c.get('user')!;
  const body = await c.req.parseBody();
  const decision = String(body.decision ?? '');
  const reason = String(body.rejection_reason ?? '').trim().slice(0, 500);
  if (!['admin', 'pendamping'].includes(user.role) || !csrfValid(c, body.csrf_token) || !['verified', 'rejected'].includes(decision) || (decision === 'rejected' && !reason)) return c.text('Review bukti tidak valid.', 400);
  if (user.role === 'pendamping') {
    const staff = await c.env.DB.prepare('SELECT phone_e164 FROM staff_profiles WHERE user_id=?').bind(user.id).first<{ phone_e164: string | null }>();
    if (!staff?.phone_e164) return c.text('Lengkapi nomor WhatsApp terlebih dahulu.', 403);
  }
  const proof = await c.env.DB.prepare(`SELECT sfp.id FROM social_follow_proofs sfp JOIN participants p ON p.id=sfp.participant_id LEFT JOIN participant_group_memberships pgm ON pgm.participant_id=p.id LEFT JOIN participant_groups pg ON pg.id=pgm.group_id WHERE sfp.id=? AND sfp.status='pending' AND (?='admin' OR (pg.pendamping_user_id=? AND pg.edition_id=(SELECT id FROM event_editions WHERE status='published' ORDER BY year DESC LIMIT 1)))`).bind(c.req.param('id'), user.role, user.id).first<{ id: number }>();
  if (!proof) return c.text('Bukti pending tidak ditemukan pada kelompokmu.', 404);
  await c.env.DB.batch([
    c.env.DB.prepare('UPDATE social_follow_proofs SET status=?,rejection_reason=?,reviewed_by_user_id=?,reviewed_at=CURRENT_TIMESTAMP WHERE id=? AND status=\'pending\'').bind(decision, decision === 'rejected' ? reason : null, user.id, proof.id),
    c.env.DB.prepare("INSERT INTO audit_logs (actor_user_id,action,subject_type,subject_id,metadata_json) VALUES (?,'social_proof.reviewed','social_follow_proof',?,?)").bind(user.id, String(proof.id), JSON.stringify({ decision, reason: decision === 'rejected' ? reason : undefined })),
  ]);
  return redirectMessage(c, decision === 'verified' ? 'Bukti follow disetujui.' : 'Bukti follow ditolak.');
});

app.post('/dashboard/admission-proof', async (c) => {
  const user = c.get('user')!;
  const body = await c.req.parseBody();
  if (!csrfValid(c, body.csrf_token) || user.role !== 'participant') return c.text('Permintaan tidak valid.', 403);
  if (!(await rateLimit(c, 'admission-proof', 5, 3600))) return c.text('Batas upload tercapai. Coba lagi nanti.', 429);
  const profile = await c.env.DB.prepare('SELECT * FROM participants WHERE user_id=? AND gender IS NOT NULL AND phone IS NOT NULL').bind(user.id).first<Profile>();
  const socialProof = profile ? await c.env.DB.prepare("SELECT id FROM social_follow_proofs WHERE participant_id=? AND status IN ('pending','verified')").bind(profile.id).first() : null;
  if (!profile || !socialProof) return c.text('Lengkapi bukti follow terlebih dahulu.', 409);
  const file = body.admission_proof;
  if (!(file instanceof File) || file.size === 0 || file.size > MAX_PROOF_BYTES) return c.text('Dokumen harus berupa JPG, PNG, atau PDF valid dengan ukuran maksimal 5 MB.', 400);
  const contentType = await detectProofContentType(file);
  if (!contentType) return c.text('Dokumen harus berupa JPG, PNG, atau PDF valid dengan ukuran maksimal 5 MB.', 400);
  const existing = await c.env.DB.prepare('SELECT object_key FROM admission_proofs WHERE participant_id=?').bind(profile.id).first<{ object_key: string }>();
  const extension = contentType === 'application/pdf' ? 'pdf' : contentType === 'image/png' ? 'png' : 'jpg';
  const objectKey = `admission-proofs/participant-${profile.id}/${randomToken(24)}.${extension}`;
  await c.env.PROOFS.put(objectKey, await file.arrayBuffer(), { httpMetadata: { contentType }, customMetadata: { participantId: String(profile.id), proofType: 'informatics-admission' } });
  try {
    await c.env.DB.prepare(`INSERT INTO admission_proofs (participant_id, object_key, original_filename, content_type, size_bytes) VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(participant_id) DO UPDATE SET object_key=excluded.object_key, original_filename=excluded.original_filename, content_type=excluded.content_type, size_bytes=excluded.size_bytes, updated_at=CURRENT_TIMESTAMP`).bind(profile.id, objectKey, file.name.slice(0, 200), contentType, file.size).run();
  } catch (error) {
    await c.env.PROOFS.delete(objectKey);
    throw error;
  }
  if (existing) await c.env.PROOFS.delete(existing.object_key);
  return redirectMessage(c, 'Bukti kelulusan berhasil disimpan.');
});

app.get('/dashboard/admission-proofs/:id', async (c) => {
  const user = c.get('user')!;
  const proof = await c.env.DB.prepare(`SELECT ap.object_key, ap.original_filename, ap.content_type, p.user_id FROM admission_proofs ap JOIN participants p ON p.id=ap.participant_id WHERE ap.id=?`).bind(c.req.param('id')).first<{ object_key: string; original_filename: string; content_type: string; user_id: number }>();
  if (!proof || (user.role !== 'admin' && proof.user_id !== user.id)) return c.text('Bukti tidak ditemukan.', 404);
  const object = await c.env.PROOFS.get(proof.object_key);
  if (!object) return c.text('Berkas tidak ditemukan.', 404);
  const filename = proof.original_filename.replace(/[^A-Za-z0-9._-]/g, '_');
  return new Response(object.body, { headers: { 'Content-Type': proof.content_type, 'Cache-Control': 'private, no-store', 'Content-Disposition': `attachment; filename="${filename}"`, 'X-Content-Type-Options': 'nosniff' } });
});

app.post('/dashboard/register', async (c) => {
  const user = c.get('user')!;
  const body = await c.req.parseBody();
  if (!csrfValid(c, body.csrf_token) || user.role !== 'participant') return c.text('Permintaan tidak valid.', 403);
  const profile = await c.env.DB.prepare('SELECT * FROM participants WHERE user_id=? AND gender IS NOT NULL AND phone IS NOT NULL').bind(user.id).first<Profile>();
  const edition = await c.env.DB.prepare("SELECT * FROM event_editions WHERE slug=? AND status='published' AND datetime(registration_opens_at)<=datetime('now') AND datetime(registration_closes_at)>=datetime('now')").bind(String(body.edition ?? '')).first<Edition>();
  const socialProof = profile ? await c.env.DB.prepare("SELECT id FROM social_follow_proofs WHERE participant_id=? AND status IN ('pending','verified')").bind(profile.id).first() : null;
  const admissionProof = profile ? await c.env.DB.prepare('SELECT id FROM admission_proofs WHERE participant_id=?').bind(profile.id).first() : null;
  if (!profile || !edition || !socialProof || !admissionProof) return c.text('Lengkapi verifikasi, bukti follow, dan bukti kelulusan sebelum mendaftar.', 409);
  const existing = await c.env.DB.prepare('SELECT id FROM registrations WHERE participant_id=?').bind(profile.id).first();
  if (existing) return redirectMessage(c, 'Akun ini sudah terdaftar.');
  if (!edition.capacity_unlimited) {
    const count = await c.env.DB.prepare("SELECT COUNT(*) AS count FROM registrations WHERE edition_id=? AND status!='cancelled'").bind(edition.id).first<{ count: number }>();
    if ((count?.count ?? 0) >= edition.capacity) return c.text('Kuota peserta telah penuh.', 409);
  }
  const participantRef = randomToken(24);
  const ticketHash = await sha256(`${participantRef}:${c.env.TOKEN_PEPPER}`);
  const publicId = `CD${edition.year}-${randomToken(6).toUpperCase()}`;
  await c.env.DB.prepare('INSERT INTO registrations (public_id, edition_id, participant_id, amount_due, ticket_token_hash, participant_ref) VALUES (?, ?, ?, ?, ?, ?)').bind(publicId, edition.id, profile.id, edition.ticket_amount, ticketHash, participantRef).run();
  return redirectMessage(c, 'Pendaftaran berhasil. Silakan lakukan pembayaran.');
});

app.post('/dashboard/payment-proof', async (c) => {
  const user = c.get('user')!;
  const body = await c.req.parseBody();
  if (!csrfValid(c, body.csrf_token) || user.role !== 'participant') return c.text('Permintaan tidak valid.', 403);
  if (!(await rateLimit(c, 'payment-proof', 8, 3600))) return c.text('Batas upload tercapai. Coba lagi nanti.', 429);
  const registration = await c.env.DB.prepare(`SELECT r.* FROM registrations r JOIN participants p ON p.id=r.participant_id WHERE p.user_id=?`).bind(user.id).first<Record<string, unknown>>();
  if (!registration || !['pending_payment', 'rejected'].includes(String(registration.status))) return c.text('Pembayaran tidak dapat diunggah.', 409);
  const file = body.proof;
  const methodId = Number(body.payment_method_id);
  if (!(file instanceof File) || file.size === 0 || file.size > MAX_PROOF_BYTES) return c.text('Berkas harus JPG, PNG, atau PDF valid dengan ukuran maksimal 5 MB.', 400);
  const contentType = await detectProofContentType(file);
  if (!contentType) return c.text('Berkas harus JPG, PNG, atau PDF valid dengan ukuran maksimal 5 MB.', 400);
  const method = await c.env.DB.prepare("SELECT id FROM payment_methods WHERE id=? AND edition_id=? AND is_active=1 AND type!='cash'").bind(methodId, registration.edition_id).first();
  if (!method) return c.text('Metode pembayaran tidak valid.', 400);
  const extension = contentType === 'application/pdf' ? 'pdf' : contentType === 'image/png' ? 'png' : 'jpg';
  const objectKey = `proofs/edition-${registration.edition_id}/${randomToken(24)}.${extension}`;
  await c.env.PROOFS.put(objectKey, await file.arrayBuffer(), { httpMetadata: { contentType }, customMetadata: { registrationId: String(registration.id) } });
  try {
    await c.env.DB.batch([
      c.env.DB.prepare('INSERT INTO payment_submissions (registration_id, payment_method_id, proof_object_key, original_filename, content_type, size_bytes) VALUES (?, ?, ?, ?, ?, ?)').bind(registration.id, methodId, objectKey, file.name.slice(0, 200), contentType, file.size),
      c.env.DB.prepare("UPDATE registrations SET status='payment_review' WHERE id=?").bind(registration.id),
    ]);
  } catch (error) {
    await c.env.PROOFS.delete(objectKey);
    throw error;
  }
  return redirectMessage(c, 'Bukti diterima dan sedang diverifikasi.');
});

app.post('/dashboard/payment-cash', async (c) => {
  const user = c.get('user')!;
  const body = await c.req.parseBody();
  if (!csrfValid(c, body.csrf_token) || user.role !== 'participant') return c.text('Permintaan tidak valid.', 403);
  if (!(await rateLimit(c, 'payment-cash', 4, 3600))) return c.text('Batas pengajuan pembayaran tercapai. Coba lagi nanti.', 429);
  const registration = await c.env.DB.prepare(`SELECT r.* FROM registrations r JOIN participants p ON p.id=r.participant_id WHERE p.user_id=?`).bind(user.id).first<Record<string, unknown>>();
  if (!registration || !['pending_payment', 'rejected'].includes(String(registration.status))) return c.text('Pembayaran tunai tidak dapat diajukan.', 409);
  const methodId = Number(body.payment_method_id);
  const method = await c.env.DB.prepare("SELECT id FROM payment_methods WHERE id=? AND edition_id=? AND is_active=1 AND type='cash'").bind(methodId, registration.edition_id).first();
  if (!method) return c.text('Metode pembayaran tunai tidak valid.', 400);
  const existing = await c.env.DB.prepare(`SELECT ps.id FROM payment_submissions ps JOIN payment_methods pm ON pm.id=ps.payment_method_id WHERE ps.registration_id=? AND pm.type='cash' AND ps.status='pending'`).bind(registration.id).first();
  if (existing) return redirectMessage(c, 'Pengajuan tunai sudah tercatat. Pendamping dapat melanjutkan pencatatan cicilan pada pengajuan yang sama.');
  try {
    await c.env.DB.batch([
      c.env.DB.prepare('INSERT INTO payment_submissions (registration_id,payment_method_id,status,cash_registration_id) VALUES (?,?,\'pending\',?)').bind(registration.id, methodId, registration.id),
      c.env.DB.prepare("UPDATE registrations SET status='payment_review' WHERE id=?").bind(registration.id),
    ]);
  } catch (error) {
    if (String(error).includes('UNIQUE')) return redirectMessage(c, 'Pengajuan tunai sudah tercatat. Pendamping dapat melanjutkan pencatatan cicilan pada pengajuan yang sama.');
    throw error;
  }
  return redirectMessage(c, 'Pengajuan pembayaran tunai diterima. Serahkan uang kepada pendamping kelompokmu untuk dicatat.');
});

app.post('/dashboard/cash-payments/:id/entries', async (c) => {
  const user = c.get('user')!;
  const body = await c.req.parseBody();
  const paymentId = Number(c.req.param('id'));
  const amount = Number(body.amount_received);
  const timing = String(body.settlement_timing ?? '');
  const notes = String(body.notes ?? '').trim().slice(0, 300);
  if (!['admin', 'pendamping'].includes(user.role) || !csrfValid(c, body.csrf_token) || !Number.isInteger(paymentId) || !Number.isInteger(amount) || amount <= 0 || !['paid', 'technical_meeting', 'event'].includes(timing)) return c.text('Catatan pembayaran tunai tidak valid.', 400);
  if (user.role === 'pendamping') {
    const staff = await c.env.DB.prepare('SELECT phone_e164 FROM staff_profiles WHERE user_id=?').bind(user.id).first<{ phone_e164: string | null }>();
    if (!staff?.phone_e164) return c.text('Lengkapi nomor WhatsApp terlebih dahulu.', 403);
  }
  const payment = await c.env.DB.prepare(`SELECT ps.id,ps.registration_id,r.amount_due,COALESCE((SELECT SUM(amount_received) FROM cash_payment_entries WHERE payment_submission_id=ps.id),0) AS amount_paid FROM payment_submissions ps JOIN payment_methods pm ON pm.id=ps.payment_method_id JOIN registrations r ON r.id=ps.registration_id JOIN participants p ON p.id=r.participant_id LEFT JOIN participant_group_memberships pgm ON pgm.participant_id=p.id AND pgm.edition_id=r.edition_id LEFT JOIN participant_groups pg ON pg.id=pgm.group_id WHERE ps.id=? AND ps.status='pending' AND pm.type='cash' AND (?='admin' OR pg.pendamping_user_id=?)`).bind(paymentId, user.role, user.id).first<{ id: number; registration_id: number; amount_due: number; amount_paid: number }>();
  if (!payment) return c.text('Pengajuan tunai pending tidak ditemukan pada kelompokmu.', 404);
  if (!validCashEntry(amount, payment.amount_due - Number(payment.amount_paid || 0), timing)) return c.text('Nominal tidak sesuai sisa tagihan atau pilihan status penyelesaian.', 409);
  const insertEntry = c.env.DB.prepare(`INSERT INTO cash_payment_entries (payment_submission_id,amount_received,settlement_timing,notes,recorded_by_user_id)
    SELECT ?,?,?,?,? WHERE EXISTS (
      SELECT 1 FROM payment_submissions ps JOIN registrations r ON r.id=ps.registration_id
      WHERE ps.id=? AND ps.status='pending' AND (
        (?='paid' AND ?=r.amount_due-COALESCE((SELECT SUM(amount_received) FROM cash_payment_entries WHERE payment_submission_id=ps.id),0)) OR
        (?!='paid' AND ?<r.amount_due-COALESCE((SELECT SUM(amount_received) FROM cash_payment_entries WHERE payment_submission_id=ps.id),0))
      )
    )`).bind(payment.id, amount, timing, notes || null, user.id, payment.id, timing, amount, timing, amount);
  const settled = timing === 'paid';
  const statements: D1PreparedStatement[] = [insertEntry];
  if (settled) {
    statements.push(
      c.env.DB.prepare("UPDATE payment_submissions SET status='verified',reviewed_at=CURRENT_TIMESTAMP,reviewed_by=?,reviewed_by_user_id=? WHERE id=? AND status='pending' AND changes()>0 AND (SELECT COALESCE(SUM(amount_received),0) FROM cash_payment_entries WHERE payment_submission_id=?)=(SELECT amount_due FROM registrations WHERE id=?)").bind(user.email, user.id, payment.id, payment.id, payment.registration_id),
      c.env.DB.prepare("UPDATE registrations SET status='confirmed',confirmed_at=CURRENT_TIMESTAMP WHERE id=? AND EXISTS(SELECT 1 FROM payment_submissions WHERE id=? AND status='verified' AND reviewed_by_user_id=?)").bind(payment.registration_id, payment.id, user.id),
      c.env.DB.prepare("INSERT INTO audit_logs (actor_user_id,action,subject_type,subject_id,metadata_json) SELECT ?,'cash_payment.settled','payment_submission',?,? WHERE EXISTS(SELECT 1 FROM payment_submissions WHERE id=? AND status='verified' AND reviewed_by_user_id=?)").bind(user.id, String(payment.id), JSON.stringify({ total: payment.amount_due }), payment.id, user.id),
    );
  } else {
    statements.push(c.env.DB.prepare("INSERT INTO audit_logs (actor_user_id,action,subject_type,subject_id,metadata_json) VALUES (?,'cash_payment.entry_added','payment_submission',?,?)").bind(user.id, String(payment.id), JSON.stringify({ amount, timing })));
  }
  const results = await c.env.DB.batch(statements);
  if (!results[0].meta.changes) return c.text('Nominal tidak sesuai sisa tagihan atau pilihan status penyelesaian.', 409);
  if (settled) {
    try {
      await issueElectronicReceipt(c.env, payment.registration_id);
    } catch (error) {
      console.error(error instanceof Error ? error.message : 'Receipt delivery failed');
    }
  }
  return redirectMessage(c, settled ? 'Pembayaran tunai lunas dan registrasi telah dikonfirmasi.' : 'Cicilan tunai dicatat. Sisa tagihan tetap terbuka.');
});

app.get('/dashboard/payment-methods/:id/qris.svg', async (c) => {
  const user = c.get('user')!;
  const staffPreview = ['admin', 'bendahara'].includes(user.role) && c.req.query('preview') === '1';
  const method = staffPreview
    ? await c.env.DB.prepare(`SELECT pm.qris_payload,e.ticket_amount AS amount_due FROM payment_methods pm JOIN event_editions e ON e.id=pm.edition_id WHERE pm.id=? AND pm.type='static_qris' AND (?='admin' OR pm.edition_id=(SELECT id FROM event_editions WHERE status='published' ORDER BY year DESC LIMIT 1))`).bind(c.req.param('id'), user.role).first<{ qris_payload: string | null; amount_due: number }>()
    : await c.env.DB.prepare(`SELECT pm.qris_payload,r.amount_due FROM payment_methods pm JOIN registrations r ON r.edition_id=pm.edition_id JOIN participants p ON p.id=r.participant_id WHERE pm.id=? AND pm.type='static_qris' AND pm.is_active=1 AND p.user_id=? ORDER BY r.id DESC LIMIT 1`).bind(c.req.param('id'), user.id).first<{ qris_payload: string | null; amount_due: number }>();
  if (!method?.qris_payload) return c.text('QRIS tidak tersedia.', 404);
  const payload = qrisWithAmount(method.qris_payload, method.amount_due);
  const svg = await QRCode.toString(payload, { type: 'svg', errorCorrectionLevel: 'M', margin: 3, width: 420, color: { dark: '#060a37', light: '#ffffff' } });
  return c.body(svg, 200, { 'Content-Type': 'image/svg+xml; charset=utf-8', 'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff' });
});

app.get('/dashboard/payments/:id/proof', async (c) => {
  const user = c.get('user')!;
  if (!['admin', 'bendahara'].includes(user.role) || !user.email_verified_at) return c.text('Tidak diizinkan.', 403);
  const payment = await c.env.DB.prepare("SELECT ps.proof_object_key,ps.content_type,ps.original_filename FROM payment_submissions ps JOIN payment_methods pm ON pm.id=ps.payment_method_id WHERE ps.id=? AND pm.type!='cash'").bind(c.req.param('id')).first<{ proof_object_key: string; content_type: string; original_filename: string }>();
  if (!payment?.proof_object_key) return c.text('Pembayaran ini tidak memiliki berkas bukti.', 404);
  const object = await c.env.PROOFS.get(payment.proof_object_key);
  if (!object) return c.text('Berkas tidak ditemukan.', 404);
  const filename = payment.original_filename.replace(/[^A-Za-z0-9._-]/g, '_');
  const disposition = c.req.query('preview') === '1' ? 'inline' : 'attachment';
  return new Response(object.body, { headers: { 'Content-Type': payment.content_type, 'Cache-Control': 'private, no-store', 'Content-Disposition': `${disposition}; filename="${filename}"`, 'X-Content-Type-Options': 'nosniff' } });
});

app.post('/dashboard/payments/:id/review', async (c) => {
  const user = c.get('user')!;
  const body = await c.req.parseBody();
  if (!['admin', 'bendahara'].includes(user.role) || !user.email_verified_at || !csrfValid(c, body.csrf_token)) return c.text('Tidak diizinkan.', 403);
  const decision = String(body.decision ?? '');
  const reason = String(body.rejection_reason ?? '').trim().slice(0, 500);
  if (!['verified', 'rejected'].includes(decision) || (decision === 'rejected' && !reason)) return c.text('Keputusan review tidak valid.', 400);
  const payment = await c.env.DB.prepare("SELECT ps.id,ps.registration_id FROM payment_submissions ps JOIN payment_methods pm ON pm.id=ps.payment_method_id WHERE ps.id=? AND ps.status='pending' AND pm.type!='cash'").bind(c.req.param('id')).first<{ id: number; registration_id: number }>();
  if (!payment) return c.text('Bukti pending tidak ditemukan.', 404);
  const status = decision === 'verified' ? 'confirmed' : 'rejected';
  const results = await c.env.DB.batch([
    c.env.DB.prepare("UPDATE payment_submissions SET status=?, rejection_reason=?, reviewed_at=CURRENT_TIMESTAMP, reviewed_by=?,reviewed_by_user_id=? WHERE id=? AND status='pending'").bind(decision, decision === 'rejected' ? reason : null, user.email, user.id, payment.id),
    c.env.DB.prepare("INSERT INTO audit_logs (actor_user_id,action,subject_type,subject_id,metadata_json) SELECT ?,'payment.reviewed','payment_submission',?,? WHERE changes()>0").bind(user.id, String(payment.id), JSON.stringify({ decision, reason: decision === 'rejected' ? reason : undefined })),
    c.env.DB.prepare("UPDATE registrations SET status=?,confirmed_at=CASE WHEN ?='confirmed' THEN CURRENT_TIMESTAMP ELSE confirmed_at END WHERE id=? AND EXISTS(SELECT 1 FROM payment_submissions WHERE id=? AND status=? AND reviewed_by_user_id=?)").bind(status, status, payment.registration_id, payment.id, decision, user.id),
  ]);
  if (!results[0].meta.changes) return c.text('Bukti sudah direview oleh petugas lain.', 409);
  if (decision === 'verified') {
    try {
      await issueElectronicReceipt(c.env, payment.registration_id);
    } catch (error) {
      console.error(error instanceof Error ? error.message : 'Receipt delivery failed');
    }
  }
  return redirectMessage(c, 'Review pembayaran disimpan.');
});

app.get('/dashboard/receipts/:id', async (c) => {
  const user = c.get('user')!;
  const receipt = await c.env.DB.prepare(`SELECT er.object_key,er.receipt_number,p.user_id,EXISTS(SELECT 1 FROM payment_submissions ps JOIN payment_methods pm ON pm.id=ps.payment_method_id WHERE ps.registration_id=r.id AND ps.status='verified' AND pm.type!='cash') AS has_noncash FROM electronic_receipts er JOIN registrations r ON r.id=er.registration_id JOIN participants p ON p.id=r.participant_id WHERE er.id=?`).bind(c.req.param('id')).first<{ object_key: string; receipt_number: string; user_id: number; has_noncash: number }>();
  const permitted = receipt && (user.role === 'admin' || receipt.user_id === user.id || (user.role === 'bendahara' && user.email_verified_at && receipt.has_noncash));
  if (!permitted) return c.text('Kuitansi tidak ditemukan.', 404);
  const object = await c.env.PROOFS.get(receipt.object_key);
  if (!object) return c.text('Berkas kuitansi tidak ditemukan.', 404);
  return new Response(object.body, { headers: { 'Content-Type': 'application/pdf', 'Cache-Control': 'private, no-store', 'Content-Disposition': `attachment; filename="kuitansi-${receipt.receipt_number}.pdf"`, 'X-Content-Type-Options': 'nosniff' } });
});

app.post('/dashboard/receipts/recover', async (c) => {
  const user = c.get('user')!;
  const body = await c.req.parseBody();
  if (user.role !== 'participant' || !csrfValid(c, body.csrf_token)) return c.text('Tidak diizinkan.', 403);
  const registration = await c.env.DB.prepare(`SELECT r.id FROM registrations r JOIN participants p ON p.id=r.participant_id LEFT JOIN electronic_receipts er ON er.registration_id=r.id WHERE p.user_id=? AND r.status='confirmed' AND er.id IS NULL ORDER BY r.id DESC LIMIT 1`).bind(user.id).first<{ id: number }>();
  if (!registration) return redirectMessage(c, 'Kuitansi sudah tersedia atau pembayaran belum lunas.');
  try {
    await issueElectronicReceipt(c.env, registration.id);
    return redirectMessage(c, 'Kuitansi berhasil dibuat dan pengiriman dijadwalkan.');
  } catch (error) {
    console.error(error instanceof Error ? error.message : 'Receipt recovery failed');
    return redirectMessage(c, 'Kuitansi belum dapat dibuat. Coba lagi beberapa saat lagi.');
  }
});

app.post('/dashboard/receipts/:id/retry', async (c) => {
  const user = c.get('user')!;
  const body = await c.req.parseBody();
  const receiptId = Number(c.req.param('id'));
  if (!['admin', 'bendahara'].includes(user.role) || !user.email_verified_at || !csrfValid(c, body.csrf_token) || !Number.isInteger(receiptId)) return c.text('Tidak diizinkan.', 403);
  if (user.role === 'bendahara') {
    const receipt = await c.env.DB.prepare(`SELECT er.id FROM electronic_receipts er JOIN payment_submissions ps ON ps.registration_id=er.registration_id JOIN payment_methods pm ON pm.id=ps.payment_method_id WHERE er.id=? AND ps.status='verified' AND pm.type!='cash'`).bind(receiptId).first();
    if (!receipt) return c.text('Kuitansi tidak ditemukan.', 404);
  }
  await deliverExistingReceipt(c.env, receiptId);
  return redirectMessage(c, 'Pengiriman kuitansi dicoba kembali.');
});

app.post('/dashboard/edition', async (c) => {
  const user = c.get('user')!;
  const body = await c.req.parseBody();
  if (user.role !== 'admin' || !csrfValid(c, body.csrf_token)) return c.text('Tidak diizinkan.', 403);
  const editionId = Number(body.edition_id);
  const title = String(body.title ?? '').trim();
  const theme = String(body.theme ?? '').trim();
  const description = String(body.description ?? '').trim();
  const venue = String(body.venue ?? '').trim();
  const startsAt = String(body.starts_at ?? '').trim();
  const endsAt = String(body.ends_at ?? '').trim();
  const opensAt = String(body.registration_opens_at ?? '').trim();
  const closesAt = String(body.registration_closes_at ?? '').trim();
  const capacityUnlimited = body.capacity_unlimited === 'yes';
  const capacity = capacityUnlimited ? 1 : Number(body.capacity);
  const amount = Number(body.ticket_amount);
  const mapEmbedUrl = String(body.map_embed_url ?? '').trim();
  if (!Number.isInteger(editionId) || title.length < 2 || theme.length < 2 || description.length < 10 || venue.length < 2 || !startsAt || !endsAt || !opensAt || !closesAt || !Number.isInteger(capacity) || capacity < 1 || !Number.isInteger(amount) || amount < 0 || (mapEmbedUrl && !mapEmbedUrl.startsWith('https://www.google.com/maps/embed?'))) return c.text('Data edition tidak valid.', 400);
  await c.env.DB.batch([
    c.env.DB.prepare(`UPDATE event_editions SET title=?, theme=?, description=?, venue=?, map_embed_url=?, starts_at=?, ends_at=?, registration_opens_at=?, registration_closes_at=?, capacity=?, capacity_unlimited=?, ticket_amount=?, updated_at=CURRENT_TIMESTAMP WHERE id=?`).bind(title.slice(0, 120), theme.slice(0, 180), description.slice(0, 2000), venue.slice(0, 200), mapEmbedUrl.slice(0, 2000) || null, startsAt, endsAt, opensAt, closesAt, capacity, capacityUnlimited ? 1 : 0, amount, editionId),
    c.env.DB.prepare("INSERT INTO audit_logs (actor_user_id, action, subject_type, subject_id) VALUES (?, 'edition.updated', 'event_edition', ?)").bind(user.id, String(editionId)),
  ]);
  return redirectMessage(c, 'Current edition berhasil diperbarui.');
});

app.post('/dashboard/gallery', async (c) => {
  const user = c.get('user')!;
  const body = await c.req.parseBody();
  if (user.role !== 'admin' || !csrfValid(c, body.csrf_token)) return c.text('Tidak diizinkan.', 403);
  if (!(await rateLimit(c, 'admin-gallery-upload', 30, 3600))) return c.text('Batas upload galeri tercapai. Coba lagi nanti.', 429);
  const editionId = Number(body.edition_id);
  const altText = String(body.alt_text ?? '').trim();
  const caption = String(body.caption ?? '').trim();
  const file = body.photo;
  const edition = Number.isInteger(editionId) ? await c.env.DB.prepare("SELECT id,year FROM event_editions WHERE id=? AND status='archived'").bind(editionId).first<{ id: number; year: number }>() : null;
  if (!edition || !(file instanceof File) || !ALLOWED_GALLERY_TYPES.has(file.type) || file.size < 1 || file.size > MAX_GALLERY_BYTES || altText.length < 8 || altText.length > 180 || caption.length > 300 || !(await validGallerySignature(file))) return c.text('Foto galeri tidak valid.', 400);
  let transformed: ImageTransformationResult;
  try {
    transformed = await c.env.IMAGES.input(file.stream()).transform({ width: 1920, height: 1920, fit: 'scale-down' }).output({ format: 'image/webp', quality: 78 });
  } catch (error) {
    console.error(error instanceof Error ? `Gallery image transform failed: ${error.message}` : 'Gallery image transform failed');
    return c.text('Foto tidak dapat diproses. Pastikan file gambar tidak rusak.', 400);
  }
  const output = await transformed.response().arrayBuffer();
  if (!output.byteLength) return c.text('Hasil optimasi foto kosong.', 500);
  const objectKey = `gallery/edition-${edition.id}/${randomToken(24)}.webp`;
  await c.env.PROOFS.put(objectKey, output, { httpMetadata: { contentType: 'image/webp', cacheControl: 'public, max-age=31536000, immutable' }, customMetadata: { editionId: String(edition.id), uploadedBy: String(user.id), originalFilename: file.name.slice(0, 180) } });
  try {
    const order = await c.env.DB.prepare('SELECT COALESCE(MAX(sort_order),0)+1 AS next_order FROM galleries WHERE edition_id=?').bind(edition.id).first<{ next_order: number }>();
    const result = await c.env.DB.prepare(`INSERT INTO galleries (edition_id,image_url,alt_text,caption,photographer,sort_order,is_published,object_key,original_filename,size_bytes,uploaded_by,created_at)
      VALUES (?, '', ?, ?, 'Dokumentasi Collaboration Day', ?, 1, ?, ?, ?, ?, CURRENT_TIMESTAMP)`).bind(edition.id, altText, caption || null, order?.next_order ?? 1, objectKey, file.name.slice(0, 200), output.byteLength, user.id).run();
    const id = Number(result.meta.last_row_id);
    await c.env.DB.batch([
      c.env.DB.prepare('UPDATE galleries SET image_url=? WHERE id=?').bind(`/media/gallery/${id}.webp`, id),
      c.env.DB.prepare("INSERT INTO audit_logs (actor_user_id,action,subject_type,subject_id,metadata_json) VALUES (?,'gallery.uploaded','gallery',?,?)").bind(user.id, String(id), JSON.stringify({ editionYear: edition.year, originalBytes: file.size, outputBytes: output.byteLength })),
    ]);
  } catch (error) {
    await c.env.PROOFS.delete(objectKey);
    throw error;
  }
  return redirectMessage(c, `Foto ${edition.year} berhasil dioptimalkan ke WebP (${Math.max(1, Math.round(output.byteLength / 1024))} KB).`);
});

app.post('/dashboard/gallery/:id/delete', async (c) => {
  const user = c.get('user')!;
  const body = await c.req.parseBody();
  const id = Number(c.req.param('id'));
  if (user.role !== 'admin' || !csrfValid(c, body.csrf_token) || !Number.isInteger(id)) return c.text('Tidak diizinkan.', 403);
  const item = await c.env.DB.prepare('SELECT object_key FROM galleries WHERE id=? AND object_key IS NOT NULL').bind(id).first<{ object_key: string }>();
  if (!item) return c.text('Foto upload tidak ditemukan.', 404);
  await c.env.DB.batch([
    c.env.DB.prepare('DELETE FROM galleries WHERE id=?').bind(id),
    c.env.DB.prepare("INSERT INTO audit_logs (actor_user_id,action,subject_type,subject_id) VALUES (?,'gallery.deleted','gallery',?)").bind(user.id, String(id)),
  ]);
  await c.env.PROOFS.delete(item.object_key);
  return redirectMessage(c, 'Foto galeri dihapus.');
});

app.post('/dashboard/payment-methods', async (c) => {
  const user = c.get('user')!;
  const body = await c.req.parseBody();
  if (!['admin', 'bendahara'].includes(user.role) || !csrfValid(c, body.csrf_token)) return c.text('Tidak diizinkan.', 403);
  const editionId = Number(body.edition_id);
  const type = String(body.type ?? '');
  const bankName = String(body.bank_name ?? '').trim();
  const accountNumber = String(body.account_number ?? '').trim();
  const accountName = String(body.account_name ?? '').trim();
  const qrisPayload = String(body.qris_payload ?? '').trim();
  const instructions = String(body.instructions ?? '').trim().slice(0, 500);
  if (!Number.isInteger(editionId) || !['bank_transfer', 'static_qris', 'cash'].includes(type) || (type === 'bank_transfer' && (!bankName || !accountNumber || !accountName)) || (type === 'static_qris' && !qrisPayload)) return c.text('Metode pembayaran tidak valid.', 400);
  if (user.role === 'bendahara' && !(await c.env.DB.prepare("SELECT id FROM event_editions WHERE id=? AND status='published' AND id=(SELECT id FROM event_editions WHERE status='published' ORDER BY year DESC LIMIT 1)").bind(editionId).first())) return c.text('Bendahara hanya dapat mengelola current edition.', 403);
  if (type === 'static_qris') {
    try { qrisWithAmount(qrisPayload, 1); } catch { return c.text('Payload QRIS tidak valid.', 400); }
  }
  const label = type === 'bank_transfer' ? `Transfer ${bankName}` : type === 'static_qris' ? 'QRIS' : 'Tunai';
  const result = await c.env.DB.prepare(`INSERT INTO payment_methods (edition_id, type, label, account_name, account_number, bank_name, qris_image_url, qris_payload, instructions)
    VALUES (?, ?, ?, ?, ?, ?, NULL, ?, ?)`).bind(editionId, type, label.slice(0, 100), type === 'bank_transfer' ? accountName.slice(0, 120) : null, type === 'bank_transfer' ? accountNumber.slice(0, 100) : null, type === 'bank_transfer' ? bankName.slice(0, 100) : null, type === 'static_qris' ? qrisPayload.slice(0, 1000) : null, instructions || null).run();
  await c.env.DB.prepare("INSERT INTO audit_logs (actor_user_id, action, subject_type, subject_id) VALUES (?, 'payment_method.created', 'payment_method', ?)").bind(user.id, String(result.meta.last_row_id)).run();
  return redirectMessage(c, 'Metode pembayaran ditambahkan.');
});

app.post('/dashboard/payment-methods/:id', async (c) => {
  const user = c.get('user')!;
  const body = await c.req.parseBody();
  const id = Number(c.req.param('id'));
  if (!['admin', 'bendahara'].includes(user.role) || !csrfValid(c, body.csrf_token) || !Number.isInteger(id)) return c.text('Tidak diizinkan.', 403);
  const current = await c.env.DB.prepare(`SELECT id,type FROM payment_methods WHERE id=? AND (?='admin' OR edition_id=(SELECT id FROM event_editions WHERE status='published' ORDER BY year DESC LIMIT 1))`).bind(id, user.role).first<{ id: number; type: string }>();
  if (!current) return c.text('Metode pembayaran tidak ditemukan.', 404);
  const type = String(body.type ?? '');
  const bankName = String(body.bank_name ?? '').trim();
  const accountNumber = String(body.account_number ?? '').trim();
  const accountName = String(body.account_name ?? '').trim();
  const qrisPayload = String(body.qris_payload ?? '').trim();
  const instructions = String(body.instructions ?? '').trim().slice(0, 500);
  if (type !== current.type || (type === 'bank_transfer' && (!bankName || !accountNumber || !accountName)) || (type === 'static_qris' && !qrisPayload)) return c.text('Perubahan metode pembayaran tidak valid.', 400);
  if (type === 'static_qris') {
    try { qrisWithAmount(qrisPayload, 1); } catch { return c.text('Payload QRIS tidak valid.', 400); }
  }
  const label = type === 'bank_transfer' ? `Transfer ${bankName}` : type === 'static_qris' ? 'QRIS' : 'Tunai';
  await c.env.DB.batch([
    c.env.DB.prepare('UPDATE payment_methods SET label=?,bank_name=?,account_number=?,account_name=?,qris_payload=?,instructions=? WHERE id=?').bind(label.slice(0, 100), type === 'bank_transfer' ? bankName.slice(0, 100) : null, type === 'bank_transfer' ? accountNumber.slice(0, 100) : null, type === 'bank_transfer' ? accountName.slice(0, 120) : null, type === 'static_qris' ? qrisPayload.slice(0, 1000) : null, instructions || null, id),
    c.env.DB.prepare("INSERT INTO audit_logs (actor_user_id,action,subject_type,subject_id) VALUES (?,'payment_method.updated','payment_method',?)").bind(user.id, String(id)),
  ]);
  return redirectMessage(c, 'Metode pembayaran berhasil diperbarui.');
});

app.post('/dashboard/payment-methods/:id/status', async (c) => {
  const user = c.get('user')!;
  const body = await c.req.parseBody();
  const id = Number(c.req.param('id'));
  const active = body.active === 'yes' ? 1 : body.active === 'no' ? 0 : -1;
  if (!['admin', 'bendahara'].includes(user.role) || !csrfValid(c, body.csrf_token) || !Number.isInteger(id) || active < 0) return c.text('Tidak diizinkan.', 403);
  const result = await c.env.DB.prepare(`UPDATE payment_methods SET is_active=? WHERE id=? AND (?='admin' OR edition_id=(SELECT id FROM event_editions WHERE status='published' ORDER BY year DESC LIMIT 1))`).bind(active, id, user.role).run();
  if (!result.meta.changes) return c.text('Metode pembayaran tidak ditemukan.', 404);
  await c.env.DB.prepare("INSERT INTO audit_logs (actor_user_id,action,subject_type,subject_id,metadata_json) VALUES (?,'payment_method.status_updated','payment_method',?,?)").bind(user.id, String(id), JSON.stringify({ active: Boolean(active) })).run();
  return redirectMessage(c, active ? 'Metode pembayaran diaktifkan.' : 'Metode pembayaran dinonaktifkan.');
});

app.post('/dashboard/content/:kind', async (c) => {
  const user = c.get('user')!;
  const body = await c.req.parseBody();
  if (user.role !== 'admin' || !csrfValid(c, body.csrf_token)) return c.text('Tidak diizinkan.', 403);
  const editionId = Number(body.edition_id);
  const kind = c.req.param('kind');
  if (!Number.isInteger(editionId)) return c.text('Edition tidak valid.', 400);
  let statement: D1PreparedStatement;
  if (kind === 'benefit') {
    const title = String(body.title ?? '').trim();
    const description = String(body.description ?? '').trim();
    if (title.length < 2) return c.text('Benefit tidak valid.', 400);
    statement = c.env.DB.prepare('INSERT INTO event_benefits (edition_id, title, description) VALUES (?, ?, ?)').bind(editionId, title.slice(0, 160), description.slice(0, 500) || null);
  } else return c.text('Jenis konten tidak valid.', 404);
  const result = await statement.run();
  await c.env.DB.prepare('INSERT INTO audit_logs (actor_user_id, action, subject_type, subject_id) VALUES (?, ?, ?, ?)').bind(user.id, `content.${kind}.created`, kind, String(result.meta.last_row_id)).run();
  return redirectMessage(c, 'Konten berhasil ditambahkan.');
});

app.post('/dashboard/content/:kind/:id/delete', async (c) => {
  const user = c.get('user')!;
  const body = await c.req.parseBody();
  if (user.role !== 'admin' || !csrfValid(c, body.csrf_token)) return c.text('Tidak diizinkan.', 403);
  const id = Number(c.req.param('id'));
  const tables: Record<string, string> = { benefit: 'event_benefits', 'payment-method': 'payment_methods' };
  const table = tables[c.req.param('kind')];
  if (!table || !Number.isInteger(id)) return c.text('Konten tidak valid.', 404);
  if (table === 'payment_methods') await c.env.DB.prepare('UPDATE payment_methods SET is_active=0 WHERE id=?').bind(id).run();
  else await c.env.DB.prepare(`DELETE FROM ${table} WHERE id=?`).bind(id).run();
  await c.env.DB.prepare('INSERT INTO audit_logs (actor_user_id, action, subject_type, subject_id) VALUES (?, ?, ?, ?)').bind(user.id, `content.${c.req.param('kind')}.deleted`, c.req.param('kind'), String(id)).run();
  return redirectMessage(c, table === 'payment_methods' ? 'Metode pembayaran dinonaktifkan.' : 'Konten dihapus.');
});

app.post('/dashboard/settings/brevo', async (c) => {
  const user = c.get('user')!;
  const body = await c.req.parseBody();
  if (user.role !== 'admin' || !csrfValid(c, body.csrf_token)) return c.text('Tidak diizinkan.', 403);
  const senderName = String(body.sender_name ?? '').trim();
  const senderEmail = normalizeEmail(String(body.sender_email ?? ''));
  const verificationSubject = String(body.verification_subject ?? '').trim();
  const resetSubject = String(body.reset_subject ?? '').trim();
  const apiKey = String(body.api_key ?? '').trim();
  if (senderName.length < 2 || !validEmail(senderEmail) || verificationSubject.length < 4 || resetSubject.length < 4 || (apiKey && !apiKey.startsWith('xkeysib-'))) return c.text('Settings Brevo tidak valid.', 400);
  const values: Record<string, string> = {
    brevo_sender_name: senderName.slice(0, 100),
    brevo_sender_email: senderEmail,
    brevo_verification_subject: verificationSubject.slice(0, 160),
    brevo_reset_subject: resetSubject.slice(0, 160),
    brevo_active: body.active === 'yes' ? '1' : '0',
  };
  const statements = Object.entries(values).map(([key, value]) => c.env.DB.prepare(`INSERT INTO app_settings (key, value, updated_by) VALUES (?, ?, ?) ON CONFLICT(key) DO UPDATE SET value=excluded.value, updated_by=excluded.updated_by, updated_at=CURRENT_TIMESTAMP`).bind(key, value, user.id));
  if (apiKey) {
    if (!c.env.CONFIG_ENCRYPTION_KEY) return c.text('CONFIG_ENCRYPTION_KEY belum tersedia.', 503);
    const encrypted = await encryptSetting(c.env.CONFIG_ENCRYPTION_KEY, apiKey);
    statements.push(c.env.DB.prepare(`INSERT INTO encrypted_app_settings (key, ciphertext, iv, updated_by) VALUES ('brevo_api_key', ?, ?, ?) ON CONFLICT(key) DO UPDATE SET ciphertext=excluded.ciphertext, iv=excluded.iv, updated_by=excluded.updated_by, updated_at=CURRENT_TIMESTAMP`).bind(encrypted.ciphertext, encrypted.iv, user.id));
  }
  statements.push(c.env.DB.prepare("INSERT INTO audit_logs (actor_user_id, action, subject_type, subject_id) VALUES (?, 'settings.brevo.updated', 'settings', 'brevo')").bind(user.id));
  await c.env.DB.batch(statements);
  return redirectMessage(c, 'Settings Brevo disimpan.');
});

app.post('/dashboard/settings/brevo/test', async (c) => {
  const user = c.get('user')!;
  const body = await c.req.parseBody();
  const recipient = normalizeEmail(String(body.recipient ?? ''));
  if (user.role !== 'admin' || !csrfValid(c, body.csrf_token) || !validEmail(recipient)) return c.text('Permintaan tidak valid.', 403);
  if (!(await rateLimit(c, 'brevo-test', 5, 3600))) return c.text('Batas email test tercapai.', 429);
  await sendTransactionalEmail(c.env, recipient, 'Tes konfigurasi Collaboration Day', '<h1>Email berhasil terhubung</h1><p>Konfigurasi transactional email Collaboration Day dapat digunakan.</p>');
  return redirectMessage(c, 'Email test berhasil dikirim.');
});

app.post('/dashboard/settings/whatsapp', async (c) => {
  const user = c.get('user')!;
  const body = await c.req.parseBody();
  if (user.role !== 'admin' || !csrfValid(c, body.csrf_token)) return c.text('Tidak diizinkan.', 403);
  const values: Record<string, string> = {
    whatsapp_base_url: String(body.base_url ?? '').trim().replace(/\/$/, ''),
    whatsapp_template: String(body.template ?? '').trim().slice(0, 500),
    whatsapp_active: body.active === 'yes' ? '1' : '0',
  };
  if (values.whatsapp_base_url && !values.whatsapp_base_url.startsWith('https://')) return c.text('Base URL harus menggunakan HTTPS.', 400);
  const apiKey = String(body.api_key ?? '').trim();
  const statements = Object.entries(values).map(([key, value]) => c.env.DB.prepare(`INSERT INTO app_settings (key, value, updated_by) VALUES (?, ?, ?) ON CONFLICT(key) DO UPDATE SET value=excluded.value, updated_by=excluded.updated_by, updated_at=CURRENT_TIMESTAMP`).bind(key, value, user.id));
  if (apiKey) {
    if (!c.env.CONFIG_ENCRYPTION_KEY) return c.text('CONFIG_ENCRYPTION_KEY belum tersedia.', 503);
    const encrypted = await encryptSetting(c.env.CONFIG_ENCRYPTION_KEY, apiKey);
    statements.push(c.env.DB.prepare(`INSERT INTO encrypted_app_settings (key, ciphertext, iv, updated_by) VALUES ('whatsar_api_key', ?, ?, ?) ON CONFLICT(key) DO UPDATE SET ciphertext=excluded.ciphertext, iv=excluded.iv, updated_by=excluded.updated_by, updated_at=CURRENT_TIMESTAMP`).bind(encrypted.ciphertext, encrypted.iv, user.id));
  }
  statements.push(c.env.DB.prepare("INSERT INTO audit_logs (actor_user_id, action, subject_type, subject_id) VALUES (?, 'settings.whatsapp.updated', 'settings', 'whatsapp')").bind(user.id));
  await c.env.DB.batch(statements);
  return redirectMessage(c, 'Settings WhatsApp disimpan.');
});

app.post('/dashboard/whatsar/sessions', async (c) => {
  const user = c.get('user')!;
  const body = await c.req.parseBody();
  if (user.role !== 'admin' || !csrfValid(c, body.csrf_token)) return c.text('Tidak diizinkan.', 403);
  const name = String(body.name ?? '').trim().slice(0, 80);
  const preset = String(body.device_preset ?? 'chrome-linux');
  if (!name || !['chrome-linux', 'safari-mac', 'chrome-windows', 'firefox-linux', 'firefox-windows', 'edge-windows'].includes(preset)) return c.text('Data session tidak valid.', 400);
  const session = await whatsarRequest<WhatsarSession>(c.env, '/api/v1/sessions', { method: 'POST', body: JSON.stringify({ name, device_preset: preset }) });
  await c.env.DB.prepare(`INSERT INTO app_settings (key, value, updated_by) VALUES ('whatsapp_sender_id', ?, ?) ON CONFLICT(key) DO UPDATE SET value=excluded.value, updated_by=excluded.updated_by, updated_at=CURRENT_TIMESTAMP`).bind(session.id, user.id).run();
  return c.redirect(`/dashboard/whatsar/sessions/${encodeURIComponent(session.id)}/pair`, 303);
});

app.post('/dashboard/whatsar/sessions/:id/activate', async (c) => {
  const user = c.get('user')!;
  const body = await c.req.parseBody();
  if (user.role !== 'admin' || !csrfValid(c, body.csrf_token)) return c.text('Tidak diizinkan.', 403);
  const session = await whatsarRequest<WhatsarSession>(c.env, `/api/v1/sessions/${encodeURIComponent(c.req.param('id'))}`);
  await c.env.DB.prepare(`INSERT INTO app_settings (key, value, updated_by) VALUES ('whatsapp_sender_id', ?, ?) ON CONFLICT(key) DO UPDATE SET value=excluded.value, updated_by=excluded.updated_by, updated_at=CURRENT_TIMESTAMP`).bind(session.id, user.id).run();
  return redirectMessage(c, 'Session WhatsApp aktif diperbarui.');
});

app.post('/dashboard/whatsar/sessions/:id/pool', async (c) => {
  const user = c.get('user')!;
  const body = await c.req.parseBody();
  const sessionId = c.req.param('id');
  if (user.role !== 'admin' || !csrfValid(c, body.csrf_token)) return c.text('Tidak diizinkan.', 403);
  if (body.enabled === 'yes') {
    const session = await whatsarRequest<WhatsarSession>(c.env, `/api/v1/sessions/${encodeURIComponent(sessionId)}/status`);
    if (!session.connected && session.status !== 'connected') return redirectMessage(c, 'Hanya session connected yang dapat dimasukkan ke OTP pool.');
    await c.env.DB.prepare('INSERT INTO whatsapp_sender_pool (session_id,added_by) VALUES (?,?) ON CONFLICT(session_id) DO NOTHING').bind(sessionId, user.id).run();
    return redirectMessage(c, 'Session ditambahkan ke round-robin OTP.');
  }
  await c.env.DB.prepare('DELETE FROM whatsapp_sender_pool WHERE session_id=?').bind(sessionId).run();
  return redirectMessage(c, 'Session dikeluarkan dari round-robin OTP.');
});

app.post('/dashboard/whatsar/sessions/:id/delete', async (c) => {
  const user = c.get('user')!;
  const body = await c.req.parseBody();
  const sessionId = c.req.param('id');
  if (user.role !== 'admin' || !csrfValid(c, body.csrf_token)) return c.text('Tidak diizinkan.', 403);
  try {
    await whatsarRequest<{ deleted: string }>(c.env, `/api/v1/sessions/${encodeURIComponent(sessionId)}`, { method: 'DELETE' });
    await c.env.DB.batch([
      c.env.DB.prepare("UPDATE app_settings SET value='', updated_by=?, updated_at=CURRENT_TIMESTAMP WHERE key='whatsapp_sender_id' AND value=?").bind(user.id, sessionId),
      c.env.DB.prepare('DELETE FROM whatsapp_sender_pool WHERE session_id=?').bind(sessionId),
      c.env.DB.prepare("INSERT INTO audit_logs (actor_user_id,action,subject_type,subject_id) VALUES (?,'whatsar.session.deleted','whatsar_session',?)").bind(user.id, sessionId),
    ]);
    return redirectMessage(c, 'Session WhatsApp berhasil dihapus dan device telah logout.');
  } catch (error) {
    console.error(error instanceof Error ? `Whatsar session delete failed: ${error.message}` : 'Whatsar session delete failed');
    return redirectMessage(c, 'Session belum dapat dihapus. Periksa koneksi Whatsar lalu coba lagi.');
  }
});

app.get('/dashboard/whatsar/sessions/:id/pair', async (c) => {
  const user = c.get('user')!;
  if (user.role !== 'admin') return c.text('Tidak diizinkan.', 403);
  const session = await whatsarRequest<WhatsarSession>(c.env, `/api/v1/sessions/${encodeURIComponent(c.req.param('id'))}`);
  return c.html(whatsarPairingPage(user, session, '', '', '', false, session.status === 'pair_code_ready'));
});

app.post('/dashboard/whatsar/sessions/:id/pair/phone', async (c) => {
  const user = c.get('user')!;
  const body = await c.req.parseBody();
  if (user.role !== 'admin' || !csrfValid(c, body.csrf_token)) return c.text('Tidak diizinkan.', 403);
  const normalizedPhone = normalizeIndonesianPhone(String(body.phone ?? ''));
  const phone = normalizedPhone?.slice(1) ?? '';
  if (!/^62\d{8,13}$/.test(phone)) return c.text('Nomor WhatsApp tidak valid. Gunakan 08xxx, +62xxx, atau 62xxx.', 400);
  try {
    const current = await whatsarRequest<WhatsarSession>(c.env, `/api/v1/sessions/${encodeURIComponent(c.req.param('id'))}/status`);
    if (current.connected || current.status === 'connected') return c.html(whatsarPairingPage(user, current, '', '', 'Session ini sudah terhubung.'));
    if (current.status === 'failed' || current.status === 'stopped') return c.html(whatsarPairingPage(user, current, '', '', 'Session berstatus gagal. Sesuai dokumentasi Whatsar, hapus session ini lalu buat session baru.'), 409);
    if (current.status === 'pair_code_ready') return c.html(whatsarPairingPage(user, current, '', '', 'Pairing code sebelumnya masih aktif. Selesaikan di WhatsApp atau buat session baru jika kode sudah tidak dapat digunakan.', false, true), 409);
    if (current.status !== 'created') return c.html(whatsarPairingPage(user, current, '', '', `Session belum siap membuat kode baru (status: ${current.status || 'unknown'}).`), 409);
    const result = await whatsarRequest<{ pairing_code?: string; code?: string; status?: string }>(c.env, `/api/v1/sessions/${encodeURIComponent(c.req.param('id'))}/pair/phone`, { method: 'POST', body: JSON.stringify({ phone }) });
    const session = await whatsarRequest<WhatsarSession>(c.env, `/api/v1/sessions/${encodeURIComponent(c.req.param('id'))}/status`);
    return c.html(whatsarPairingPage(user, session, '', result.pairing_code || result.code || '', 'Masukkan kode pairing di aplikasi WhatsApp sebelum kedaluwarsa.', false, true));
  } catch (error) {
    console.error(error instanceof Error ? `Whatsar phone pairing failed: ${error.message}` : 'Whatsar phone pairing failed');
    const session = await whatsarRequest<WhatsarSession>(c.env, `/api/v1/sessions/${encodeURIComponent(c.req.param('id'))}`);
    return c.html(whatsarPairingPage(user, session, '', '', pairingErrorMessage(error)), 400);
  }
});

app.get('/dashboard/whatsar/sessions/:id/pair/phone/status', async (c) => {
  const user = c.get('user')!;
  if (user.role !== 'admin') return c.json({ error: 'forbidden' }, 403);
  try {
    const session = await whatsarRequest<WhatsarSession>(c.env, `/api/v1/sessions/${encodeURIComponent(c.req.param('id'))}/status`);
    const status = session.connected ? 'connected' : session.status || 'unknown';
    const messages: Record<string, string> = {
      pair_code_ready: 'Kode aktif. Masukkan kode di WhatsApp sebelum kedaluwarsa.',
      connecting: 'Kode diterima. Whatsar sedang menyelesaikan koneksi…',
      connected: 'WhatsApp berhasil terhubung.',
      failed: 'Pairing ditolak atau kedaluwarsa. Hapus session ini lalu buat session baru.',
      stopped: 'Session berhenti. Hapus session ini lalu buat session baru.',
      created: 'Session belum memulai pairing code.',
    };
    return c.json({ status, connected: status === 'connected', terminal: ['connected', 'failed', 'stopped'].includes(status), message: messages[status] || `Status Whatsar: ${status}` });
  } catch (error) {
    return c.json({ status: 'error', connected: false, terminal: false, message: pairingErrorMessage(error) }, 502);
  }
});

app.post('/dashboard/whatsar/sessions/:id/pair/qr', async (c) => {
  const user = c.get('user')!;
  const body = await c.req.parseBody();
  if (user.role !== 'admin' || !csrfValid(c, body.csrf_token)) return c.text('Tidak diizinkan.', 403);
  try {
    const qr = await whatsarRequest<{ image_base64: string }>(c.env, `/api/v1/sessions/${encodeURIComponent(c.req.param('id'))}/pair/qr`);
    const session = await whatsarRequest<WhatsarSession>(c.env, `/api/v1/sessions/${encodeURIComponent(c.req.param('id'))}`);
    return c.html(whatsarPairingPage(user, session, qr.image_base64 ? `data:image/png;base64,${qr.image_base64}` : '', '', qr.image_base64 ? 'QR diperbarui otomatis selama menunggu pairing.' : 'QR sedang disiapkan. Halaman akan memperbaruinya otomatis.', true));
  } catch (error) {
    console.error(error instanceof Error ? `Whatsar QR pairing failed: ${error.message}` : 'Whatsar QR pairing failed');
    const session = await whatsarRequest<WhatsarSession>(c.env, `/api/v1/sessions/${encodeURIComponent(c.req.param('id'))}`);
    return c.html(whatsarPairingPage(user, session, '', '', pairingErrorMessage(error)), 400);
  }
});

app.get('/dashboard/whatsar/sessions/:id/pair/qr/status', async (c) => {
  const user = c.get('user')!;
  if (user.role !== 'admin') return c.json({ error: 'forbidden' }, 403);
  try {
    const session = await whatsarRequest<{ status: string; connected: boolean }>(c.env, `/api/v1/sessions/${encodeURIComponent(c.req.param('id'))}/status`);
    if (session.connected || session.status === 'connected') return c.json({ status: 'connected', image: '' });
    if (session.status === 'failed') return c.json({ status: 'failed', image: '' });
    const qr = await whatsarRequest<{ image_base64: string; status: string }>(c.env, `/api/v1/sessions/${encodeURIComponent(c.req.param('id'))}/pair/qr`);
    return c.json({ status: qr.status, image: qr.image_base64 ? `data:image/png;base64,${qr.image_base64}` : '' });
  } catch (error) {
    if (error instanceof WhatsarRequestError && error.code === 'QR_PAIR_FAILED') return c.json({ status: 'failed', message: pairingErrorMessage(error) }, 409);
    throw error;
  }
});

app.get('/integrations/v1/entitlements/:edition', async (c) => {
  const timestamp = c.req.header('X-CD-Timestamp') ?? '';
  const signature = c.req.header('X-CD-Signature') ?? '';
  if (!c.env.VENDOR_SHARED_SECRET) return c.json({ error: 'integration_not_configured' }, 503);
  if (!/^\d{10}$/.test(timestamp) || Math.abs(Math.floor(Date.now() / 1000) - Number(timestamp)) > 300) return c.json({ error: 'stale_request' }, 401);
  const expected = await hmacHex(c.env.VENDOR_SHARED_SECRET, `${timestamp}\n${c.req.method}\n${new URL(c.req.url).pathname}`);
  if (!safeEqual(signature, expected)) return c.json({ error: 'invalid_signature' }, 401);
  const edition = await c.env.DB.prepare('SELECT id, slug FROM event_editions WHERE slug=?').bind(c.req.param('edition')).first<{ id: number; slug: string }>();
  if (!edition) return c.json({ error: 'edition_not_found' }, 404);
  const rows = (await c.env.DB.prepare("SELECT r.participant_ref, p.full_name AS display_name, r.confirmed_at FROM registrations r JOIN participants p ON p.id=r.participant_id WHERE r.edition_id=? AND r.status='confirmed' ORDER BY r.id").bind(edition.id).all<Record<string, unknown>>()).results;
  return c.json({ version: 1, edition: edition.slug, generated_at: new Date().toISOString(), entitlements: rows.map((row) => ({ participant_ref: row.participant_ref, display_name: row.display_name, active: true, granted_at: row.confirmed_at })) });
});

async function issueEmailVerification(env: Bindings, userId: number, email: string): Promise<void> {
  const token = randomToken(32);
  const tokenHash = await sha256(`${token}:${env.TOKEN_PEPPER}`);
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
  const result = await env.DB.prepare('INSERT INTO email_verification_challenges (user_id, token_hash, expires_at) VALUES (?, ?, ?)').bind(userId, tokenHash, expiresAt).run();
  const url = `${env.APP_ORIGIN}/verify-email?token=${encodeURIComponent(token)}`;
  const subject = await settingValue(env, 'brevo_verification_subject', 'Verifikasi akun Collaboration Day');
  const messageId = await sendTransactionalEmail(env, email, subject, `<h1>Verifikasi alamat email Anda</h1><p>Selamat datang di layanan peserta Collaboration Day 2026. Konfirmasikan alamat email ini untuk mengaktifkan akun dan melanjutkan proses registrasi.</p><p><a href="${escapeHtml(url)}">Verifikasi email</a></p><p><b>Tautan berlaku selama 24 jam.</b> Jika Anda tidak membuat akun Collaboration Day, abaikan email ini.</p>`);
  await env.DB.prepare('UPDATE email_verification_challenges SET sent_at=CURRENT_TIMESTAMP, provider_message_id=? WHERE id=?').bind(messageId, result.meta.last_row_id).run();
}

async function issuePasswordReset(env: Bindings, userId: number, email: string): Promise<void> {
  const token = randomToken(32);
  const tokenHash = await sha256(`${token}:${env.TOKEN_PEPPER}`);
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();
  await env.DB.prepare('INSERT INTO password_reset_challenges (user_id, token_hash, expires_at) VALUES (?, ?, ?)').bind(userId, tokenHash, expiresAt).run();
  const url = `${env.APP_ORIGIN}/reset-password?token=${encodeURIComponent(token)}`;
  const subject = await settingValue(env, 'brevo_reset_subject', 'Reset password Collaboration Day');
  await sendTransactionalEmail(env, email, subject, `<h1>Atur ulang password Anda</h1><p>Kami menerima permintaan untuk mengganti password akun Collaboration Day 2026. Gunakan tombol berikut untuk membuat password baru.</p><p><a href="${escapeHtml(url)}">Buat password baru</a></p><p><b>Tautan berlaku selama satu jam.</b> Jika Anda tidak meminta perubahan ini, password saat ini tetap aman dan tidak perlu melakukan apa pun.</p>`);
}

async function settingValue(env: Bindings, key: string, fallback: string): Promise<string> {
  const row = await env.DB.prepare('SELECT value FROM app_settings WHERE key=?').bind(key).first<{ value: string }>();
  return row?.value || fallback;
}

async function issueElectronicReceipt(env: Bindings, registrationId: number): Promise<void> {
  const existing = await env.DB.prepare('SELECT id FROM electronic_receipts WHERE registration_id=?').bind(registrationId).first();
  if (existing) return;
  const data = await env.DB.prepare(`SELECT r.id, r.public_id, r.amount_due, r.confirmed_at, p.full_name, p.email, p.phone, e.title, e.theme, e.venue, pm.label AS payment_method
    FROM registrations r JOIN participants p ON p.id=r.participant_id JOIN event_editions e ON e.id=r.edition_id
    JOIN payment_submissions ps ON ps.registration_id=r.id AND ps.status='verified'
    JOIN payment_methods pm ON pm.id=ps.payment_method_id WHERE r.id=? ORDER BY ps.reviewed_at DESC LIMIT 1`).bind(registrationId).first<Record<string, unknown>>();
  if (!data) throw new Error('Confirmed registration data not found for receipt');
  const receiptNumber = `CD26-${randomToken(9).toUpperCase()}`;
  const verifiedAt = new Date(String(data.confirmed_at).replace(' ', 'T') + 'Z').toLocaleString('id-ID', { timeZone: 'Asia/Jakarta', dateStyle: 'long', timeStyle: 'short' });
  const pdf = generateReceiptPdf({ receiptNumber, participantName: String(data.full_name), participantCode: String(data.public_id), eventTitle: String(data.title), eventTheme: String(data.theme), venue: String(data.venue), amount: Number(data.amount_due), paymentMethod: String(data.payment_method), verifiedAt });
  const objectKey = `receipts/registration-${registrationId}/${receiptNumber}.pdf`;
  await env.PROOFS.put(objectKey, pdf, { httpMetadata: { contentType: 'application/pdf' }, customMetadata: { registrationId: String(registrationId), receiptNumber } });
  let receiptId: number;
  try {
    const result = await env.DB.prepare('INSERT INTO electronic_receipts (registration_id, receipt_number, object_key, amount_paid, payment_method_label) VALUES (?, ?, ?, ?, ?)').bind(registrationId, receiptNumber, objectKey, Number(data.amount_due), String(data.payment_method)).run();
    receiptId = Number(result.meta.last_row_id);
  } catch (error) {
    await env.PROOFS.delete(objectKey);
    throw error;
  }
  await deliverReceipt(env, receiptId, { email: String(data.email), phone: String(data.phone), participantName: String(data.full_name), receiptNumber }, pdf);
}

async function deliverExistingReceipt(env: Bindings, receiptId: number): Promise<void> {
  const receipt = await env.DB.prepare(`SELECT er.id, er.object_key, er.receipt_number, p.email, p.phone, p.full_name FROM electronic_receipts er JOIN registrations r ON r.id=er.registration_id JOIN participants p ON p.id=r.participant_id WHERE er.id=?`).bind(receiptId).first<Record<string, unknown>>();
  if (!receipt) throw new Error('Receipt not found');
  const object = await env.PROOFS.get(String(receipt.object_key));
  if (!object) throw new Error('Receipt PDF object not found');
  const pdf = new Uint8Array(await object.arrayBuffer());
  await deliverReceipt(env, receiptId, { email: String(receipt.email), phone: String(receipt.phone), participantName: String(receipt.full_name), receiptNumber: String(receipt.receipt_number) }, pdf);
}

async function deliverReceipt(env: Bindings, receiptId: number, recipient: { email: string; phone: string; participantName: string; receiptNumber: string }, pdf: Uint8Array): Promise<void> {
  const attachment = { name: `kuitansi-${recipient.receiptNumber}.pdf`, contentBase64: bytesToBase64(pdf) };
  try {
    await sendTransactionalEmail(env, recipient.email, 'Kuitansi pembayaran Collaboration Day 2026', `<h1>Pembayaran telah terverifikasi</h1><p>Halo ${escapeHtml(recipient.participantName)}, pembayaran Anda telah diperiksa dan dinyatakan valid. Kuitansi elektronik resmi terlampir pada email ini.</p><p>Nomor kuitansi: <b>${escapeHtml(recipient.receiptNumber)}</b></p><p>Simpan dokumen tersebut sebagai bukti pembayaran Collaboration Day 2026.</p>`, attachment);
    await env.DB.prepare("UPDATE electronic_receipts SET email_status='sent', email_sent_at=CURRENT_TIMESTAMP WHERE id=?").bind(receiptId).run();
  } catch (error) {
    await env.DB.prepare("UPDATE electronic_receipts SET email_status='failed', last_delivery_error=? WHERE id=?").bind(String(error).slice(0, 500), receiptId).run();
  }
  try {
    await sendWhatsappDocument(env, recipient.phone, `Kuitansi pembayaran Collaboration Day 2026 — ${recipient.receiptNumber}`, attachment);
    await env.DB.prepare("UPDATE electronic_receipts SET whatsapp_status='sent', whatsapp_sent_at=CURRENT_TIMESTAMP WHERE id=?").bind(receiptId).run();
  } catch (error) {
    await env.DB.prepare("UPDATE electronic_receipts SET whatsapp_status='failed', last_delivery_error=? WHERE id=?").bind(String(error).slice(0, 500), receiptId).run();
  }
}

async function sendWhatsappDocument(env: Bindings, phone: string, caption: string, document: { name: string; contentBase64: string }): Promise<void> {
  const active = await settingValue(env, 'whatsapp_active', '0');
  const config = await getWhatsarConfig(env);
  if (active !== '1' || !config?.activeSessionId) throw new Error('WhatsApp document delivery is not configured');
  const response = await fetch(`${config.baseUrl}/api/v1/messages/send`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-API-Key': config.apiKey },
    body: JSON.stringify({ session_id: config.activeSessionId, to: phone.replace(/^\+/, ''), type: 'document', document_base64: document.contentBase64, filename: document.name, mimetype: 'application/pdf', text: caption, retry: true }),
  });
  if (!response.ok) throw new Error(`WhatsApp document request failed with status ${response.status}`);
}

function redirectMessage(c: Context<{ Bindings: Bindings; Variables: Variables }>, message: string) {
  const referer = c.req.header('Referer');
  let target = '/dashboard';
  if (referer) {
    try {
      const url = new URL(referer);
      if (url.origin === new URL(c.env.APP_ORIGIN).origin && /^\/dashboard(?:\/(?:payments|payment-methods|participants|team|account|event|gallery|integrations))?$/.test(url.pathname)) target = url.pathname;
    } catch {
      target = '/dashboard';
    }
  }
  return c.redirect(`${target}?message=${encodeURIComponent(message)}`, 303);
}

app.notFound((c) => c.html(layout('Tidak ditemukan', '<main class="panel"><h1>Halaman tidak ditemukan.</h1><a class="button" href="/">Ke beranda</a></main>'), 404));
app.onError((error, c) => {
  const reference = randomToken(6).toUpperCase();
  console.error(error instanceof Error ? `[${reference}] ${error.stack || error.message}` : `[${reference}] Unknown error`);
  const browserRequest = c.req.path.startsWith('/dashboard') || (c.req.header('Accept') || '').includes('text/html');
  if (browserRequest) return c.html(temporaryFailurePage(c.req.path.startsWith('/dashboard') ? '/dashboard' : '/'), 500);
  return c.json({ error: 'service_unavailable', message: 'Layanan sedang mengalami gangguan sementara.' }, 500);
});

function pairingErrorMessage(error: unknown): string {
  const message = error instanceof Error ? error.message.toLowerCase() : '';
  if (message.includes('pairing code nomor sudah aktif')) return 'Pairing code sudah aktif untuk session ini. Selesaikan pairing di WhatsApp atau buat session baru untuk menggunakan QR.';
  if (message.includes('session sudah terhubung')) return 'Session WhatsApp ini sudah terhubung dan tidak perlu dipasangkan lagi.';
  if (message.includes('sedang diproses')) return 'Permintaan pairing sebelumnya masih diproses. Tunggu beberapa detik lalu coba lagi.';
  if (message.includes('belum siap') || message.includes('deadline exceeded')) return 'Koneksi WhatsApp belum siap. Tunggu beberapa detik lalu coba lagi atau buat session baru.';
  if (message.includes('pairing code') || message.includes('pairing phone')) return 'Kode pairing belum dapat dibuat. Pastikan nomor memakai format 62xxx dan session belum memiliki pairing aktif.';
  return 'WhatsApp belum dapat dipasangkan. Periksa status Whatsar lalu coba lagi atau buat session baru.';
}

export default app;
