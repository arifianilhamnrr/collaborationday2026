export type Role = 'participant' | 'pendamping' | 'bendahara' | 'admin';

export type Bindings = {
  DB: D1Database;
  PROOFS: R2Bucket;
  IMAGES: ImagesBinding;
  ASSETS: Fetcher;
  APP_ORIGIN: string;
  TOKEN_PEPPER: string;
  VENDOR_SHARED_SECRET: string;
  BREVO_API_KEY?: string;
  BREVO_SENDER_EMAIL?: string;
  BREVO_SENDER_NAME?: string;
  ADMIN_EMAILS?: string;
  WHATSAPP_API_KEY?: string;
  TURNSTILE_SECRET_KEY?: string;
  TURNSTILE_SITE_KEY?: string;
  CONFIG_ENCRYPTION_KEY?: string;
};

export type User = {
  id: number;
  email: string;
  display_name: string | null;
  password_hash: string;
  role: Role;
  status: 'active' | 'disabled';
  email_verified_at: string | null;
};

export type Profile = {
  id: number;
  user_id: number;
  email: string;
  full_name: string;
  phone: string;
  gender: 'male' | 'female' | null;
  organization: string | null;
  whatsapp_verified_at: string | null;
  privacy_consent_at: string | null;
  documentation_consent_at: string | null;
  group_name?: string | null;
  group_whatsapp_url?: string | null;
};

export type StaffProfile = {
  user_id: number;
  role: 'pendamping' | 'bendahara';
  full_name: string;
  phone_e164: string | null;
  whatsapp_verified_at: string | null;
};

export type SessionUser = User & { csrf_token: string; session_id: number };

export type Variables = {
  user: SessionUser | null;
};
