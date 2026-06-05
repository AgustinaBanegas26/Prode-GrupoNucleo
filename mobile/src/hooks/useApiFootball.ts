// ─────────────────────────────────────────────────────────────
// Hooks para datos del Mundial 2026
// Fuente: football-data.org v4  (token en EXPO_PUBLIC_FOOTBALL_DATA_TOKEN)
// Fallback: mockData local si no hay token o la API falla
// ─────────────────────────────────────────────────────────────

import { useQuery } from '@tanstack/react-query';

import {
  getWCFixtures,
  getWCLive,
  getWCMatchById,
  getWCStandings,
  getWCUpcoming,
} from '../services/footballData';
import type { NormalizedGroup, NormalizedMatch } from '../services/apiFootball.types';

// ── Claves de caché ───────────────────────────────────────────
export const WC_KEYS = {
  all:       ['wc2026'] as const,
  fixtures:  (filters?: object) => ['wc2026', 'fixtures', filters ?? {}] as const,
  live:      ['wc2026', 'live'] as const,
  upcoming:  (n: number) => ['wc2026', 'upcoming', n] as const,
  match:     (id: number) => ['wc2026', 'match', id] as const,
  standings: ['wc2026', 'standings'] as const,
};

// ── Todos los partidos ────────────────────────────────────────
export function useAllFixtures(options?: { dateFrom?: string; dateTo?: string }) {
  return useQuery<NormalizedMatch[]>({
    queryKey:  WC_KEYS.fixtures(options),
    queryFn:   () => getWCFixtures(options),
    staleTime: 5 * 60 * 1000,
    gcTime:    30 * 60 * 1000,
    retry:     1,
  });
}

// ── En vivo ───────────────────────────────────────────────────
export function useLiveMatches() {
  return useQuery<NormalizedMatch[]>({
    queryKey:        WC_KEYS.live,
    queryFn:         getWCLive,
    refetchInterval: 60 * 1000,   // 1 min (free plan: 10 req/min)
    staleTime:       30 * 1000,
    gcTime:          2 * 60 * 1000,
    retry:           1,
  });
}

// ── Próximos N partidos ───────────────────────────────────────
export function useUpcomingMatches(next = 5) {
  return useQuery<NormalizedMatch[]>({
    queryKey:  WC_KEYS.upcoming(next),
    queryFn:   () => getWCUpcoming(next),
    staleTime: 10 * 60 * 1000,
    gcTime:    60 * 60 * 1000,
    retry:     1,
  });
}

// ── Partido por ID ────────────────────────────────────────────
export function useMatch(matchId: number | null) {
  return useQuery<NormalizedMatch | null>({
    queryKey: WC_KEYS.match(matchId ?? 0),
    queryFn:  () => (matchId ? getWCMatchById(matchId) : null),
    enabled:  matchId != null,
    staleTime: 2 * 60 * 1000,
    retry:     1,
  });
}

// ── Standings por grupo ───────────────────────────────────────
export function useStandings() {
  return useQuery<NormalizedGroup[]>({
    queryKey:  WC_KEYS.standings,
    queryFn:   getWCStandings,
    staleTime: 10 * 60 * 1000,
    gcTime:    60 * 60 * 1000,
    retry:     1,
  });
}
