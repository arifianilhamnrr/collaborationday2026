import { decryptSetting } from './config-crypto';
import type { Bindings } from './types';

type Envelope<T> = { success: boolean; data?: T; error?: { code?: string; message?: string } };

export class WhatsarRequestError extends Error {
  constructor(public readonly status: number, public readonly code: string, message: string) {
    super(message);
    this.name = 'WhatsarRequestError';
  }
}

export type WhatsarSession = {
  id: string;
  name?: string;
  status?: string;
  phone?: string;
  connected?: boolean;
};

export type WhatsarOverview = {
  configured: boolean;
  health: Record<string, unknown> | null;
  sessions: WhatsarSession[];
  senderPool: string[];
  error?: string;
};

export async function getWhatsarConfig(env: Bindings): Promise<{ baseUrl: string; apiKey: string; activeSessionId: string } | null> {
  const rows = (await env.DB.prepare("SELECT key, value FROM app_settings WHERE key IN ('whatsapp_base_url','whatsapp_sender_id','whatsapp_active')").all<{ key: string; value: string }>()).results;
  const settings = Object.fromEntries(rows.map((row) => [row.key, row.value]));
  const encrypted = await env.DB.prepare("SELECT ciphertext, iv FROM encrypted_app_settings WHERE key='whatsar_api_key'").first<{ ciphertext: string; iv: string }>();
  const apiKey = encrypted && env.CONFIG_ENCRYPTION_KEY ? await decryptSetting(env.CONFIG_ENCRYPTION_KEY, encrypted.ciphertext, encrypted.iv) : env.WHATSAPP_API_KEY;
  if (!settings.whatsapp_base_url || !apiKey) return null;
  return { baseUrl: settings.whatsapp_base_url.replace(/\/$/, ''), apiKey, activeSessionId: settings.whatsapp_sender_id || '' };
}

export async function whatsarRequest<T>(env: Bindings, path: string, init: RequestInit = {}): Promise<T> {
  const config = await getWhatsarConfig(env);
  if (!config) throw new Error('Whatsar belum dikonfigurasi');
  const response = await fetch(`${config.baseUrl}${path}`, { ...init, headers: { 'Content-Type': 'application/json', 'X-API-Key': config.apiKey, ...init.headers } });
  let envelope: Envelope<T>;
  try {
    envelope = await response.json<Envelope<T>>();
  } catch {
    throw new WhatsarRequestError(response.status, 'INVALID_RESPONSE', `Whatsar mengembalikan respons tidak valid (${response.status})`);
  }
  if (!response.ok || !envelope.success || envelope.data === undefined) throw new WhatsarRequestError(response.status, envelope.error?.code || 'REQUEST_FAILED', envelope.error?.message || `Whatsar request gagal (${response.status})`);
  return envelope.data;
}

export async function loadWhatsarOverview(env: Bindings): Promise<WhatsarOverview> {
  const config = await getWhatsarConfig(env);
  const baseUrl = config?.baseUrl || 'https://whatsar.projectar.web.id';
  let health: Record<string, unknown> | null = null;
  try {
    const response = await fetch(`${baseUrl}/health`);
    const envelope = await response.json<Envelope<Record<string, unknown>>>();
    health = envelope.data ?? null;
  } catch {
    health = null;
  }
  const senderPool = (await env.DB.prepare('SELECT session_id FROM whatsapp_sender_pool ORDER BY added_at,session_id').all<{ session_id: string }>()).results.map((row) => row.session_id);
  if (!config) return { configured: false, health, sessions: [], senderPool };
  try {
    const data = await whatsarRequest<WhatsarSession[] | { sessions?: WhatsarSession[] }>(env, '/api/v1/sessions');
    return { configured: true, health, sessions: Array.isArray(data) ? data : data.sessions ?? [], senderPool };
  } catch (error) {
    return { configured: true, health, sessions: [], senderPool, error: error instanceof Error ? error.message : 'Gagal memuat session Whatsar' };
  }
}
