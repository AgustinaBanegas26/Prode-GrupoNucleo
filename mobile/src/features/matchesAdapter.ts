export type MatchPhase = 'Fase de Grupos' | 'Octavos' | 'Cuartos' | 'Semifinales' | 'Final';

export type MatchItem = {
  id: string; // fixture_id como string para compatibilidad con rutas existentes
  homeTeam: string;
  awayTeam: string;
  homeCode: string;
  awayCode: string;
  date: string;
  time: string;
  stadium: string;
  phase: MatchPhase;
  group?: string;
};

export const fixturePhases: MatchPhase[] = [
  'Fase de Grupos',
  'Octavos',
  'Cuartos',
  'Semifinales',
  'Final',
];

function onlyLetters(s: string) {
  return s.replace(/[^a-zA-ZÁÉÍÓÚÜÑáéíóúüñ]/g, '');
}

export function toTeamCode(teamName: string): string {
  const clean = onlyLetters(teamName).toUpperCase();
  if (clean.length >= 3) return clean.slice(0, 3);
  return (clean || '---').padEnd(3, '-').slice(0, 3);
}

export function inferPhaseFromRound(round?: string | null): MatchPhase {
  const r = (round ?? '').toLowerCase();

  if (r.includes('final') && !r.includes('semi')) return 'Final';
  if (r.includes('semi')) return 'Semifinales';
  if (r.includes('quarter') || r.includes('cuartos')) return 'Cuartos';
  if (r.includes('round of 16') || r.includes('octavos')) return 'Octavos';

  // default
  return 'Fase de Grupos';
}

export function inferGroupFromRound(round?: string | null): string | undefined {
  const r = (round ?? '');
  const m = r.match(/group\s*([a-z])/i) || r.match(/grupo\s*([a-z])/i);
  if (m?.[1]) return `Grupo ${m[1].toUpperCase()}`;
  return undefined;
}

export function formatMatchDateTime(matchDateIso: string): { date: string; time: string } {
  const d = new Date(matchDateIso);
  // Si el ISO viene con TZ, Date lo respeta. Mostramos en horario local del dispositivo.
  const date = d.toLocaleDateString('es-AR', { day: '2-digit', month: 'short' });
  const time = d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
  return { date, time };
}

export function toMatchItemFromDb(row: any): MatchItem {
  const { date, time } = formatMatchDateTime(row.match_date);
  const phase = inferPhaseFromRound(row.round);
  const group = inferGroupFromRound(row.round);

  return {
    id: String(row.fixture_id),
    homeTeam: row.home_team,
    awayTeam: row.away_team,
    homeCode: toTeamCode(row.home_team),
    awayCode: toTeamCode(row.away_team),
    date,
    time,
    stadium: row.venue ?? '',
    phase,
    group,
  };
}

export function getMatchesByPhase(items: MatchItem[], phase: MatchPhase) {
  return items.filter((m) => m.phase === phase);
}

