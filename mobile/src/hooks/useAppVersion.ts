import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';

import { supabase } from '../lib/supabase';

/**
 * Versión local hardcodeada — debe coincidir con app.json "version"
 * y con el versionCode del build de Android.
 *
 * Incrementar versionCode en cada release.
 */
export const LOCAL_VERSION = '1.0.0';
export const LOCAL_VERSION_CODE = 1;

export type AppVersionInfo = {
  id: string;
  version: string;
  versionCode: number;
  apkUrl: string;
  forceUpdate: boolean;
  changelog: string;
  isActive: boolean;
  createdAt: string;
};

export type UpdateStatus =
  | 'up_to_date'      // no hay update
  | 'optional'        // hay update, no es forzado
  | 'forced'          // hay update forzado — bloquear app
  | 'checking'        // cargando
  | 'error';          // no se pudo verificar

export function useAppVersion() {
  const query = useQuery({
    queryKey: ['app_version_active'],
    queryFn: async (): Promise<AppVersionInfo | null> => {
      const { data, error } = await supabase
        .from('app_versions')
        .select('*')
        .eq('is_active', true)
        .order('version_code', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw new Error(error.message);
      if (!data) return null;

      return {
        id: data.id,
        version: data.version,
        versionCode: data.version_code,
        apkUrl: data.apk_url,
        forceUpdate: data.force_update,
        changelog: data.changelog,
        isActive: data.is_active,
        createdAt: data.created_at,
      };
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
    retry: 2,
  });

  const remoteVersion = query.data;

  let updateStatus: UpdateStatus = 'checking';

  if (query.isLoading) {
    updateStatus = 'checking';
  } else if (query.isError) {
    updateStatus = 'error';
  } else if (!remoteVersion) {
    updateStatus = 'up_to_date';
  } else if (remoteVersion.versionCode <= LOCAL_VERSION_CODE) {
    updateStatus = 'up_to_date';
  } else if (remoteVersion.forceUpdate) {
    updateStatus = 'forced';
  } else {
    updateStatus = 'optional';
  }

  return {
    updateStatus,
    remoteVersion,
    localVersion: LOCAL_VERSION,
    localVersionCode: LOCAL_VERSION_CODE,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
  };
}
