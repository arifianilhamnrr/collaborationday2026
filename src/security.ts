import type { Context } from 'hono';
import { sha256 } from './domain';
import type { Bindings, Variables } from './types';

type AppContext = Context<{ Bindings: Bindings; Variables: Variables }>;

export async function verifyTurnstile(c: AppContext, token: unknown): Promise<boolean> {
  if (!c.env.TURNSTILE_SECRET_KEY) return new URL(c.env.APP_ORIGIN).hostname === 'localhost';
  if (typeof token !== 'string' || !token) return false;
  const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      secret: c.env.TURNSTILE_SECRET_KEY,
      response: token,
      remoteip: c.req.header('CF-Connecting-IP') ?? '',
    }),
  });
  if (!response.ok) return false;
  const result = await response.json<{ success?: boolean }>();
  return result.success === true;
}

export async function rateLimit(c: AppContext, scope: string, limit: number, windowSeconds: number): Promise<boolean> {
  const user = c.get('user');
  const identity = user ? `user:${user.id}` : `ip:${c.req.header('CF-Connecting-IP') ?? 'local'}`;
  const fingerprint = await sha256(`${scope}:${identity}:${c.env.TOKEN_PEPPER}`);
  const existing = await c.env.DB.prepare('SELECT request_count, window_started_at FROM request_rate_limits WHERE scope=? AND fingerprint_hash=?').bind(scope, fingerprint).first<{ request_count: number; window_started_at: string }>();
  const now = Date.now();
  const windowStarted = existing ? new Date(`${existing.window_started_at.replace(' ', 'T')}Z`).getTime() : 0;
  if (!existing || !Number.isFinite(windowStarted) || now - windowStarted >= windowSeconds * 1000) {
    await c.env.DB.prepare(`INSERT INTO request_rate_limits (scope, fingerprint_hash, window_started_at, request_count) VALUES (?, ?, CURRENT_TIMESTAMP, 1)
      ON CONFLICT(scope, fingerprint_hash) DO UPDATE SET window_started_at=CURRENT_TIMESTAMP, request_count=1`).bind(scope, fingerprint).run();
    return true;
  }
  if (existing.request_count >= limit) return false;
  await c.env.DB.prepare('UPDATE request_rate_limits SET request_count=request_count+1 WHERE scope=? AND fingerprint_hash=?').bind(scope, fingerprint).run();
  return true;
}
