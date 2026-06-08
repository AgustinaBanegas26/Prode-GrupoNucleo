import { getWCFixtures } from '../../../services/footballData';
import type { NormalizedMatch } from '../../../services/apiFootball.types';
import { supabase } from '../../../lib/supabase';

function toMatchRow(match: NormalizedMatch) {
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

/** Sincroniza resultados finalizados desde football-data.org → tabla matches (dispara scoring automático). */
export async function syncFinishedMatchResults(): Promise<{ updated: number }> {
  const finished = await getWCFixtures({ status: 'FINISHED' });
  const rows = finished
    .filter((m) => m.isFinished && m.homeScore != null && m.awayScore != null)
    .map(toMatchRow);

  if (rows.length === 0) return { updated: 0 };

  const { error } = await supabase.from('matches').upsert(rows, { onConflict: 'fixture_id' });
  if (error) throw new Error(error.message);

  return { updated: rows.length };
}
