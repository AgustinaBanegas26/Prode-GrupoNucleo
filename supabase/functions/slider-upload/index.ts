// Edge Function: slider-upload
// Sube/elimina imágenes del bucket sliders usando service_role.
//
// Deploy:
//   npx supabase functions deploy slider-upload --no-verify-jwt

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

const BUCKET = 'sliders';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, DELETE, OPTIONS',
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: CORS_HEADERS });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

  if (!supabaseUrl || !serviceKey) {
    return new Response(JSON.stringify({ error: 'Server misconfigured' }), {
      status: 500,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  }

  const url = new URL(req.url);
  const path = url.searchParams.get('path') ?? '';

  if (!path.startsWith('slides/')) {
    return new Response(JSON.stringify({ error: 'Invalid path' }), {
      status: 400,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  }

  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  if (req.method === 'DELETE') {
    const { error } = await admin.storage.from(BUCKET).remove([path]);
    if (error) {
      console.error('[slider-upload] delete error:', error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 502,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      });
    }
    return new Response(JSON.stringify({ ok: true, path }), {
      status: 200,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  }

  const contentType = req.headers.get('content-type') ?? 'application/octet-stream';
  const bytes = await req.arrayBuffer();

  if (!bytes.byteLength) {
    return new Response(JSON.stringify({ error: 'Empty body' }), {
      status: 400,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  }

  if (bytes.byteLength > 5 * 1024 * 1024) {
    return new Response(JSON.stringify({ error: 'File too large (max 5 MB)' }), {
      status: 413,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  }

  const { error } = await admin.storage.from(BUCKET).upload(path, bytes, {
    upsert: true,
    contentType,
  });

  if (error) {
    console.error('[slider-upload] storage error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 502,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  }

  const { data } = admin.storage.from(BUCKET).getPublicUrl(path);

  return new Response(JSON.stringify({ bucket: BUCKET, path, publicUrl: data.publicUrl }), {
    status: 200,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  });
});
