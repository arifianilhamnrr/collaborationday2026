export const MAX_PROOF_BYTES = 5 * 1024 * 1024;
export const ALLOWED_PROOF_TYPES = new Set(['image/jpeg', 'image/png', 'application/pdf']);
export const MAX_GALLERY_BYTES = 12 * 1024 * 1024;
export const ALLOWED_GALLERY_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

export function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

export function validEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) && value.length <= 254;
}

export function normalizeIndonesianPhone(value: string): string | null {
  const digits = value.replace(/\D/g, '');
  const normalized = digits.startsWith('0') ? `62${digits.slice(1)}` : digits.startsWith('62') ? digits : '';
  return /^628\d{8,11}$/.test(normalized) ? `+${normalized}` : null;
}

export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(amount);
}

export type CashSettlementTiming = 'paid' | 'technical_meeting' | 'event';

export function validCashEntry(amount: number, remaining: number, timing: string): timing is CashSettlementTiming {
  if (!Number.isInteger(amount) || amount <= 0 || !Number.isInteger(remaining) || remaining <= 0) return false;
  if (timing === 'paid') return amount === remaining;
  return (timing === 'technical_meeting' || timing === 'event') && amount < remaining;
}

export function whatsappOtpCooldown(requestCount: number, lastSentAt: number | null, now = Math.floor(Date.now() / 1000)): { cooldownSeconds: number; remainingSeconds: number } {
  const cooldownSeconds = requestCount >= 3 ? 180 : 60;
  if (requestCount <= 0 || !lastSentAt) return { cooldownSeconds, remainingSeconds: 0 };
  return { cooldownSeconds, remainingSeconds: Math.max(0, cooldownSeconds - (now - lastSentAt)) };
}

export function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

export function randomToken(bytes = 24): string {
  const data = crypto.getRandomValues(new Uint8Array(bytes));
  return btoa(String.fromCharCode(...data)).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '');
}

export function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let index = 0; index < bytes.length; index += 8192) binary += String.fromCharCode(...bytes.subarray(index, index + 8192));
  return btoa(binary);
}

export async function sha256(value: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

export function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return result === 0;
}

export async function hmacHex(secret: string, message: string): Promise<string> {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(message));
  return [...new Uint8Array(signature)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

export type ProofContentType = 'image/jpeg' | 'image/png' | 'application/pdf';

export async function detectProofContentType(file: File): Promise<ProofContentType | null> {
  const bytes = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return 'image/jpeg';
  if ([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a].every((value, index) => bytes[index] === value)) return 'image/png';
  if (String.fromCharCode(...bytes.slice(0, 5)) === '%PDF-') return 'application/pdf';
  return null;
}

export async function validProofSignature(file: File): Promise<boolean> {
  return (await detectProofContentType(file)) !== null;
}

export async function validGallerySignature(file: File): Promise<boolean> {
  const bytes = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  if (file.type === 'image/jpeg') return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  if (file.type === 'image/png') return [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a].every((value, index) => bytes[index] === value);
  if (file.type === 'image/webp') return String.fromCharCode(...bytes.slice(0, 4)) === 'RIFF' && String.fromCharCode(...bytes.slice(8, 12)) === 'WEBP';
  return false;
}
