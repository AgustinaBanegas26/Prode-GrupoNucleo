import { Platform } from 'react-native';

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

function contentTypeForExt(ext: string): string {
  if (ext === 'png') return 'image/png';
  if (ext === 'webp') return 'image/webp';
  return 'image/jpeg';
}

export function getPublicUrl(bucket: string, path: string): string {
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

async function uriToUploadBody(uri: string): Promise<{ body: Blob | ArrayBuffer; contentType: string }> {
  const ext = guessFileExt(uri);
  const contentType = contentTypeForExt(ext);

  if (Platform.OS === 'web') {
    const res = await fetch(uri);
    const arrayBuffer = await res.arrayBuffer();
    return { body: arrayBuffer, contentType: res.headers.get('content-type') ?? contentType };
  }

  const res = await fetch(uri);
  const blob = await res.blob();
  return { body: blob, contentType: blob.type || contentType };
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
