// ─────────────────────────────────────────────────────────────
// Supabase Edge Function: wc-proxy
// Proxy para football-data.org — resuelve el problema de CORS
// en web y mantiene el token seguro en el servidor.
//
// Deploy:
//   npx supabase functions deploy wc-proxy --no-verify-jwt
//
// URL desde la app:
//   https://<project>.supabase.co/functions/v1/wc-proxy?path=/competitions/WC/matches
// ─────────────────────────────────────────────────────────────

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

const FD_BASE   = 'https://api.football-data.org/v4';
const FD_TOKEN  = Deno.env.get('FOOTBALL_DATA_TOKEN') ?? '';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
};

serve(async (req: Request) => {
  // Preflight CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: CORS_HEADERS });
  }

  if (req.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  }

  if (!FD_TOKEN) {
    return new Response(JSON.stringify({ error: 'FOOTBALL_DATA_TOKEN not set in Edge Function secrets' }), {
      status: 500,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  }

  // Leer el parámetro ?path= de la URL
  const url    = new URL(req.url);
  const fdPath = url.searchParams.get('path');

  if (!fdPath || !fdPath.startsWith('/')) {
    return new Response(JSON.stringify({ error: 'Missing or invalid ?path= parameter' }), {
      status: 400,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  }

  // Bloquear paths fuera de /competitions/WC y /matches
  const allowed = ['/competitions/WC/', '/competitions/WC', '/matches/'];
  const isAllowed = allowed.some((p) => fdPath.startsWith(p)) || fdPath === '/competitions/WC/matches';
  if (!isAllowed) {
    return new Response(JSON.stringify({ error: 'Path not allowed' }), {
      status: 403,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  }

  // Reenviar query params originales (sin 'path')
  const forwardParams = new URLSearchParams();
  url.searchParams.forEach((v, k) => {
    if (k !== 'path') forwardParams.set(k, v);
  });

  const fdUrl = `${FD_BASE}${fdPath}${forwardParams.toString() ? `?${forwardParams}` : ''}`;

  const fetchUpstream = async (): Promise<Response> => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 25_000);
    try {
      return await fetch(fdUrl, {
        signal: controller.signal,
        headers: {
          'X-Auth-Token': FD_TOKEN,
          'Content-Type': 'application/json',
        },
      });
    } finally {
      clearTimeout(timeout);
    }
  };

  const maxAttempts = 3;
  let lastError: unknown = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const fdRes = await fetchUpstream();
      const body = await fdRes.text();

      if (!fdRes.ok) {
        const retryable = fdRes.status === 429 || fdRes.status >= 500;
        if (retryable && attempt < maxAttempts) {
          console.warn(`[wc-proxy] football-data HTTP ${fdRes.status} (intento ${attempt}/${maxAttempts})`);
          await new Promise((r) => setTimeout(r, attempt * 600));
          continue;
        }
        console.error(`[wc-proxy] football-data HTTP ${fdRes.status}:`, body);
        return new Response(body, {
          status: fdRes.status,
          headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
        });
      }

      return new Response(body, {
        status: 200,
        headers: {
          ...CORS_HEADERS,
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=120',
        },
      });
    } catch (e) {
      lastError = e;
      console.warn(`[wc-proxy] fetch error (intento ${attempt}/${maxAttempts}):`, e);
      if (attempt < maxAttempts) {
        await new Promise((r) => setTimeout(r, attempt * 600));
      }
    }
  }

  console.error('[wc-proxy] upstream agotó reintentos:', lastError);
  return new Response(JSON.stringify({ error: 'Upstream fetch failed' }), {
    status: 502,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  });
});
