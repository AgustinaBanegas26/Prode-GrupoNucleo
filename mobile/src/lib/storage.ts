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

async function uriToUploadBody(uri: string): Promise<{ body: Blob | ArrayBuffer; contentType: string }> {
  if (Platform.OS === 'web') {
    const res = await fetch(uri);
    if (!res.ok) {
      throw new Error('No se pudo cargar la imagen desde la URI.');
    }

    const contentTypeHeader = res.headers.get('content-type') ?? '';
    const ext = extensionFromContentType(contentTypeHeader) ?? guessFileExt(uri);
    if (!ext) {
      throw new Error('Formato de imagen no válido. Usa jpg, jpeg, png o webp.');
    }

    const arrayBuffer = await res.arrayBuffer();
    validateImageSize(arrayBuffer);
    return { body: arrayBuffer, contentType: contentTypeHeader || contentTypeForExt(ext) };
  }

  const res = await fetch(uri);
  if (!res.ok) {
    throw new Error('No se pudo cargar la imagen desde la URI.');
  }

  const blob = await res.blob();
  const ext = extensionFromContentType(blob.type) ?? guessFileExt(uri);
  if (!ext) {
    throw new Error('Formato de imagen no válido. Usa jpg, jpeg, png o webp.');
  }

  validateImageSize(blob);
  return { body: blob, contentType: blob.type || contentTypeForExt(ext) };
}

function getStorageAuthHeaders(): Record<string, string> {
  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
  const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';
  const headers: Record<string, string> = {
    apikey: supabaseAnonKey,
  };

  const restHeaders = (supabase as { rest?: { headers?: Record<string, string> } }).rest?.headers;
  const authHeader = restHeaders?.Authorization;
  if (authHeader) {
    headers.Authorization = authHeader;
  } else {
    headers.Authorization = `Bearer ${supabaseAnonKey}`;
  }

  return { supabaseUrl, ...headers } as Record<string, string> & { supabaseUrl: string };
}

function uploadWithProgress(
  url: string,
  headers: Record<string, string>,
  body: Blob | ArrayBuffer,
  contentType: string,
  onProgress?: UploadProgressCallback,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', url);

    Object.entries(headers).forEach(([key, value]) => {
      if (key !== 'supabaseUrl') xhr.setRequestHeader(key, value);
    });
    xhr.setRequestHeader('Content-Type', contentType);
    xhr.setRequestHeader('x-upsert', 'true');

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && onProgress) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        onProgress?.(100);
        resolve();
      } else {
        let message = `Error subiendo imagen (${xhr.status})`;
        try {
          const parsed = JSON.parse(xhr.responseText);
          if (parsed?.message) message = parsed.message;
          if (parsed?.error) message = parsed.error;
        } catch {
          // ignore parse errors
        }
        reject(new Error(message));
      }
    };

    xhr.onerror = () => reject(new Error('Error de red al subir la imagen'));
    xhr.onabort = () => reject(new Error('Carga de imagen cancelada'));

    xhr.send(body);
  });
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
  onProgress?.(15);

  if (onProgress) {
    const auth = getStorageAuthHeaders();
    const encodedPath = path.split('/').map(encodeURIComponent).join('/');
    const url = `${auth.supabaseUrl}/storage/v1/object/${bucket}/${encodedPath}`;
    const { supabaseUrl: _, ...headers } = auth;
    await uploadWithProgress(url, headers, body, contentType, (pct) => {
      onProgress(Math.min(99, 15 + Math.round(pct * 0.85)));
    });
  } else {
    const { error } = await supabase.storage.from(bucket).upload(path, body, {
      upsert: true,
      contentType,
    });
    if (error) throw new Error(`Error subiendo imagen: ${error.message}`);
  }

  onProgress?.(100);
  return { bucket, path, publicUrl: getPublicUrl(bucket, path) };
}

export async function deleteStorageObject(opts: {
  bucket: string;
  paths: string[];
}): Promise<void> {
  const { bucket, paths } = opts;
  const validPaths = paths.filter(Boolean);
  if (!validPaths.length) return;
  const { error } = await supabase.storage.from(bucket).remove(validPaths);
  if (error) throw new Error(`Error eliminando archivo: ${error.message}`);
}
