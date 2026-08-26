import { describe, expect, it } from 'vitest';
import type { Profile, SessionUser } from '../src/types';
import { accountProfilePage, adminEventPage, adminIntegrationsPage, adminOverviewPage, adminParticipantsPage, adminPaymentsPage, adminTeamPage, authPage, landing, participantDashboard, paymentMethodsPage, pendampingDashboardPage, temporaryFailurePage, whatsarPairingPage, type Edition, type PaymentMethod } from '../src/views';

const user: SessionUser = {
  id: 1,
  email: 'peserta@example.com',
  display_name: 'Ayu Pratama',
  password_hash: 'unused',
  role: 'participant',
  status: 'active',
  email_verified_at: '2026-08-15 10:00:00',
  csrf_token: 'csrf-token',
  session_id: 1,
};

const profile: Profile = {
  id: 1,
  user_id: 1,
  email: user.email,
  full_name: 'Ayu Pratama',
  phone: '+6281234567890',
  gender: 'female',
  organization: 'Informatika A',
  whatsapp_verified_at: '2026-08-15 10:10:00',
  privacy_consent_at: '2026-08-15 10:00:00',
  documentation_consent_at: null,
};

describe('safe error page', () => {
  it('does not expose internal references or retry a POST route as GET', () => {
    const html = temporaryFailurePage('/dashboard');

    expect(html).toContain('Permintaan belum berhasil.');
    expect(html).toContain('href="/dashboard"');
    expect(html).not.toContain('Referensi');
    expect(html).not.toContain('Coba lagi');
  });
});

describe('password reset pages', () => {
  it('distinguishes missing accounts from successfully sent reset email', () => {
    const missing = authPage('forgot', 'Akun dengan email tersebut tidak ditemukan.', '', 'turnstile-key', 'error');
    const sent = authPage('forgot', 'Email reset password telah dikirim.', '', 'turnstile-key', 'success');

    expect(missing).toContain('<div class="notice error">Akun dengan email tersebut tidak ditemukan.</div>');
    expect(sent).toContain('<div class="notice">Email reset password telah dikirim.</div>');
    expect(sent).toContain('class="cf-turnstile"');
  });

  it('does not render a password form for an invalid reset token', () => {
    const html = authPage('reset', 'Tautan reset tidak valid.', '', '', 'error');

    expect(html).toContain('Minta tautan reset baru');
    expect(html).not.toContain('name="password"');
    expect(html).not.toContain('name="token"');
  });

  it('renders Turnstile on the login form shown after reset succeeds', () => {
    const html = authPage('login', 'Password berhasil diperbarui. Silakan masuk.', '', 'turnstile-key', 'success');

    expect(html).toContain('class="cf-turnstile"');
    expect(html).toContain('data-sitekey="turnstile-key"');
    expect(html).toContain('<form class="stack" method="post" action="/login">');
    expect(html).toContain('Password berhasil diperbarui. Silakan masuk.');
  });

  it('pins every auth form to its own endpoint', () => {
    expect(authPage('forgot')).toContain('action="/forgot-password"');
    expect(authPage('reset', '', 'token')).toContain('action="/reset-password"');
    expect(authPage('signup')).toContain('action="/signup"');
  });
});

const methods: PaymentMethod[] = [{
  id: 1,
  type: 'bank_transfer',
  label: 'Transfer Bank',
  account_name: 'Panitia',
  account_number: '1234567890',
  bank_name: 'Bank Contoh',
  qris_image_url: null,
  instructions: 'Transfer sesuai nominal.',
}];

const admin: SessionUser = {
  ...user,
  email: 'admin@example.com',
  role: 'admin',
};

const edition: Edition = {
  id: 1,
  year: 2026,
  slug: 'collaboration-day-2026',
  title: 'Collaboration Day 2026',
  theme: 'CODEVERSE',
  description: 'Kegiatan mahasiswa baru.',
  venue: 'Bumi Perkemahan Munjuluhur',
  starts_at: '2026-09-05',
  ends_at: '2026-09-06',
  registration_opens_at: '2026-08-01',
  registration_closes_at: '2026-09-04',
  capacity: 1,
  capacity_unlimited: 1,
  ticket_amount: 120000,
  hero_image_url: null,
  map_embed_url: null,
};

describe('participant dashboard', () => {
  it('aligns the documentation consent checkbox with its label', () => {
    const html = participantDashboard(user, null, null, null, []);

    expect(html).toContain('name="documentation_consent"');
    expect(html).toContain('name="gender" required');
    expect(html).toContain('value="male"');
    expect(html).toContain('value="female"');
    expect(html).toContain('Nomor dapat ditulis sebagai 08xxxxxxxxxx atau +628xxxxxxxxxx.');
    expect(html).toContain('action="/dashboard/profile"');
    expect(html).toContain('style="display:flex;align-items:flex-start;gap:10px"');
    expect(html).toContain('<span>Saya menyetujui dokumentasi kegiatan sesuai kebijakan publikasi.</span>');
    expect(html).not.toContain('name="organization"');
    expect(html).not.toContain('Program studi / kelas');
  });

  it('asks legacy participants for gender before continuing onboarding', () => {
    const html = participantDashboard(user, { ...profile, gender: null }, edition, null, methods);

    expect(html).toContain('Langkah 2 dari 5');
    expect(html).toContain('value="Ayu Pratama"');
    expect(html).toContain('value="+6281234567890"');
    expect(html).toContain('Pilih jenis kelamin');
    expect(html).not.toContain('action="/dashboard/social-proofs"');
  });

  it('renders profile validation failures as an in-dashboard error notice', () => {
    const html = participantDashboard(user, null, edition, null, methods, false, false, 'Nomor WhatsApp tidak valid.', 'error');

    expect(html).toContain('<div class="notice error">Nomor WhatsApp tidak valid.</div>');
    expect(html).toContain('action="/dashboard/profile"');
    expect(html).toContain('pattern="[+0-9][0-9 +().-]{8,23}"');
  });

  it('shows an automatically assigned group before event registration', () => {
    const html = participantDashboard(user, { ...profile, group_name: 'Horison', group_whatsapp_url: 'https://chat.whatsapp.com/private-group' }, edition, null, methods);

    expect(html).toContain('<b>Kelompok Horison</b>');
    expect(html).toContain('Tautan grup WhatsApp tersedia setelah pembayaran terverifikasi.');
    expect(html).not.toContain('https://chat.whatsapp.com/private-group');
  });

  it('reveals the WhatsApp group only after payment is confirmed', () => {
    const registration = { id: 2, status: 'confirmed', title: 'Collaboration Day', theme: 'Codeverse', public_id: 'CD26-A', participant_ref: 'REF', ticket_reference: 'REF', amount_due: 120000, group_name: 'Orion', group_whatsapp_url: 'https://chat.whatsapp.com/orion-group', receipt_id: 4 };
    const html = participantDashboard(user, profile, edition, registration, methods, 'verified', true);

    expect(html).toContain('<b>Kelompok Orion</b>');
    expect(html).toContain('https://chat.whatsapp.com/orion-group');
    expect(html).toContain('Gabung grup WhatsApp');
  });

  it('requires three private social-follow screenshots before registration', () => {
    const html = participantDashboard(user, profile, {
      id: 1,
      year: 2026,
      slug: 'collaboration-day-2026',
      title: 'Collaboration Day 2026',
      theme: 'CODEVERSE',
      description: 'Kegiatan mahasiswa baru.',
      venue: 'Bumi Perkemahan Munjuluhur',
      starts_at: '2026-09-05',
      ends_at: '2026-09-06',
      registration_opens_at: '2026-08-01',
      registration_closes_at: '2026-09-04',
      capacity: 1,
      capacity_unlimited: 1,
      ticket_amount: 120000,
      hero_image_url: null,
      map_embed_url: null,
    }, null, [], false);

    expect(html).toContain('action="/dashboard/social-proofs"');
    expect(html).toContain('name="collaboration_day_instagram"');
    expect(html).toContain('name="hmps_instagram"');
    expect(html).toContain('name="hmps_tiktok"');
    expect(html).toContain('class="social-requirements"');
    expect(html).toContain('class="social-account"');
    expect(html).toContain('class="social-upload-head"');
    expect(html).toContain('class="stack social-upload"');
    expect(html).not.toContain('action="/dashboard/register"');
  });

  it('requires a private Informatics admission document after social proofs', () => {
    const html = participantDashboard(user, profile, null, null, [], true, false);

    expect(html).toContain('action="/dashboard/admission-proof"');
    expect(html).toContain('name="admission_proof"');
    expect(html).toContain('accept="image/jpeg,image/png,application/pdf"');
    expect(html).not.toContain('action="/dashboard/register"');
  });

  it('presents final registration details in a structured summary', () => {
    const html = participantDashboard(user, profile, edition, null, methods, true, true);

    expect(html).toContain('class="registration-summary"');
    expect(html).toContain('class="registration-facts"');
    expect(html).toContain('class="registration-price"');
    expect(html).toContain('class="registration-action"');
    expect(html).toContain('Lokasi kegiatan');
    expect(html).toContain('Tanpa batas');
  });

  it('renders the private payment-proof upload form while payment is pending', () => {
    const html = participantDashboard(user, profile, null, {
      status: 'pending_payment',
      title: 'Collaboration Day 2026',
      theme: 'CODEVERSE',
      venue: 'Kampus',
      public_id: 'CD2026-TEST',
      amount_due: 100000,
    }, methods, true, true);

    expect(html).toContain('action="/dashboard/payment-proof"');
    expect(html).toContain('enctype="multipart/form-data"');
    expect(html).toContain('accept="image/jpeg,image/png,application/pdf"');
    expect(html).toContain('name="payment_method_id"');
    expect(html).toContain('name="csrf_token" value="csrf-token"');
    expect(html).toContain('data-stable-upload');
    expect(html).toContain('data-stable-file');
    expect(html).toContain('data-upload-status aria-live="polite"');
    expect(html).toContain('id="participant-payment-method"');
    expect(html).toContain('data-payment-option="1" hidden');
    expect(html).toContain('<script src="/participant-payment.js?v=20260826-stable-upload" defer></script>');
  });

  it('separates cash requests from proof-based payment methods', () => {
    const html = participantDashboard(user, profile, null, {
      status: 'pending_payment',
      title: 'Collaboration Day 2026',
      theme: 'CODEVERSE',
      venue: 'Kampus',
      public_id: 'CD2026-TEST',
      amount_due: 120000,
      group_name: 'Orion',
      pendamping_name: 'Kak Triono',
      pendamping_phone: '+6281234567890',
    }, [...methods, {
      id: 2,
      type: 'cash',
      label: 'Pembayaran Tunai',
      account_name: null,
      account_number: null,
      bank_name: null,
      qris_image_url: null,
      instructions: 'Serahkan kepada panitia.',
    }, {
      id: 3,
      type: 'static_qris',
      label: 'QRIS Otomatis',
      account_name: null,
      account_number: null,
      bank_name: null,
      qris_image_url: null,
      qris_payload: 'payload',
      instructions: 'Nominal otomatis.',
    }], true, true);

    expect(html).toContain('action="/dashboard/payment-cash"');
    expect(html).toContain('Ajukan pembayaran tunai');
    expect(html).toContain('<option value="2">Pembayaran Tunai</option>');
    expect(html).toContain('/dashboard/payment-methods/3/qris.svg');
    expect(html).toContain('Nominal sudah terisi sesuai tagihan');
    expect(html).toContain('https://wa.me/6281234567890?text=');
    expect(html).toContain('Hubungi pendamping via WhatsApp');
    expect(html).toContain(`text=${encodeURIComponent('Halo Kak Triono, saya Ayu Pratama (CD2026-TEST) dari Kelompok Orion. Saya ingin melakukan pembayaran tunai Collaboration Day.')}`);
    expect(html.match(/https:\/\/wa\.me\//g)).toHaveLength(1);
  });

  it('hides the upload form while a proof is under review', () => {
    const html = participantDashboard(user, profile, null, {
      status: 'payment_review',
      title: 'Collaboration Day 2026',
      theme: 'CODEVERSE',
      venue: 'Kampus',
      public_id: 'CD2026-TEST',
      amount_due: 100000,
    }, methods, true, true);

    expect(html).not.toContain('action="/dashboard/payment-proof"');
    expect(html).toContain('Sedang diverifikasi');
  });

  it('keeps the pendamping WhatsApp contact visible while cash payment is pending', () => {
    const html = participantDashboard(user, profile, null, {
      status: 'payment_review',
      pending_payment_type: 'cash',
      title: 'Collaboration Day 2026',
      theme: 'CODEVERSE',
      venue: 'Kampus',
      public_id: 'CD2026-TEST',
      amount_due: 120000,
      group_name: 'Orion',
      pendamping_name: 'Kak Triono',
      pendamping_phone: '+6281234567890',
    }, methods, true, true);

    expect(html).toContain('Pembayaran sedang diproses.');
    expect(html).toContain('Hubungi pendamping via WhatsApp');
    expect(html).toContain('https://wa.me/6281234567890?text=');
    expect(html).not.toContain('action="/dashboard/payment-proof"');
  });

  it('continues onboarding while social proofs are pending', () => {
    const html = participantDashboard(user, { ...profile, whatsapp_verified_at: '2026-08-15 10:20:00' }, edition, null, methods, 'pending', false);

    expect(html).toContain('Bukti follow sudah diterima dan sedang diperiksa pendamping');
    expect(html).toContain('action="/dashboard/admission-proof"');
  });

  it('skips WhatsApp OTP and continues onboarding with a saved number', () => {
    const html = participantDashboard(user, { ...profile, whatsapp_verified_at: null }, edition, null, methods);

    expect(html).toContain('Langkah 3 dari 5');
    expect(html).toContain('action="/dashboard/social-proofs"');
    expect(html).not.toContain('action="/dashboard/whatsapp/send"');
    expect(html).not.toContain('action="/dashboard/whatsapp/verify"');
  });
});

describe('admin dashboard pages', () => {
  it.each([
    ['Ringkasan', 'href="/dashboard"', () => adminOverviewPage(admin, {}, [])],
    ['Pembayaran', 'href="/dashboard/payments"', () => adminPaymentsPage(admin, [])],
    ['Peserta', 'href="/dashboard/participants"', () => adminParticipantsPage(admin, [])],
    ['Tim & Kelompok', 'href="/dashboard/team"', () => adminTeamPage(admin, edition, [], [], [])],
    ['Event', 'href="/dashboard/event"', () => adminEventPage(admin, edition, methods, [])],
    ['Integrasi', 'href="/dashboard/integrations"', () => adminIntegrationsPage(admin, {}, { configured: false, health: null, sessions: [], senderPool: [] })],
  ])('renders the %s page in the private application shell', (_title, activeHref, render) => {
    const html = render();

    expect(html).toContain('class="app-shell"');
    expect(html).toContain('Admin workspace');
    expect(html).toContain(`class="active" ${activeHref}`);
    expect(html).toContain('action="/logout"');
    expect(html).toContain('data-sidebar-toggle');
    expect(html).toContain('data-sidebar-overlay');
    expect(html).toContain('href="/dashboard/account"');
    expect(html).toContain('<script src="/dashboard-shell.js" defer></script>');
    expect(html).toContain('<script src="/flash.js" defer></script>');
    expect(html).not.toContain('class="navlinks"');
    expect(html).not.toContain('event_rundown');
    expect(html).not.toContain('event_faqs');
  });

  it('offers a confirmed participant CSV export from the participant page', () => {
    const html = adminParticipantsPage(admin, []);

    expect(html).toContain('href="/dashboard/participants/export.csv"');
    expect(html).toContain('Export peserta confirmed');
  });

  it('adds payment status filters and sorting to participant data', () => {
    const html = adminParticipantsPage(admin, [
      { id: 1, full_name: 'Ayu', email: 'ayu@example.com', phone: '+6281', gender: 'female', group_name: 'Orion', registration_status: 'confirmed', payment_submission_status: 'verified', payment_type: 'static_qris', created_at: '2026-08-26' },
      { id: 2, full_name: 'Budi', email: 'budi@example.com', phone: '+6282', gender: 'male', group_name: 'Phoenix', registration_status: 'pending_payment', payment_submission_status: 'rejected', payment_type: 'bank_transfer', created_at: '2026-08-25' },
    ]);

    expect(html).toContain('data-client-table="participants"');
    expect(html).toContain('data-table-filter data-field="paymentStatus"');
    expect(html).toContain('<option value="confirmed">Terkonfirmasi</option>');
    expect(html).toContain('<option value="rejected">Ditolak</option>');
    expect(html).toContain('data-table-sort');
    expect(html).toContain('<option value="group-asc">Kelompok A–Z</option>');
    expect(html).toContain('data-payment-status="confirmed"');
    expect(html).toContain('data-payment-status="rejected"');
    expect(html).toContain('data-group="Orion"');
    expect(html).toContain('<script src="/client-tables.js?v=20260827-filters" defer></script>');
  });

  it('previews admission and all social proofs in a private modal', () => {
    const html = adminParticipantsPage(admin, [{
      id: 1,
      full_name: 'Ayu',
      email: 'ayu@example.com',
      phone: '+6281',
      group_name: 'Orion',
      admission_proof_id: 12,
      social_proof_id: 34,
    }]);

    expect(html).toContain('id="participant-proof-dialog"');
    expect(html).toContain('id="participant-proof-frame"');
    expect(html).toContain('id="participant-proof-open"');
    expect(html.match(/data-participant-proof/g)).toHaveLength(4);
    expect(html).toContain('data-proof-url="/dashboard/admission-proofs/12?preview=1"');
    expect(html).toContain('data-proof-url="/dashboard/social-proofs/34/collaboration-day-instagram?preview=1"');
    expect(html).toContain('data-proof-url="/dashboard/social-proofs/34/hmps-instagram?preview=1"');
    expect(html).toContain('data-proof-url="/dashboard/social-proofs/34/hmps-tiktok?preview=1"');
    expect(html).toContain('<script src="/participant-proof-preview.js?v=20260827" defer></script>');
  });
});

describe('admin payment methods table', () => {
  it('lists existing transfer, QRIS, and cash methods with status and actions', () => {
    const html = adminEventPage(admin, edition, [{ ...methods[0], is_active: 1 }, {
      id: 2,
      type: 'static_qris',
      label: 'QRIS Otomatis',
      account_name: null,
      account_number: null,
      bank_name: null,
      qris_image_url: null,
      qris_payload: '000201010212',
      instructions: 'Nominal otomatis.',
      is_active: 1,
    }, {
      id: 3,
      type: 'cash',
      label: 'Pembayaran Tunai',
      account_name: null,
      account_number: null,
      bank_name: null,
      qris_image_url: null,
      instructions: 'Bayar ke panitia.',
      is_active: 1,
    }], []);

    expect(html).toContain('<h3>Metode pembayaran tersedia</h3>');
    expect(html).toContain('<th>Jenis</th><th>Nama</th><th>Detail</th><th>Instruksi</th><th>Status</th><th>Aksi</th>');
    expect(html).toContain('QRIS dinamis · payload 12 karakter');
    expect(html).not.toContain('Lihat QR');
    expect(html).not.toContain('/dashboard/payment-methods/2/qris.svg?preview=1');
    expect(html).toContain('Dibayar langsung kepada panitia');
    expect(html).toContain('title="Panitia">Panitia</b>');
    expect(html).not.toContain('a.n. Panitia');
    expect(html).not.toContain('title="Transfer Bank">Transfer Bank</b>');
    expect(html).toContain('class="payment-methods-table"');
    expect(html).toContain('action="/dashboard/payment-methods/3/status"');
    expect(html).toContain('>Nonaktifkan</button>');
    expect(html).toContain('data-edit-payment=');
    expect(html).toContain('data-add-payment');
    expect(html).toContain('<dialog class="app-dialog" id="payment-method-dialog">');
    expect(html).toContain('<select id="payment-method-type-select">');
    expect(html).toContain('<option value="static_qris">QRIS</option>');
    expect(html).toContain('id="payment-qris-preview"');
    expect(html).not.toContain('name="label"');
    expect(html).not.toContain('QRIS nominal otomatis');
    expect(html).toContain('<script src="/payment-methods.js" defer></script>');
  });

  it('offers activation for inactive methods without stacking table cells', () => {
    const html = adminEventPage(admin, edition, [{ ...methods[0], id: 4, is_active: 0 }], []);

    expect(html).toContain('name="active" value="yes"');
    expect(html).toContain('>Aktifkan</button>');
    expect(html).toContain('class="payment-cell"');
    expect(html).not.toContain('<br><span class="mono">1234567890');
  });
});

describe('staff workspaces', () => {
  const pendamping: SessionUser = { ...admin, id: 2, email: 'pendamping@example.com', role: 'pendamping' };
  const bendahara: SessionUser = { ...admin, id: 3, email: 'bendahara@example.com', role: 'bendahara' };

  it('requires a pendamping WhatsApp number without OTP', () => {
    const profileHtml = pendampingDashboardPage(pendamping, null, null, [], []);
    expect(profileHtml).toContain('Pendamping workspace');
    expect(profileHtml).toContain('action="/dashboard/pendamping/profile"');

    const readyHtml = pendampingDashboardPage(pendamping, { user_id: 2, role: 'pendamping', full_name: 'Kak Dita', phone_e164: '+6281234567890', whatsapp_verified_at: null }, null, [], []);
    expect(readyHtml).toContain('Belum ada kelompok.');
    expect(readyHtml).not.toContain('action="/dashboard/whatsapp/send"');
  });

  it('renders proof review and cash installment controls for the assigned group', () => {
    const html = pendampingDashboardPage(
      pendamping,
      { user_id: 2, role: 'pendamping', full_name: 'Kak Dita', phone_e164: '+6281234567890', whatsapp_verified_at: '2026-08-16' },
      { id: 4, name: 'Kelompok Algo', whatsapp_invite_url: null },
      [{ full_name: 'Ayu', phone: '+6281', social_proof_id: 8, social_proof_status: 'pending' }],
      [{ id: 9, full_name: 'Ayu', public_id: 'CD2026-A', amount_due: 120000, amount_paid: 40000, last_timing: 'event' }],
    );

    expect(html).toContain('action="/dashboard/social-proofs/8/review"');
    expect(html).toContain('action="/dashboard/cash-payments/9/entries"');
    expect(html).toContain('Saat technical meeting');
    expect(html).toContain('max="80000"');
  });

  it('uses the bendahara workspace for non-cash review', () => {
    const html = adminPaymentsPage(bendahara, [{ id: 7, status: 'pending', public_id: 'CD-A', amount_due: 120000, full_name: 'Ayu', payment_method: 'QRIS', payment_type: 'static_qris' }]);
    expect(html).toContain('Bendahara workspace');
    expect(html).toContain('class="review-payments-table"');
    expect(html).toContain('data-review-payment=');
    expect(html).toContain('data-view-proof');
    expect(html).toContain('/dashboard/payments/7/proof?preview=1');
    expect(html).toContain('id="payment-proof-dialog"');
    expect(html).toContain('id="payment-proof-frame"');
    expect(html).toContain('>Lihat</button>');
    expect(html).toContain('id="payment-review-dialog"');
    expect(html).toContain('<script src="/payment-review.js" defer></script>');
    expect(html).not.toContain('Konfirmasi tunai diterima');
    const row = html.match(/<tbody>(.*?)<\/tbody>/s)?.[1] || '';
    expect(row).not.toContain('<br>');
    expect(row).not.toContain('class="stack"');
    expect(row).not.toContain('>Unduh<');
  });

  it('lets bendahara manage payment methods without exposing event settings', () => {
    const html = paymentMethodsPage(bendahara, edition, [{ ...methods[0], is_active: 1 }]);
    expect(html).toContain('Bendahara workspace');
    expect(html).toContain('href="/dashboard/payment-methods"');
    expect(html).toContain('data-add-payment');
    expect(html).toContain('data-edit-payment=');
    expect(html).toContain('action="/dashboard/payment-methods/1/status"');
    expect(html).toContain('id="payment-qris-preview"');
    expect(html).not.toContain('action="/dashboard/edition"');
  });

  it('gives admin controls for roles, groups, and memberships', () => {
    const html = adminTeamPage(admin, edition, [{ user_id: 2, email: 'pendamping@example.com', role: 'pendamping', full_name: 'Kak Dita' }], [{ id: 4, name: 'Kelompok Algo', pendamping_name: 'Kak Dita', member_count: 1 }], [{ id: 1, full_name: 'Ayu', email: 'ayu@example.com', group_name: 'Kelompok Algo' }]);
    expect(html).toContain('action="/dashboard/team/roles"');
    expect(html).toContain('action="/dashboard/team/groups"');
    expect(html).toContain('action="/dashboard/team/memberships"');
  });

  it('adds independent search and pagination controls to every team table', () => {
    const html = adminTeamPage(admin, edition, [{ user_id: 2, email: 'pendamping@example.com', role: 'pendamping', full_name: 'Kak Dita' }], [{ id: 4, name: 'Orion', pendamping_name: 'Kak Dita', member_count: 12 }], [{ id: 1, full_name: 'Ayu', email: 'ayu@example.com', group_name: 'Orion' }]);

    expect(html).toContain('data-client-table="staff"');
    expect(html).toContain('data-client-table="groups"');
    expect(html).toContain('data-client-table="participants"');
    expect(html.match(/data-table-search/g)).toHaveLength(3);
    expect(html.match(/data-table-page-size/g)).toHaveLength(3);
    expect(html.match(/data-table-prev/g)).toHaveLength(3);
    expect(html.match(/data-table-next/g)).toHaveLength(3);
    expect(html).toContain('Tidak ada peserta yang cocok.');
    expect(html).toContain('<script src="/client-tables.js?v=20260826" defer></script>');
    expect(html).toContain('Status nomor');
    expect(html).not.toContain('Status OTP');
  });

  it('shows seeded groups before pendamping accounts are available', () => {
    const html = adminTeamPage(admin, edition, [], [{ id: 4, name: 'Horison', pendamping_user_id: null, member_count: 0 }], []);

    expect(html).toContain('<b>Horison</b>');
    expect(html).toContain('Belum ada pendamping');
  });

  it('renders editable profiles and password controls for every staff role', () => {
    const adminHtml = accountProfilePage(admin, null);
    const pendampingHtml = accountProfilePage(pendamping, { user_id: 2, role: 'pendamping', full_name: 'Kak Dita', phone_e164: '+6281234567890', whatsapp_verified_at: null });
    const bendaharaHtml = accountProfilePage(bendahara, { user_id: 3, role: 'bendahara', full_name: 'Bendahara', phone_e164: null, whatsapp_verified_at: null });

    for (const html of [adminHtml, pendampingHtml, bendaharaHtml]) {
      expect(html).toContain('action="/dashboard/account"');
      expect(html).toContain('action="/dashboard/account/password"');
      expect(html).toContain('class="active" href="/dashboard/account"');
    }
    expect(pendampingHtml).toContain('<b>Tersimpan</b>');
    expect(pendampingHtml).not.toContain('action="/dashboard/whatsapp/send"');
    expect(pendampingHtml).not.toContain('action="/dashboard/whatsapp/verify"');
    expect(bendaharaHtml).toContain('Nomor WhatsApp (opsional)');
  });
});

describe('Whatsar session controls', () => {
  it('renders a confirmed delete action for every session', () => {
    const html = adminIntegrationsPage(admin, { whatsapp_sender_id: 'session-1' }, {
      configured: true,
      health: { status: 'ok' },
      sessions: [{ id: 'session-1', name: 'Panitia', status: 'pair_code_ready' }],
      senderPool: [],
    });

    expect(html).toContain('data-delete-session="session-1"');
    expect(html).toContain('<dialog class="app-dialog" id="delete-session-dialog">');
    expect(html).toContain('<script src="/dashboard-integrations.js" defer></script>');
    expect(html).not.toContain('confirm(');
    expect(html).toContain('app-button secondary session-action');
    expect(html).toContain('danger secondary session-action');
  });

  it('offers OTP pool membership only for connected sessions', () => {
    const html = adminIntegrationsPage(admin, {}, {
      configured: true,
      health: { status: 'ok' },
      sessions: [{ id: 'connected-1', status: 'connected', connected: true }, { id: 'waiting-1', status: 'qr_ready' }],
      senderPool: ['connected-1'],
    });

    expect(html).toContain('action="/dashboard/whatsar/sessions/connected-1/pool"');
    expect(html).toContain('name="enabled" value="yes" checked');
    expect(html).not.toContain('action="/dashboard/whatsar/sessions/waiting-1/pool"');
  });
});

describe('Whatsar pairing page', () => {
  it('prevents switching an active phone pairing session to QR', () => {
    const html = whatsarPairingPage(admin, { id: 'session-1', status: 'pair_code_ready' });

    expect(html).toContain('Kode pairing sedang aktif');
    expect(html).toContain('Jika kode ditolak atau kedaluwarsa, hapus session dan buat yang baru');
    expect(html).not.toContain('Tampilkan QR pairing');
  });

  it('polls documented session status while a phone pairing code is active', () => {
    const html = whatsarPairingPage(admin, { id: 'session-1', status: 'pair_code_ready' }, '', 'ABCD-EFGH', 'Kode aktif', false, true);

    expect(html).toContain('id="phone-pairing"');
    expect(html).toContain('/dashboard/whatsar/sessions/session-1/pair/phone/status');
    expect(html).toContain('id="phone-pairing-status"');
    expect(html).toContain('<script src="/whatsar-phone-pairing.js" defer></script>');
  });

  it('stops offering pairing controls for failed sessions', () => {
    const html = whatsarPairingPage(admin, { id: 'session-1', status: 'failed' });

    expect(html).toContain('Session gagal');
    expect(html).toContain('hapus session ini');
    expect(html).not.toContain('action="/dashboard/whatsar/sessions/session-1/pair/phone"');
  });

  it('renders an auto-refreshing QR container', () => {
    const html = whatsarPairingPage(admin, { id: 'session-1', status: 'qr_ready' }, 'data:image/png;base64,test', '', 'QR aktif', true);

    expect(html).toContain('id="qr-pairing"');
    expect(html).toContain('/dashboard/whatsar/sessions/session-1/pair/qr/status');
    expect(html).toContain('<script src="/whatsar-pairing.js" defer></script>');
  });
});

describe('landing page media', () => {
  it('publishes canonical metadata and structured event data', () => {
    const html = landing(edition, [], []);

    expect(html).toContain('<meta name="robots" content="index,follow,max-image-preview:large">');
    expect(html).toContain('<link rel="canonical" href="https://collaborationday2026.web.id/">');
    expect(html).toContain('<meta property="og:site_name" content="Collaboration Day 2026">');
    expect(html).toContain('<meta name="twitter:card" content="summary_large_image">');
    expect(html).toContain('<script type="application/ld+json">');
    expect(html).toContain('"@type":"Event"');
    expect(html).toContain('"startDate":"2026-09-05"');
  });

  it('lazy-loads the archive and renders Algo without layout shift', () => {
    const html = landing(edition, [{ ...edition, year: 2025 }, { ...edition, year: 2023 }], [{
      image_url: '/media/archive/2025/example.webp',
      alt_text: 'Dokumentasi Collaboration Day 2025',
      caption: null,
      photographer: null,
      year: 2025,
    }]);

    expect(html).toContain('src="/media/archive/2025/example.webp"');
    expect(html).toContain('<span>2023—2025</span>');
    expect(html).toContain('<img loading="lazy" decoding="async"');
    expect(html).toContain('src="/media/algo.webp"');
    expect(html).toContain('alt="Algo, maskot Collaboration Day 2026, melambaikan tangan"');
    expect(html).toContain('width="1200" height="1200" loading="lazy" decoding="async"');
  });

  it('rotates gallery photos efficiently and renders described SVG benefits', () => {
    const html = landing(edition, [{ ...edition, year: 2025 }], [{
      image_url: '/media/archive/2025/first.webp',
      alt_text: 'Foto pertama',
      caption: null,
      photographer: null,
      year: 2025,
    }, {
      image_url: '/media/archive/2025/second.webp',
      alt_text: 'Foto kedua',
      caption: null,
      photographer: null,
      year: 2025,
    }], [{ id: 1, title: 'Relasi', description: 'Bangun support system baru.' }]);

    expect(html).toContain('class="hero-slide current" src="/media/archive/2025/first.webp"');
    expect(html).toContain('class="hero-slide next" src="/media/archive/2025/first.webp" srcset="/media/archive-small/2025/first.webp 720w, /media/archive/2025/first.webp 1920w"');
    expect(html).toContain('srcset="/media/archive-small/2025/second.webp 720w, /media/archive/2025/second.webp 1920w"');
    expect(html).toContain(`data-slides="${encodeURIComponent('["/media/archive/2025/first.webp","/media/archive/2025/second.webp"]')}"`);
    expect(html).toContain('<script src="/landing.js?v=20260817-android-reveal" defer></script>');
    expect(html).toContain('<svg viewBox="0 0 48 48" aria-hidden="true">');
    expect(html).toContain('Bangun support system baru.');
    expect(html).toContain('@media(prefers-reduced-motion:reduce)');
    expect(html).toContain('@media(max-width:900px){.motion-ready [data-reveal]');
    expect(html).toContain('content-visibility:visible');
  });

  it('defers Google Maps until the location section approaches the viewport', () => {
    const html = landing({
      ...edition,
      venue: 'Lokasi Collaboration Day',
      map_embed_url: 'https://www.google.com/maps/embed?pb=test',
    }, [], []);

    expect(html).toContain('data-map-src="https://www.google.com/maps/embed?pb=test"');
    expect(html).toContain('data-map-status');
    expect(html).toContain('Google Maps akan dimuat otomatis saat bagian ini mendekati layar.');
    expect(html).toContain('https://www.google.com/maps/search/?api=1&amp;query=Lokasi%20Collaboration%20Day');
    expect(html).not.toContain('<iframe');
    expect(html).not.toContain('data-load-map');
  });
});
