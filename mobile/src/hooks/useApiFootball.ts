// ─────────────────────────────────────────────────────────────
// Hooks para football-data.org API v4 (Mundial 2026)
// Usa TanStack Query — ya incluido en el proyecto
// ─────────────────────────────────────────────────────────────

import { useQuery } from '@tanstack/react-query';

import {
  getWCFixtures,
  getWCMatchById,
  getWCUpcoming,
  hasValidToken,
} from '../services/footballData';
import type { NormalizedMatch } from '../services/apiFootball.types';

export const WC_KEYS = {
  fixtures:  (filters?: object) => ['wc2026', 'fixtures', filters ?? {}] as const,
  upcoming:  (n: number)        => ['wc2026', 'upcoming', n] as const,
  match:     (id: number)       => ['wc2026', 'match', id] as const,
};

/** Todos los partidos del torneo. staleTime 5 min. */
export function useAllFixtures(options?: { dateFrom?: string; dateTo?: string }) {
  return useQuery<NormalizedMatch[]>({
    queryKey:  WC_KEYS.fixtures(options),
    queryFn:   () => getWCFixtures(options),
    staleTime: 5 * 60 * 1000,
    gcTime:    30 * 60 * 1000,
    retry:     2,
    enabled:   hasValidToken(),
  });
}

/** Próximos N partidos desde hoy. */
export function useUpcomingMatches(next = 5) {
  return useQuery<NormalizedMatch[]>({
    queryKey:  WC_KEYS.upcoming(next),
    queryFn:   () => getWCUpcoming(next),
    staleTime: 10 * 60 * 1000,
    gcTime:    60 * 60 * 1000,
    retry:     2,
    enabled:   hasValidToken(),
  });
}

/** Un partido por ID. */
export function useMatch(matchId: number | null) {
  return useQuery<NormalizedMatch | null>({
    queryKey:  WC_KEYS.match(matchId ?? 0),
    queryFn:   () => (matchId ? getWCMatchById(matchId) : null),
    enabled:   matchId != null && hasValidToken(),
    staleTime: 2 * 60 * 1000,
    retry:     2,
  });
}
