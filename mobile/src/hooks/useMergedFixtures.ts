import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';

import { useMatches, type MatchRow } from '../features/content/api/matches';
import { getWCMatchById } from '../services/footballData';
import type { NormalizedMatch } from '../services/apiFootball.types';
import { isDbOnlyFixture, matchRowToNormalized, mergeFixturesWithDb } from '../utils/matchFromDb';
import { useAllFixtures, WC_KEYS } from './useApiFootball';

export function useAllFixturesWithDb(options?: { dateFrom?: string; dateTo?: string }) {
  const api = useAllFixtures(options);
  const db = useMatches();

  const data = useMemo(() => {
    if (!api.data) return undefined;
    return mergeFixturesWithDb(api.data, db.data ?? []);
  }, [api.data, db.data]);

  return {
    ...api,
    data,
    isLoading: api.isLoading || db.isLoading,
    refetch: async () => {
      await Promise.all([api.refetch(), db.refetch()]);
    },
  };
}

async function fetchMatchByIdMerged(matchId: number): Promise<NormalizedMatch | null> {
  if (isDbOnlyFixture(matchId)) {
    const { supabase } = await import('../lib/supabase');
    const { data, error } = await supabase
      .from('matches')
      .select('*')
      .eq('fixture_id', matchId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data ? matchRowToNormalized(data as MatchRow) : null;
  }

  const apiMatch = await getWCMatchById(matchId);
  if (apiMatch) return apiMatch;

  const { supabase } = await import('../lib/supabase');
  const { data, error } = await supabase
    .from('matches')
    .select('*')
    .eq('fixture_id', matchId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? matchRowToNormalized(data as MatchRow) : null;
}

export function useMatchMerged(matchId: number | null) {
  return useQuery<NormalizedMatch | null>({
    queryKey: [...WC_KEYS.match(matchId ?? 0), 'merged'] as const,
    queryFn: () => (matchId ? fetchMatchByIdMerged(matchId) : null),
    enabled: matchId != null,
    staleTime: 30 * 1000,
    retry: 1,
  });
}
