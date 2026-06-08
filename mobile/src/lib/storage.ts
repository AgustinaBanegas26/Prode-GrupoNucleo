import { Platform } from 'react-native';

import { supabase } from './supabase';

export type UploadImageResult = {
  bucket: string;
  path: string;
  publicUrl: string;
};

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

export async function uploadImageFromUri(opts: {
  bucket: string;
  path: string;
  uri: string;
}): Promise<UploadImageResult> {
  const { bucket, path, uri } = opts;
  const { body, contentType } = await uriToUploadBody(uri);

  const { error } = await supabase.storage.from(bucket).upload(path, body, {
    upsert: true,
    contentType,
  });
  if (error) throw new Error(`Error subiendo imagen: ${error.message}`);

  return { bucket, path, publicUrl: getPublicUrl(bucket, path) };
}

export async function deleteStorageObject(opts: {
  bucket: string;
  paths: string[];
}): Promise<void> {
  const { bucket, paths } = opts;
  if (!paths.length) return;
  const { error } = await supabase.storage.from(bucket).remove(paths);
  if (error) throw new Error(`Error eliminando archivo: ${error.message}`);
}
