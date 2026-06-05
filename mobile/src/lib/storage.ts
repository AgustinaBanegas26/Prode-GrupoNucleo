import { supabase } from './supabase';

export type UploadImageResult = {
  bucket: string;
  path: string;
  publicUrl: string;
};

function guessFileExt(uri: string): string {
  const clean = uri.split('?')[0] ?? uri;
  const m = clean.match(/\.([a-zA-Z0-9]+)$/);
  const ext = (m?.[1] ?? '').toLowerCase();
  if (ext === 'jpg' || ext === 'jpeg' || ext === 'png' || ext === 'webp') return ext;
  return 'jpg';
}

export function getPublicUrl(bucket: string, path: string): string {
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

export async function uploadImageFromUri(opts: {
  bucket: string;
  path: string;
  uri: string;
}): Promise<UploadImageResult> {
  const { bucket, path, uri } = opts;

  const ext = guessFileExt(uri);
  const contentType =
    ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';

  let uploadError: Error | null = null;

  // Estrategia 1: FileSystem de Expo (nativo — la más confiable para URIs locales)
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const FileSystem = require('expo-file-system');
    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    const binaryStr = atob(base64);
    const bytes = new Uint8Array(binaryStr.length);
    for (let i = 0; i < binaryStr.length; i++) bytes[i] = binaryStr.charCodeAt(i);
    const blob = new Blob([bytes], { type: contentType });
    const { error } = await supabase.storage.from(bucket).upload(path, blob, {
      upsert: true,
      contentType,
    });
    if (error) throw new Error(error.message);
    return { bucket, path, publicUrl: getPublicUrl(bucket, path) };
  } catch (e1) {
    uploadError = e1 instanceof Error ? e1 : new Error(String(e1));
  }

  // Estrategia 2: fetch blob (funciona en algunos entornos)
  try {
    const res = await fetch(uri);
    if (!res.ok) throw new Error(`fetch status ${res.status}`);
    const blob = await res.blob();
    const { error } = await supabase.storage.from(bucket).upload(path, blob, {
      upsert: true,
      contentType,
    });
    if (error) throw new Error(error.message);
    return { bucket, path, publicUrl: getPublicUrl(bucket, path) };
  } catch (e2) {
    // Both strategies failed — surface the original error
    throw new Error(
      `Error subiendo imagen: ${uploadError?.message ?? 'unknown'} / ${e2 instanceof Error ? e2.message : String(e2)}`,
    );
  }
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

