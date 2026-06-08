import { Platform } from 'react-native';

import { supabase } from './supabase';

export type UploadImageResult = {
  bucket: string;
  path: string;
  publicUrl: string;
};

export type UploadProgressCallback = (percent: number) => void;

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp'] as const;

type ImageExtension = (typeof ALLOWED_EXTENSIONS)[number];

function normalizeExtension(ext: string): ImageExtension | null {
  const normalized = ext.toLowerCase();
  return ALLOWED_EXTENSIONS.includes(normalized as ImageExtension)
    ? (normalized as ImageExtension)
    : null;
}

export function guessFileExt(uri: string): ImageExtension | null {
  const clean = uri.split('?')[0] ?? uri;
  const m = clean.match(/\.([a-zA-Z0-9]+)$/);
  return normalizeExtension(m?.[1] ?? '');
}

function extensionFromContentType(contentType?: string): ImageExtension | null {
  if (!contentType) return null;
  const normalized = contentType.split(';')[0].trim().toLowerCase();
  if (normalized === 'image/png') return 'png';
  if (normalized === 'image/webp') return 'webp';
  if (normalized === 'image/jpeg' || normalized === 'image/jpg') return 'jpg';
  return null;
}

function contentTypeForExt(ext: ImageExtension): string {
  if (ext === 'png') return 'image/png';
  if (ext === 'webp') return 'image/webp';
  return 'image/jpeg';
}

function validateImageSize(body: Blob | ArrayBuffer) {
  const size = body instanceof ArrayBuffer ? body.byteLength : body.size;
  if (size > MAX_IMAGE_BYTES) {
    throw new Error('La imagen debe ser menor a 5 MB');
  }
}

export function getPublicUrl(bucket: string, path: string): string {
  if (!path) return '';
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

const SLIDER_BUCKET = 'sliders';
const UPLOAD_TIMEOUT_MS = 60_000;

function getSupabaseConfig() {
  return {
    url: process.env.EXPO_PUBLIC_SUPABASE_URL ?? '',
    anonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '',
  };
}

function isRlsUploadError(message: string): boolean {
  const lower = message.toLowerCase();
  return (
    lower.includes('row-level security')
    || lower.includes('unauthorized')
    || lower.includes('permission')
    || lower.includes('403')
  );
}

async function uploadViaSliderEdgeFunction(
  path: string,
  body: Blob | ArrayBuffer,
  contentType: string,
  onProgress?: UploadProgressCallback,
): Promise<UploadImageResult> {
  const { url, anonKey } = getSupabaseConfig();
  if (!url || !anonKey) {
    throw new Error('Falta configuración de Supabase en la app.');
  }

  onProgress?.(20);
  const endpoint = `${url}/functions/v1/slider-upload?path=${encodeURIComponent(path)}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), UPLOAD_TIMEOUT_MS);

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${anonKey}`,
        apikey: anonKey,
        'Content-Type': contentType,
      },
      body,
      signal: controller.signal,
    });

    onProgress?.(85);

    const raw = await res.text();
    if (!res.ok) {
      let message = `Error subiendo imagen (${res.status})`;
      try {
        const parsed = JSON.parse(raw);
        if (parsed?.error) message = parsed.error;
      } catch {
        if (raw) message = raw;
      }
      if (res.status === 404) {
        throw new Error(
          'Función slider-upload no desplegada. Ejecutá: npx supabase functions deploy slider-upload --no-verify-jwt',
        );
      }
      throw new Error(message);
    }

    const parsed = JSON.parse(raw) as { publicUrl?: string; path?: string };
    if (!parsed.publicUrl) {
      throw new Error('La subida no devolvió una URL pública.');
    }

    onProgress?.(100);
    return { bucket: SLIDER_BUCKET, path: parsed.path ?? path, publicUrl: parsed.publicUrl };
  } catch (e) {
    if (e instanceof Error && e.name === 'AbortError') {
      throw new Error('Tiempo de espera agotado al subir la imagen.');
    }
    throw e;
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchUriBody(uri: string): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), UPLOAD_TIMEOUT_MS);
  try {
    const res = await fetch(uri, { signal: controller.signal });
    return res;
  } catch (e) {
    if (e instanceof Error && e.name === 'AbortError') {
      throw new Error('Tiempo de espera agotado al leer la imagen.');
    }
    throw e;
  } finally {
    clearTimeout(timeout);
  }
}

async function uriToUploadBody(uri: string): Promise<{ body: Blob | ArrayBuffer; contentType: string }> {
  const res = await fetchUriBody(uri);
  if (!res.ok) {
    throw new Error('No se pudo cargar la imagen seleccionada.');
  }

  const contentTypeHeader = res.headers.get('content-type') ?? '';
  const ext = extensionFromContentType(contentTypeHeader) ?? guessFileExt(uri) ?? 'jpg';

  if (Platform.OS === 'web') {
    const arrayBuffer = await res.arrayBuffer();
    validateImageSize(arrayBuffer);
    return { body: arrayBuffer, contentType: contentTypeHeader || contentTypeForExt(ext) };
  }

  const blob = await res.blob();
  validateImageSize(blob);
  return { body: blob, contentType: blob.type || contentTypeForExt(ext) };
}

export async function uploadImageFromUri(opts: {
  bucket: string;
  path: string;
  uri: string;
  onProgress?: UploadProgressCallback;
}): Promise<UploadImageResult> {
  const { bucket, path, uri, onProgress } = opts;

  onProgress?.(0);
  const { body, contentType } = await uriToUploadBody(uri);
  onProgress?.(10);

  // Slider: Edge Function primero (service_role, no requiere políticas en storage.objects).
  if (bucket === SLIDER_BUCKET) {
    try {
      return await uploadViaSliderEdgeFunction(path, body, contentType, onProgress);
    } catch (edgeError) {
      const edgeMsg = edgeError instanceof Error ? edgeError.message : String(edgeError);
      const edgeMissing = edgeMsg.includes('no desplegada') || edgeMsg.includes('404');
      if (!edgeMissing) throw edgeError;
      onProgress?.(15);
    }
  }

  try {
    const { error } = await supabase.storage.from(bucket).upload(path, body, {
      upsert: true,
      contentType,
    });
    if (error) throw new Error(`Error subiendo imagen: ${error.message}`);
    onProgress?.(100);
    return { bucket, path, publicUrl: getPublicUrl(bucket, path) };
  } catch (directError) {
    const message = directError instanceof Error ? directError.message : String(directError);
    if (bucket === SLIDER_BUCKET && isRlsUploadError(message)) {
      throw new Error(
        'No se pudo subir la imagen. Desplegá la función slider-upload: npx supabase functions deploy slider-upload --no-verify-jwt',
      );
    }
    throw directError;
  }
}

async function deleteViaSliderEdgeFunction(path: string): Promise<void> {
  const { url, anonKey } = getSupabaseConfig();
  if (!url || !anonKey) throw new Error('Falta configuración de Supabase en la app.');

  const endpoint = `${url}/functions/v1/slider-upload?path=${encodeURIComponent(path)}`;
  const res = await fetch(endpoint, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${anonKey}`,
      apikey: anonKey,
    },
  });

  if (!res.ok) {
    const raw = await res.text();
    let message = `Error eliminando imagen (${res.status})`;
    try {
      const parsed = JSON.parse(raw);
      if (parsed?.error) message = parsed.error;
    } catch {
      if (raw) message = raw;
    }
    throw new Error(message);
  }
}

export async function deleteStorageObject(opts: {
  bucket: string;
  paths: string[];
}): Promise<void> {
  const { bucket, paths } = opts;
  const validPaths = paths.filter(Boolean);
  if (!validPaths.length) return;

  if (bucket === SLIDER_BUCKET) {
    for (const path of validPaths) {
      try {
        await deleteViaSliderEdgeFunction(path);
      } catch (edgeError) {
        const { error } = await supabase.storage.from(bucket).remove([path]);
        if (error) {
          const edgeMsg = edgeError instanceof Error ? edgeError.message : String(edgeError);
          throw new Error(edgeMsg || error.message);
        }
      }
    }
    return;
  }

  const { error } = await supabase.storage.from(bucket).remove(validPaths);
  if (error) throw new Error(`Error eliminando archivo: ${error.message}`);
}
