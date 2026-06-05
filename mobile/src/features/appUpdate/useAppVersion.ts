/**
 * Hook: useAppVersion
 *
 * Al montar, consulta la tabla app_versions en Supabase
 * para obtener la versión activa, luego compara con el
 * versionCode local definido en APP_VERSION_CODE.
 *
 * Retorna:
 *   - status: 'loading' | 'up_to_date' | 'update_available' | 'force_update'
 *   - remoteVersion: datos de la versión remota (o null)
 *
 * USO: montar en el root layout (_layout.tsx) antes de mostrar la app.
 */

import { useEffect, useState } from 'react';

import { supabase } from '../../lib/supabase';

// ─── Versión local ────────────────────────────────────────────────────────────
// Incrementar este número con cada build que se distribuya.
// Debe coincidir con el versionCode del APK / android.versionCode en app.json.
export const APP_VERSION_CODE = 1;
export const APP_VERSION_STRING = '1.0.0';

// ─── Tipos ────────────────────────────────────────────────────────────────────
export type AppUpdateStatus =
  | 'loading'
  | 'up_to_date'
  | 'update_available'
  | 'force_update';

export type RemoteAppVersion = {
  version: string;
  versionCode: number;
  apkUrl: string;
  forceUpdate: boolean;
  changelog: string;
};

export type UseAppVersionResult = {
  status: AppUpdateStatus;
  remoteVersion: RemoteAppVersion | null;
  dismiss: () => void;
};

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useAppVersion(): UseAppVersionResult {
  const [status, setStatus] = useState<AppUpdateStatus>('loading');
  const [remoteVersion, setRemoteVersion] = useState<RemoteAppVersion | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function checkVersion() {
      try {
        const { data, error } = await supabase
          .from('app_versions')
          .select('version, version_code, apk_url, force_update, changelog')
          .eq('is_active', true)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (cancelled) return;

        if (error || !data) {
          // Si falla la consulta, no bloquear la app
          setStatus('up_to_date');
          return;
        }

        const remote: RemoteAppVersion = {
          version: data.version,
          versionCode: data.version_code,
          apkUrl: data.apk_url ?? '',
          forceUpdate: data.force_update ?? false,
          changelog: data.changelog ?? '',
        };

        setRemoteVersion(remote);

        if (remote.versionCode <= APP_VERSION_CODE) {
          setStatus('up_to_date');
        } else if (remote.forceUpdate) {
          setStatus('force_update');
        } else {
          setStatus('update_available');
        }
      } catch {
        if (!cancelled) setStatus('up_to_date');
      }
    }

    checkVersion();
    return () => {
      cancelled = true;
    };
  }, []);

  // "Más tarde" — oculta el modal opcional (no aplica a force_update)
  const dismiss = () => {
    if (status === 'update_available') {
      setDismissed(true);
      setStatus('up_to_date');
    }
  };

  return { status: dismissed ? 'up_to_date' : status, remoteVersion, dismiss };
}
