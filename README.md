# Collaboration Day Next

Cloudflare-native application for Collaboration Day Informatika. The Worker uses Hono and server-rendered HTML, D1 for relational data, private R2 for payment proofs, Web Crypto for authentication, Brevo transactional email, and a configurable external WhatsApp API.

## Product Boundary

- Annual event editions, current edition landing page, archive, and curated gallery.
- Email/password accounts with mandatory email verification.
- Unified `/dashboard` with server-side RBAC roles `participant`, `pendamping`, `bendahara`, and `admin`.
- Participant onboarding: verified email, profile, verified WhatsApp, event registration, payment, and participant pass.
- Registration prerequisite: follow the official Collaboration Day and HMPS social accounts, upload three private screenshots, and wait for the assigned pendamping to approve them.
- Eligibility prerequisite: upload a private JPEG, PNG, or PDF showing admission to Program Studi Informatika before confirming registration.
- Dynamic-amount QRIS or bank transfer with private proof review by bendahara, plus cash installments recorded by the assigned pendamping.
- Electronic PDF receipt after payment approval, available in the participant dashboard and delivered as a Brevo attachment plus a private Whatsar document message.
- HMAC-authenticated vendor entitlement API.
- No attendance/check-in, payment gateway, or photobooth business logic.

## URL And RBAC Model

There is no `/admin` or `/mahasiswa` namespace. Authenticated users enter through `/dashboard`:

- `participant` sees onboarding, registration, payment, and participant pass.
- `pendamping` reviews social-follow proofs and records cash installments for participants in one assigned group after WhatsApp OTP verification.
- `bendahara` reviews only non-cash payment proofs.
- `admin` promotes staff accounts, manages groups, and retains operational oversight and integration settings.
- Every sensitive endpoint checks the authenticated role server-side. Hiding navigation is not treated as authorization.

Public signup always creates a participant unless its normalized email is listed in the deploy-time `ADMIN_EMAILS` allowlist. Admin promotes an existing verified account to `pendamping` or `bendahara` from **Tim & kelompok**. Remove bootstrap addresses from `ADMIN_EMAILS` after admin accounts are provisioned if desired.

## Local Setup

Requires Node.js 22+ because the locked Wrangler version requires it.

```sh
npm install
cp .dev.vars.example .dev.vars
npm run db:migrate:local
npm run db:seed:local
npm run dev
```

Brevo and WhatsApp sending are skipped on `localhost` when their credentials are absent. Challenges are still created in D1, but a complete browser verification flow requires inspecting local D1 or configuring development providers.

## Cloudflare Setup

```sh
npx wrangler login
npx wrangler d1 create collaboration-day-next
npx wrangler r2 bucket create collaboration-day-payment-proofs
npx wrangler secret put TOKEN_PEPPER
npx wrangler secret put VENDOR_SHARED_SECRET
npx wrangler secret put BREVO_API_KEY
npx wrangler secret put WHATSAPP_API_KEY
npx wrangler secret put TURNSTILE_SECRET_KEY
npm run db:migrate:remote
npx wrangler d1 execute DB --remote --file=seed.sql
npm run deploy
```

Before deployment:

- Replace `database_id` in `wrangler.jsonc` with the D1 ID.
- Set `APP_ORIGIN` to the canonical HTTPS production origin.
- Configure `BREVO_SENDER_EMAIL`, `BREVO_SENDER_NAME`, and `ADMIN_EMAILS` as environment variables.
- Configure `TURNSTILE_SITE_KEY` as an environment variable and `TURNSTILE_SECRET_KEY` as a secret.
- Verify the sender/domain in Brevo.
- Replace all placeholder edition, venue, fee, bank, and QRIS data.
- Configure the WhatsApp API contract from the admin dashboard and store only its API key as a Worker secret.
- Add Cloudflare Turnstile/WAF rate limits before opening public registration.

Use independent random values of at least 32 bytes for `TOKEN_PEPPER` and `VENDOR_SHARED_SECRET`. Never commit real secret values.

## Brevo Email

The Worker calls `POST https://api.brevo.com/v3/smtp/email` directly with `fetch`, so no Node-only Brevo SDK is required. Email verification links last 24 hours. Password reset links last one hour and revoke all existing sessions when used.

The admin dashboard can manage the sender identity, verification/reset subjects, active state, send a test email, and replace the Brevo API key. Provider API keys are encrypted with AES-GCM in D1 using `CONFIG_ENCRYPTION_KEY`; plaintext keys are never rendered back to the browser. Bootstrap `BREVO_API_KEY` may remain as a Worker secret until the first encrypted key is saved from the dashboard.

## WhatsApp Verification

The admin workspace stores only non-secret integration settings:

- HTTPS base URL.
- Send endpoint path.
- Sender/device identifier.
- Message template containing `{{code}}`.
- Active/inactive state.

`WHATSAPP_API_KEY` remains a Cloudflare Worker secret. The current adapter sends a bearer-authenticated JSON request:

```json
{
  "to": "6281234567890",
  "message": "Kode verifikasi Collaboration Day kamu: 123456.",
  "sender_id": "optional-device-id"
}
```

OTP values are stored as peppered HMACs, expire after ten minutes, allow at most five attempts, and have a one-minute resend cooldown. The same challenge mechanism verifies participant and pendamping numbers; group links must use `https://chat.whatsapp.com/...`.

The current adapter follows Whatsar's `/api/v1/messages/send` contract with `X-API-Key`, `session_id`, and `document_base64`. Receipt delivery statuses are tracked independently for email and WhatsApp. Provider failures do not revert an approved payment, and admins can retry delivery without issuing a new receipt number.

## QRIS Amount Rule

The stored merchant payload is validated before saving. At render time the Worker creates a dynamic-amount QRIS payload from the registration fee snapshot, inserts the amount tag, and recalculates CRC16-CCITT without changing the payload stored in D1.

## Vendor Entitlement Contract

`GET /integrations/v1/entitlements/:editionSlug` returns confirmed participants only. Requests include:

- `X-CD-Timestamp`: current Unix seconds, valid within five minutes.
- `X-CD-Signature`: lowercase HMAC-SHA256 hex of `<timestamp>\nGET\n<pathname>` using `VENDOR_SHARED_SECRET`.

The response exposes only opaque `participant_ref`, `display_name`, `active`, and `granted_at`. It does not expose email, WhatsApp, NIM, login credentials, or payment data.

## Storage And Security

- D1 stores accounts, profiles, sessions, challenges, registrations, payments, settings, and audit logs.
- R2 stores payment proofs under the private `proofs/` namespace.
- R2 stores social follow screenshots separately under the private `social-proofs/` namespace.
- R2 stores Informatics admission documents separately under the private `admission-proofs/` namespace.
- Session cookies are HTTP-only, SameSite Lax, and Secure on HTTPS origins.
- State-changing dashboard operations require an origin check and per-session CSRF token.
- Passwords use versioned PBKDF2-HMAC-SHA-256 via Web Crypto.
- Session, verification, reset, and participant references are cryptographically random.
- Uploads require JPEG, PNG, or PDF MIME plus matching file signature and are limited to 5 MB.
- Proofs have no public URL and admin downloads use `private, no-store`, `nosniff`, and attachment disposition.
- Social-proof and payment reviews are attributed to authenticated staff and recorded in `audit_logs`.
- Cash receipts are append-only ledger entries. Partial payments never confirm a registration; settlement requires the recorded total to equal the registration fee.

Additional production work still required includes Turnstile/rate limiting, full event/content/gallery management UI, email delivery monitoring, privacy/retention pages, data export procedures, and final deployment configuration.

## Checks

```sh
npm test
npm run typecheck
npm run build
```
