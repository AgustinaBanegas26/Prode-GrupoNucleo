import { getWCMatchById, getWCFixtures } from '../../../services/footballData';
import type { NormalizedMatch } from '../../../services/apiFootball.types';
import { supabase } from '../../../lib/supabase';
import { isDbOnlyFixture } from '../../../utils/matchFromDb';

export function toMatchRow(match: NormalizedMatch) {
  return {
    fixture_id: match.id,
    home_team: match.homeTeam,
    away_team: match.awayTeam,
    home_logo: match.homeLogo || null,
    away_logo: match.awayLogo || null,
    home_goals: match.homeScore,
    away_goals: match.awayScore,
    status: match.isFinished ? 'FT' : match.status,
    match_date: match.utcDate,
    round: match.phase || match.round || null,
    venue: match.stadium || null,
    updated_at: new Date().toISOString(),
  };
}

async function upsertMatchRows(rows: ReturnType<typeof toMatchRow>[]): Promise<number> {
  if (rows.length === 0) return 0;
  const { error } = await supabase.from('matches').upsert(rows, { onConflict: 'fixture_id' });
  if (error) throw new Error(error.message);
  return rows.length;
}

/**
 * Sincroniza TODOS los partidos del Mundial desde football-data.org → matches.
 * Misma fuente e IDs que usa la app para pronósticos y bloqueo de 10 min.
 */
export async function syncAllFixturesToDb(): Promise<{ updated: number }> {
  const fixtures = await getWCFixtures();
  const rows = fixtures
    .filter((m) => m.id && m.homeTeam?.trim() && m.awayTeam?.trim() && m.utcDate)
    .map(toMatchRow);

  const updated = await upsertMatchRows(rows);
  return { updated };
}

/** Asegura que un fixture de la API exista en matches antes de pronosticar. */
export async function ensureFixtureInDb(fixtureId: number): Promise<void> {
  if (isDbOnlyFixture(fixtureId)) return;

  const { data: existing } = await supabase
    .from('matches')
    .select('fixture_id')
    .eq('fixture_id', fixtureId)
    .maybeSingle();

  if (existing?.fixture_id) return;

  const match = await getWCMatchById(fixtureId);
  if (!match) throw new Error('El partido no está disponible en la API.');

  await upsertMatchRows([toMatchRow(match)]);
}

/** Sincroniza resultados finalizados desde football-data.org → tabla matches (dispara scoring automático). */
export async function syncFinishedMatchResults(): Promise<{ updated: number }> {
  const finished = await getWCFixtures({ status: 'FINISHED' });
  const rows = finished
    .filter((m) => m.isFinished && m.homeScore != null && m.awayScore != null)
    .map(toMatchRow);

  const updated = await upsertMatchRows(rows);
  return { updated };
}
