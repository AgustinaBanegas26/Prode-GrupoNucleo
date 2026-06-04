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

  // En Expo/React Native, fetch(fileUri) devuelve un blob utilizable por supabase-js.
  const res = await fetch(uri);
  const blob = await res.blob();

  const ext = guessFileExt(uri);
  const contentType =
    ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';

  const { error } = await supabase.storage.from(bucket).upload(path, blob, {
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

