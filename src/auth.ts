import { deleteCookie, getCookie, setCookie } from 'hono/cookie';
import type { Context } from 'hono';
import { randomToken, safeEqual, sha256 } from './domain';
import type { Bindings, SessionUser, Variables } from './types';

const encoder = new TextEncoder();
const SESSION_COOKIE = 'cd_session';
const PASSWORD_ITERATIONS = 100_000;
const SESSION_SECONDS = 60 * 60 * 24 * 14;

function bytesToBase64(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes));
}

function base64ToBytes(value: string): Uint8Array<ArrayBuffer> {
  return Uint8Array.from(atob(value), (character) => character.charCodeAt(0));
}

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations: PASSWORD_ITERATIONS }, key, 256);
  return `pbkdf2-sha256$${PASSWORD_ITERATIONS}$${bytesToBase64(salt)}$${bytesToBase64(new Uint8Array(bits))}`;
}

export async function verifyPassword(password: string, encoded: string): Promise<boolean> {
  const [algorithm, iterationsValue, saltValue, expectedValue] = encoded.split('$');
  const iterations = Number(iterationsValue);
  if (algorithm !== 'pbkdf2-sha256' || !Number.isInteger(iterations) || iterations < 100_000 || iterations > 1_000_000 || !saltValue || !expectedValue) return false;
  try {
    const salt = base64ToBytes(saltValue);
    const expected = base64ToBytes(expectedValue);
    const key = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits']);
    const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations }, key, expected.byteLength * 8);
    return safeEqual(bytesToBase64(new Uint8Array(bits)), expectedValue);
  } catch {
    return false;
  }
}

export function validPassword(password: string): boolean {
  return password.length >= 10 && password.length <= 128;
}

export async function createSession(c: Context<{ Bindings: Bindings; Variables: Variables }>, userId: number): Promise<void> {
  const rawToken = randomToken(32);
  const tokenHash = await sha256(`${rawToken}:${c.env.TOKEN_PEPPER}`);
  const csrfToken = randomToken(24);
  const expiresAt = new Date(Date.now() + SESSION_SECONDS * 1000).toISOString();
  await c.env.DB.prepare('INSERT INTO sessions (user_id, token_hash, csrf_token, expires_at) VALUES (?, ?, ?, ?)').bind(userId, tokenHash, csrfToken, expiresAt).run();
  setCookie(c, SESSION_COOKIE, rawToken, {
    httpOnly: true,
    secure: new URL(c.env.APP_ORIGIN).protocol === 'https:',
    sameSite: 'Lax',
    path: '/',
    maxAge: SESSION_SECONDS,
  });
}

export async function loadSession(c: Context<{ Bindings: Bindings; Variables: Variables }>): Promise<SessionUser | null> {
  const rawToken = getCookie(c, SESSION_COOKIE);
  if (!rawToken) return null;
  const tokenHash = await sha256(`${rawToken}:${c.env.TOKEN_PEPPER}`);
  return c.env.DB.prepare(`SELECT u.id,u.email,u.display_name,u.password_hash,COALESCE(sp.role,u.role) AS role,u.status,u.email_verified_at,u.created_at,u.updated_at,s.csrf_token,s.id AS session_id
    FROM sessions s JOIN users u ON u.id=s.user_id LEFT JOIN staff_profiles sp ON sp.user_id=u.id
    WHERE s.token_hash=? AND s.revoked_at IS NULL AND datetime(s.expires_at) > datetime('now') AND u.status='active'`).bind(tokenHash).first<SessionUser>();
}

export async function destroySession(c: Context<{ Bindings: Bindings; Variables: Variables }>): Promise<void> {
  const user = c.get('user');
  if (user) await c.env.DB.prepare('UPDATE sessions SET revoked_at=CURRENT_TIMESTAMP WHERE id=?').bind(user.session_id).run();
  deleteCookie(c, SESSION_COOKIE, { path: '/' });
}

export function originAllowed(c: Context<{ Bindings: Bindings; Variables: Variables }>): boolean {
  const origin = c.req.header('Origin');
  return !origin || origin === new URL(c.env.APP_ORIGIN).origin;
}

export function csrfValid(c: Context<{ Bindings: Bindings; Variables: Variables }>, value: unknown): boolean {
  const user = c.get('user');
  return Boolean(user && typeof value === 'string' && safeEqual(value, user.csrf_token));
}
