import { getPublicUrl } from '../lib/storage';
import { supabase } from '../lib/supabase';

const AVATAR_BUCKET = 'avatars';

/** Convierte path relativo o URL de storage en URL pública usable por <Image>. */
export function resolveAvatarUrl(stored: string | null | undefined): string | null {
  if (!stored?.trim()) return null;
  const value = stored.trim();
  if (value.startsWith('http')) return value.split('?')[0];
  const clean = value.replace(/^\//, '');
  return getPublicUrl(AVATAR_BUCKET, clean);
}

export async function fetchAvatarMap(
  clienteIds: string[],
): Promise<Record<string, string | null>> {
  if (!clienteIds.length) return {};

  const unique = [...new Set(clienteIds.map(String))];
  const { data, error } = await supabase
    .from('clientes')
    .select('cliente_id, avatar_url')
    .in('cliente_id', unique);

  if (error) throw new Error(error.message);

  const map: Record<string, string | null> = {};
  for (const row of data ?? []) {
    map[String(row.cliente_id)] = resolveAvatarUrl(row.avatar_url ?? null);
  }
  return map;
}
