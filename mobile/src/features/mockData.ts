export type MatchPhase = 'Fase de Grupos' | 'Octavos' | 'Cuartos' | 'Semifinales' | 'Final';

type MatchItem = {
  id: string;
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

type PositionItem = {
  id: string;
  position: number;
  name: string;
  points: number;
  played: number;
  diff: number;
  isCurrent?: boolean;
};

type PredictionItem = {
  id: string;
  match: string;
  date: string;
  time: string;
  status: string;
  pick: string;
  score: string;
};

type ProfileStats = {
  points: number;
  aciertos: number;
  efectividad: string;
};

export const bannerData = {
  title: '¡Comienza el Mundial Innova 2024!',
  description: 'Adivina los resultados y suma más puntos.',
  actionLabel: 'Ver Fixture',
};

export const homePosition = {
  position: 4,
  points: 2450,
  variation: 120,
};

export const upcomingMatches: MatchItem[] = [
  {
    id: 'm1',
    homeTeam: 'ARG',
    awayTeam: 'BRA',
    homeCode: 'ARG',
    awayCode: 'BRA',
    date: '20 Nov',
    time: '18:00',
    stadium: 'Lusail Stadium',
    phase: 'Fase de Grupos',
    group: 'Grupo A',
  },
  {
    id: 'm2',
    homeTeam: 'ESP',
    awayTeam: 'FRA',
    homeCode: 'ESP',
    awayCode: 'FRA',
    date: '22 Nov',
    time: '15:00',
    stadium: 'Al Bayt Stadium',
    phase: 'Fase de Grupos',
    group: 'Grupo B',
  },
  {
    id: 'm3',
    homeTeam: 'ENG',
    awayTeam: 'NED',
    homeCode: 'ENG',
    awayCode: 'NED',
    date: '23 Nov',
    time: '18:00',
    stadium: 'Stadium 974',
    phase: 'Fase de Grupos',
    group: 'Grupo C',
  },
];

export const fixturePhases: MatchPhase[] = [
  'Fase de Grupos',
  'Octavos',
  'Cuartos',
  'Semifinales',
  'Final',
];

export const fixtures: MatchItem[] = [
  {
    id: 'f1',
    homeTeam: 'QAT',
    awayTeam: 'ECU',
    homeCode: 'QAT',
    awayCode: 'ECU',
    date: '20 Nov',
    time: '10:00',
    stadium: 'Al Bayt Stadium',
    phase: 'Fase de Grupos',
    group: 'Grupo A',
  },
  {
    id: 'f2',
    homeTeam: 'SEN',
    awayTeam: 'NED',
    homeCode: 'SEN',
    awayCode: 'NED',
    date: '20 Nov',
    time: '13:00',
    stadium: 'Khalifa International',
    phase: 'Fase de Grupos',
    group: 'Grupo A',
  },
  {
    id: 'f3',
    homeTeam: 'USA',
    awayTeam: 'GAL',
    homeCode: 'USA',
    awayCode: 'GAL',
    date: '21 Nov',
    time: '10:00',
    stadium: 'Al Thumama',
    phase: 'Fase de Grupos',
    group: 'Grupo B',
  },
  {
    id: 'f4',
    homeTeam: 'ARG',
    awayTeam: 'BRA',
    homeCode: 'ARG',
    awayCode: 'BRA',
    date: '22 Nov',
    time: '18:00',
    stadium: 'Lusail Stadium',
    phase: 'Octavos',
  },
  {
    id: 'f5',
    homeTeam: 'FRA',
    awayTeam: 'ESP',
    homeCode: 'FRA',
    awayCode: 'ESP',
    date: '27 Nov',
    time: '20:00',
    stadium: 'Education City',
    phase: 'Cuartos',
  },
  {
    id: 'f6',
    homeTeam: 'ENG',
    awayTeam: 'POR',
    homeCode: 'ENG',
    awayCode: 'POR',
    date: '30 Nov',
    time: '20:00',
    stadium: 'Al Bayt Stadium',
    phase: 'Semifinales',
  },
  {
    id: 'f7',
    homeTeam: 'ARG',
    awayTeam: 'FRA',
    homeCode: 'ARG',
    awayCode: 'FRA',
    date: '18 Dec',
    time: '18:00',
    stadium: 'Lusail Stadium',
    phase: 'Final',
  },
];

export const predictions: PredictionItem[] = [
  {
    id: 'p1',
    match: 'Argentina vs Brasil',
    date: '20 Nov',
    time: '18:00',
    status: 'Pendiente',
    pick: 'ARG',
    score: '2-1',
  },
  {
    id: 'p2',
    match: 'España vs Francia',
    date: '22 Nov',
    time: '15:00',
    status: 'Guardado',
    pick: 'ESP',
    score: '1-0',
  },
];

export const rankingData: PositionItem[] = [
  { id: 'r1', position: 1, name: 'Martín', points: 2850, played: 12, diff: 18 },
  { id: 'r2', position: 2, name: 'Sofía', points: 2620, played: 12, diff: 14 },
  { id: 'r3', position: 3, name: 'Lucas', points: 2500, played: 12, diff: 9 },
  { id: 'r4', position: 4, name: 'Juan (Tú)', points: 2450, played: 12, diff: 7, isCurrent: true },
  { id: 'r5', position: 5, name: 'Pedro', points: 2300, played: 12, diff: 2 },
  { id: 'r6', position: 6, name: 'Gabi', points: 2150, played: 12, diff: -1 },
  { id: 'r7', position: 7, name: 'Nico', points: 2100, played: 12, diff: -4 },
  { id: 'r8', position: 8, name: 'Facu', points: 1900, played: 12, diff: -8 },
];

export const profileStats: ProfileStats = {
  points: 2450,
  aciertos: 32,
  efectividad: '68%',
};

export const profileMenu = [
  { id: 'm1', label: 'Mis Pronósticos' },
  { id: 'm2', label: 'Historial' },
  { id: 'm3', label: 'Estadísticas' },
  { id: 'm4', label: 'Notificaciones' },
];

export function getMatchById(matchId: string) {
  return fixtures.find((item) => item.id === matchId) || upcomingMatches.find((item) => item.id === matchId);
}

export function getMatchesByPhase(phase: MatchPhase) {
  return fixtures.filter((item) => item.phase === phase);
}

export function makeMatchLabel(match: MatchItem) {
  return `${match.homeTeam} vs ${match.awayTeam}`;
}

export type { MatchItem, PositionItem, PredictionItem, ProfileStats };
