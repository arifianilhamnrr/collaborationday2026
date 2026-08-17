import { afterEach, describe, expect, it, vi } from 'vitest';
import { loadWhatsarOverview, WhatsarRequestError, whatsarRequest } from '../src/whatsar';

afterEach(() => vi.unstubAllGlobals());

describe('Whatsar integration', () => {
  it('reports public health without exposing or requiring an API key', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ success: true, data: { status: 'ok', sessions_total: 0, sessions_connected: 0 } }), { headers: { 'Content-Type': 'application/json' } })));
    const env = {
      DB: {
        prepare: () => ({ all: async () => ({ results: [] }), first: async () => null }),
      },
    } as never;

    const overview = await loadWhatsarOverview(env);

    expect(overview.configured).toBe(false);
    expect(overview.health?.status).toBe('ok');
    expect(overview.sessions).toEqual([]);
    expect(overview.senderPool).toEqual([]);
  });

  it('preserves provider error codes and safe messages', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ success: false, error: { code: 'PAIR_CODE_FAILED', message: 'pairing code nomor sudah aktif' } }), { status: 400, headers: { 'Content-Type': 'application/json' } })));
    const env = {
      DB: {
        prepare: (query: string) => ({
          all: async () => ({ results: query.includes('app_settings') ? [{ key: 'whatsapp_base_url', value: 'https://whatsar.example' }] : [] }),
          first: async () => null,
        }),
      },
      WHATSAPP_API_KEY: 'secret',
    } as never;

    await expect(whatsarRequest(env, '/api/v1/sessions/test/pair/phone')).rejects.toMatchObject({ status: 400, code: 'PAIR_CODE_FAILED', message: 'pairing code nomor sudah aktif' } satisfies Partial<WhatsarRequestError>);
  });
});
