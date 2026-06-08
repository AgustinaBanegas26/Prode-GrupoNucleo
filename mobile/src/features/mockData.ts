// ─────────────────────────────────────────────────────────────
// FIXTURE OFICIAL Copa Mundial FIFA 2026
// 11 junio – 19 julio | Canadá, México, Estados Unidos
// ─────────────────────────────────────────────────────────────

export type MatchPhase =
  | 'Fase de Grupos'
  | 'Dieciseisavos'
  | 'Octavos'
  | 'Cuartos'
  | 'Semifinales'
  | 'Final';

export type MatchItem = {
  id: string;
  homeTeam: string;
  awayTeam: string;
  homeCode: string;
  awayCode: string;
  date: string;       // "11 Jun"
  isoDate: string;    // "2026-06-11"
  time: string;       // "15:00"
  stadium: string;
  phase: MatchPhase;
  group?: string;
  matchNumber: number;
};

export type PositionItem = {
  id: string;
  position: number;
  name: string;
  points: number;
  played: number;
  diff: number;
  isCurrent?: boolean;
  avatarUrl?: string | null;
};

export type PredictionItem = {
  id: string;
  match: string;
  date: string;
  time: string;
  status: string;
  pick: string;
  score: string;
};

export type ProfileStats = {
  points: number;
  aciertos: number;
  efectividad: string;
};

// ─── Emojis banderas ─────────────────────────────────────────
export const FLAG: Record<string, string> = {
  MEX: '🇲🇽', RSA: '🇿🇦', KOR: '🇰🇷', CZE: '🇨🇿',
  CAN: '🇨🇦', BIH: '🇧🇦', USA: '🇺🇸', PAR: '🇵🇾',
  QAT: '🇶🇦', SUI: '🇨🇭', BRA: '🇧🇷', MAR: '🇲🇦',
  HAI: '🇭🇹', SCO: '🏴󠁧󠁢󠁳󠁣󠁴󠁿', AUS: '🇦🇺', TUR: '🇹🇷',
  GER: '🇩🇪', CUW: '🇨🇼', NED: '🇳🇱', JPN: '🇯🇵',
  CIV: '🇨🇮', ECU: '🇪🇨', SWE: '🇸🇪', TUN: '🇹🇳',
  ESP: '🇪🇸', CPV: '🇨🇻', BEL: '🇧🇪', EGY: '🇪🇬',
  KSA: '🇸🇦', URU: '🇺🇾', IRN: '🇮🇷', NZL: '🇳🇿',
  FRA: '🇫🇷', SEN: '🇸🇳', IRQ: '🇮🇶', NOR: '🇳🇴',
  ARG: '🇦🇷', ALG: '🇩🇿', AUT: '🇦🇹', JOR: '🇯🇴',
  POR: '🇵🇹', CGO: '🇨🇬', ENG: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', CRO: '🇭🇷',
  GHA: '🇬🇭', PAN: '🇵🇦', UZB: '🇺🇿', COL: '🇨🇴',
};

// ─── Fixture completo Fase de Grupos ─────────────────────────
export const fixtures: MatchItem[] = [
  // ── GRUPO A ──
  { id: '1',  matchNumber: 1,  homeTeam: 'México',       awayTeam: 'Sudáfrica',    homeCode: 'MEX', awayCode: 'RSA', date: '11 Jun', isoDate: '2026-06-11', time: '15:00', stadium: 'Ciudad de México', phase: 'Fase de Grupos', group: 'Grupo A' },
  { id: '2',  matchNumber: 2,  homeTeam: 'Corea del Sur', awayTeam: 'Rep. Checa',  homeCode: 'KOR', awayCode: 'CZE', date: '11 Jun', isoDate: '2026-06-11', time: '22:00', stadium: 'Guadalajara',      phase: 'Fase de Grupos', group: 'Grupo A' },
  { id: '25', matchNumber: 25, homeTeam: 'Rep. Checa',   awayTeam: 'Sudáfrica',    homeCode: 'CZE', awayCode: 'RSA', date: '18 Jun', isoDate: '2026-06-18', time: '12:00', stadium: 'Atlanta',           phase: 'Fase de Grupos', group: 'Grupo A' },
  { id: '28', matchNumber: 28, homeTeam: 'México',       awayTeam: 'Corea del Sur',homeCode: 'MEX', awayCode: 'KOR', date: '18 Jun', isoDate: '2026-06-18', time: '21:00', stadium: 'Guadalajara',      phase: 'Fase de Grupos', group: 'Grupo A' },
  { id: '53', matchNumber: 53, homeTeam: 'Rep. Checa',   awayTeam: 'México',       homeCode: 'CZE', awayCode: 'MEX', date: '24 Jun', isoDate: '2026-06-24', time: '21:00', stadium: 'Ciudad de México', phase: 'Fase de Grupos', group: 'Grupo A' },
  { id: '54', matchNumber: 54, homeTeam: 'Sudáfrica',    awayTeam: 'Corea del Sur',homeCode: 'RSA', awayCode: 'KOR', date: '24 Jun', isoDate: '2026-06-24', time: '21:00', stadium: 'Monterrey',        phase: 'Fase de Grupos', group: 'Grupo A' },

  // ── GRUPO B ──
  { id: '3',  matchNumber: 3,  homeTeam: 'Canadá',       awayTeam: 'Bosnia y Herz.', homeCode: 'CAN', awayCode: 'BIH', date: '12 Jun', isoDate: '2026-06-12', time: '15:00', stadium: 'Toronto',      phase: 'Fase de Grupos', group: 'Grupo B' },
  { id: '5',  matchNumber: 5,  homeTeam: 'Catar',        awayTeam: 'Suiza',           homeCode: 'QAT', awayCode: 'SUI', date: '13 Jun', isoDate: '2026-06-13', time: '15:00', stadium: 'San Francisco',phase: 'Fase de Grupos', group: 'Grupo B' },
  { id: '26', matchNumber: 26, homeTeam: 'Suiza',        awayTeam: 'Bosnia y Herz.',  homeCode: 'SUI', awayCode: 'BIH', date: '18 Jun', isoDate: '2026-06-18', time: '15:00', stadium: 'Los Angeles', phase: 'Fase de Grupos', group: 'Grupo B' },
  { id: '27', matchNumber: 27, homeTeam: 'Canadá',       awayTeam: 'Catar',           homeCode: 'CAN', awayCode: 'QAT', date: '18 Jun', isoDate: '2026-06-18', time: '18:00', stadium: 'Vancouver',   phase: 'Fase de Grupos', group: 'Grupo B' },
  { id: '49', matchNumber: 49, homeTeam: 'Suiza',        awayTeam: 'Canadá',          homeCode: 'SUI', awayCode: 'CAN', date: '24 Jun', isoDate: '2026-06-24', time: '15:00', stadium: 'Vancouver',   phase: 'Fase de Grupos', group: 'Grupo B' },
  { id: '50', matchNumber: 50, homeTeam: 'Bosnia y Herz.', awayTeam: 'Catar',         homeCode: 'BIH', awayCode: 'QAT', date: '24 Jun', isoDate: '2026-06-24', time: '15:00', stadium: 'Seattle',     phase: 'Fase de Grupos', group: 'Grupo B' },

  // ── GRUPO C ──
  { id: '6',  matchNumber: 6,  homeTeam: 'Brasil',       awayTeam: 'Marruecos',    homeCode: 'BRA', awayCode: 'MAR', date: '13 Jun', isoDate: '2026-06-13', time: '18:00', stadium: 'Nueva York/NJ', phase: 'Fase de Grupos', group: 'Grupo C' },
  { id: '7',  matchNumber: 7,  homeTeam: 'Haití',        awayTeam: 'Escocia',      homeCode: 'HAI', awayCode: 'SCO', date: '13 Jun', isoDate: '2026-06-13', time: '21:00', stadium: 'Boston',         phase: 'Fase de Grupos', group: 'Grupo C' },
  { id: '30', matchNumber: 30, homeTeam: 'Escocia',      awayTeam: 'Marruecos',    homeCode: 'SCO', awayCode: 'MAR', date: '19 Jun', isoDate: '2026-06-19', time: '18:00', stadium: 'Boston',         phase: 'Fase de Grupos', group: 'Grupo C' },
  { id: '31', matchNumber: 31, homeTeam: 'Brasil',       awayTeam: 'Haití',        homeCode: 'BRA', awayCode: 'HAI', date: '19 Jun', isoDate: '2026-06-19', time: '20:30', stadium: 'Filadelfia',     phase: 'Fase de Grupos', group: 'Grupo C' },
  { id: '51', matchNumber: 51, homeTeam: 'Escocia',      awayTeam: 'Brasil',       homeCode: 'SCO', awayCode: 'BRA', date: '24 Jun', isoDate: '2026-06-24', time: '18:00', stadium: 'Miami',          phase: 'Fase de Grupos', group: 'Grupo C' },
  { id: '52', matchNumber: 52, homeTeam: 'Marruecos',    awayTeam: 'Haití',        homeCode: 'MAR', awayCode: 'HAI', date: '24 Jun', isoDate: '2026-06-24', time: '18:00', stadium: 'Atlanta',        phase: 'Fase de Grupos', group: 'Grupo C' },

  // ── GRUPO D ──
  { id: '4',  matchNumber: 4,  homeTeam: 'Estados Unidos', awayTeam: 'Paraguay',   homeCode: 'USA', awayCode: 'PAR', date: '12 Jun', isoDate: '2026-06-12', time: '21:00', stadium: 'Los Angeles',   phase: 'Fase de Grupos', group: 'Grupo D' },
  { id: '8',  matchNumber: 8,  homeTeam: 'Australia',    awayTeam: 'Turquía',      homeCode: 'AUS', awayCode: 'TUR', date: '14 Jun', isoDate: '2026-06-14', time: '00:00', stadium: 'Vancouver',     phase: 'Fase de Grupos', group: 'Grupo D' },
  { id: '29', matchNumber: 29, homeTeam: 'Estados Unidos', awayTeam: 'Australia',  homeCode: 'USA', awayCode: 'AUS', date: '19 Jun', isoDate: '2026-06-19', time: '15:00', stadium: 'Seattle',       phase: 'Fase de Grupos', group: 'Grupo D' },
  { id: '32', matchNumber: 32, homeTeam: 'Turquía',      awayTeam: 'Paraguay',     homeCode: 'TUR', awayCode: 'PAR', date: '19 Jun', isoDate: '2026-06-19', time: '23:00', stadium: 'San Francisco', phase: 'Fase de Grupos', group: 'Grupo D' },
  { id: '59', matchNumber: 59, homeTeam: 'Turquía',      awayTeam: 'Estados Unidos',homeCode: 'TUR', awayCode: 'USA', date: '25 Jun', isoDate: '2026-06-25', time: '22:00', stadium: 'Los Angeles',  phase: 'Fase de Grupos', group: 'Grupo D' },
  { id: '60', matchNumber: 60, homeTeam: 'Paraguay',     awayTeam: 'Australia',    homeCode: 'PAR', awayCode: 'AUS', date: '25 Jun', isoDate: '2026-06-25', time: '22:00', stadium: 'San Francisco', phase: 'Fase de Grupos', group: 'Grupo D' },

  // ── GRUPO E ──
  { id: '9',  matchNumber: 9,  homeTeam: 'Alemania',     awayTeam: 'Curazao',      homeCode: 'GER', awayCode: 'CUW', date: '14 Jun', isoDate: '2026-06-14', time: '13:00', stadium: 'Houston',      phase: 'Fase de Grupos', group: 'Grupo E' },
  { id: '11', matchNumber: 11, homeTeam: 'Costa de Marfil', awayTeam: 'Ecuador',   homeCode: 'CIV', awayCode: 'ECU', date: '14 Jun', isoDate: '2026-06-14', time: '19:00', stadium: 'Filadelfia',   phase: 'Fase de Grupos', group: 'Grupo E' },
  { id: '34', matchNumber: 34, homeTeam: 'Alemania',     awayTeam: 'C. de Marfil', homeCode: 'GER', awayCode: 'CIV', date: '20 Jun', isoDate: '2026-06-20', time: '16:00', stadium: 'Toronto',      phase: 'Fase de Grupos', group: 'Grupo E' },
  { id: '35', matchNumber: 35, homeTeam: 'Ecuador',      awayTeam: 'Curazao',      homeCode: 'ECU', awayCode: 'CUW', date: '20 Jun', isoDate: '2026-06-20', time: '20:00', stadium: 'Kansas City',  phase: 'Fase de Grupos', group: 'Grupo E' },
  { id: '55', matchNumber: 55, homeTeam: 'Curazao',      awayTeam: 'C. de Marfil', homeCode: 'CUW', awayCode: 'CIV', date: '25 Jun', isoDate: '2026-06-25', time: '16:00', stadium: 'Filadelfia',   phase: 'Fase de Grupos', group: 'Grupo E' },
  { id: '56', matchNumber: 56, homeTeam: 'Ecuador',      awayTeam: 'Alemania',     homeCode: 'ECU', awayCode: 'GER', date: '25 Jun', isoDate: '2026-06-25', time: '16:00', stadium: 'Nueva York/NJ',phase: 'Fase de Grupos', group: 'Grupo E' },

  // ── GRUPO F ──
  { id: '10', matchNumber: 10, homeTeam: 'Países Bajos', awayTeam: 'Japón',        homeCode: 'NED', awayCode: 'JPN', date: '14 Jun', isoDate: '2026-06-14', time: '16:00', stadium: 'Dallas',       phase: 'Fase de Grupos', group: 'Grupo F' },
  { id: '12', matchNumber: 12, homeTeam: 'Suecia',       awayTeam: 'Túnez',        homeCode: 'SWE', awayCode: 'TUN', date: '14 Jun', isoDate: '2026-06-14', time: '22:00', stadium: 'Monterrey',    phase: 'Fase de Grupos', group: 'Grupo F' },
  { id: '33', matchNumber: 33, homeTeam: 'Países Bajos', awayTeam: 'Suecia',       homeCode: 'NED', awayCode: 'SWE', date: '20 Jun', isoDate: '2026-06-20', time: '13:00', stadium: 'Houston',      phase: 'Fase de Grupos', group: 'Grupo F' },
  { id: '36', matchNumber: 36, homeTeam: 'Túnez',        awayTeam: 'Japón',        homeCode: 'TUN', awayCode: 'JPN', date: '21 Jun', isoDate: '2026-06-21', time: '00:00', stadium: 'Monterrey',    phase: 'Fase de Grupos', group: 'Grupo F' },
  { id: '57', matchNumber: 57, homeTeam: 'Japón',        awayTeam: 'Suecia',       homeCode: 'JPN', awayCode: 'SWE', date: '25 Jun', isoDate: '2026-06-25', time: '19:00', stadium: 'Dallas',       phase: 'Fase de Grupos', group: 'Grupo F' },
  { id: '58', matchNumber: 58, homeTeam: 'Túnez',        awayTeam: 'Países Bajos', homeCode: 'TUN', awayCode: 'NED', date: '25 Jun', isoDate: '2026-06-25', time: '19:00', stadium: 'Kansas City',  phase: 'Fase de Grupos', group: 'Grupo F' },

  // ── GRUPO G ──
  { id: '14', matchNumber: 14, homeTeam: 'Bélgica',      awayTeam: 'Egipto',       homeCode: 'BEL', awayCode: 'EGY', date: '15 Jun', isoDate: '2026-06-15', time: '15:00', stadium: 'Seattle',      phase: 'Fase de Grupos', group: 'Grupo G' },
  { id: '16', matchNumber: 16, homeTeam: 'Irán',         awayTeam: 'Nueva Zelanda',homeCode: 'IRN', awayCode: 'NZL', date: '15 Jun', isoDate: '2026-06-15', time: '21:00', stadium: 'Los Angeles',  phase: 'Fase de Grupos', group: 'Grupo G' },
  { id: '38', matchNumber: 38, homeTeam: 'Bélgica',      awayTeam: 'Irán',         homeCode: 'BEL', awayCode: 'IRN', date: '21 Jun', isoDate: '2026-06-21', time: '15:00', stadium: 'Los Angeles',  phase: 'Fase de Grupos', group: 'Grupo G' },
  { id: '40', matchNumber: 40, homeTeam: 'Nueva Zelanda',awayTeam: 'Egipto',       homeCode: 'NZL', awayCode: 'EGY', date: '21 Jun', isoDate: '2026-06-21', time: '21:00', stadium: 'Vancouver',    phase: 'Fase de Grupos', group: 'Grupo G' },
  { id: '65', matchNumber: 65, homeTeam: 'Egipto',       awayTeam: 'Irán',         homeCode: 'EGY', awayCode: 'IRN', date: '26 Jun', isoDate: '2026-06-26', time: '23:00', stadium: 'Seattle',      phase: 'Fase de Grupos', group: 'Grupo G' },
  { id: '66', matchNumber: 66, homeTeam: 'Nueva Zelanda',awayTeam: 'Bélgica',      homeCode: 'NZL', awayCode: 'BEL', date: '26 Jun', isoDate: '2026-06-26', time: '23:00', stadium: 'Vancouver',    phase: 'Fase de Grupos', group: 'Grupo G' },

  // ── GRUPO H ──
  { id: '13', matchNumber: 13, homeTeam: 'España',       awayTeam: 'Cabo Verde',   homeCode: 'ESP', awayCode: 'CPV', date: '15 Jun', isoDate: '2026-06-15', time: '12:00', stadium: 'Atlanta',      phase: 'Fase de Grupos', group: 'Grupo H' },
  { id: '15', matchNumber: 15, homeTeam: 'Arabia Saudita',awayTeam: 'Uruguay',     homeCode: 'KSA', awayCode: 'URU', date: '15 Jun', isoDate: '2026-06-15', time: '18:00', stadium: 'Miami',        phase: 'Fase de Grupos', group: 'Grupo H' },
  { id: '37', matchNumber: 37, homeTeam: 'España',       awayTeam: 'Arabia Saudita',homeCode: 'ESP', awayCode: 'KSA',date: '21 Jun', isoDate: '2026-06-21', time: '12:00', stadium: 'Atlanta',      phase: 'Fase de Grupos', group: 'Grupo H' },
  { id: '39', matchNumber: 39, homeTeam: 'Uruguay',      awayTeam: 'Cabo Verde',   homeCode: 'URU', awayCode: 'CPV', date: '21 Jun', isoDate: '2026-06-21', time: '18:00', stadium: 'Miami',        phase: 'Fase de Grupos', group: 'Grupo H' },
  { id: '63', matchNumber: 63, homeTeam: 'Cabo Verde',   awayTeam: 'Arabia Saudita',homeCode: 'CPV', awayCode: 'KSA',date: '26 Jun', isoDate: '2026-06-26', time: '20:00', stadium: 'Houston',      phase: 'Fase de Grupos', group: 'Grupo H' },
  { id: '64', matchNumber: 64, homeTeam: 'Uruguay',      awayTeam: 'España',       homeCode: 'URU', awayCode: 'ESP', date: '26 Jun', isoDate: '2026-06-26', time: '20:00', stadium: 'Guadalajara',  phase: 'Fase de Grupos', group: 'Grupo H' },

  // ── GRUPO I ──
  { id: '17', matchNumber: 17, homeTeam: 'Francia',      awayTeam: 'Senegal',      homeCode: 'FRA', awayCode: 'SEN', date: '16 Jun', isoDate: '2026-06-16', time: '15:00', stadium: 'Nueva York/NJ', phase: 'Fase de Grupos', group: 'Grupo I' },
  { id: '18', matchNumber: 18, homeTeam: 'Irak',         awayTeam: 'Noruega',      homeCode: 'IRQ', awayCode: 'NOR', date: '16 Jun', isoDate: '2026-06-16', time: '18:00', stadium: 'Boston',        phase: 'Fase de Grupos', group: 'Grupo I' },
  { id: '42', matchNumber: 42, homeTeam: 'Francia',      awayTeam: 'Irak',         homeCode: 'FRA', awayCode: 'IRQ', date: '22 Jun', isoDate: '2026-06-22', time: '17:00', stadium: 'Filadelfia',    phase: 'Fase de Grupos', group: 'Grupo I' },
  { id: '43', matchNumber: 43, homeTeam: 'Noruega',      awayTeam: 'Senegal',      homeCode: 'NOR', awayCode: 'SEN', date: '22 Jun', isoDate: '2026-06-22', time: '20:00', stadium: 'Nueva York/NJ', phase: 'Fase de Grupos', group: 'Grupo I' },
  { id: '61', matchNumber: 61, homeTeam: 'Noruega',      awayTeam: 'Francia',      homeCode: 'NOR', awayCode: 'FRA', date: '26 Jun', isoDate: '2026-06-26', time: '15:00', stadium: 'Boston',        phase: 'Fase de Grupos', group: 'Grupo I' },
  { id: '62', matchNumber: 62, homeTeam: 'Senegal',      awayTeam: 'Irak',         homeCode: 'SEN', awayCode: 'IRQ', date: '26 Jun', isoDate: '2026-06-26', time: '15:00', stadium: 'Toronto',       phase: 'Fase de Grupos', group: 'Grupo I' },

  // ── GRUPO J ──
  { id: '19', matchNumber: 19, homeTeam: 'Argentina',    awayTeam: 'Argelia',      homeCode: 'ARG', awayCode: 'ALG', date: '16 Jun', isoDate: '2026-06-16', time: '21:00', stadium: 'Kansas City',   phase: 'Fase de Grupos', group: 'Grupo J' },
  { id: '20', matchNumber: 20, homeTeam: 'Austria',      awayTeam: 'Jordania',     homeCode: 'AUT', awayCode: 'JOR', date: '17 Jun', isoDate: '2026-06-17', time: '00:00', stadium: 'San Francisco', phase: 'Fase de Grupos', group: 'Grupo J' },
  { id: '41', matchNumber: 41, homeTeam: 'Argentina',    awayTeam: 'Austria',      homeCode: 'ARG', awayCode: 'AUT', date: '22 Jun', isoDate: '2026-06-22', time: '13:00', stadium: 'Dallas',        phase: 'Fase de Grupos', group: 'Grupo J' },
  { id: '44', matchNumber: 44, homeTeam: 'Jordania',     awayTeam: 'Argelia',      homeCode: 'JOR', awayCode: 'ALG', date: '22 Jun', isoDate: '2026-06-22', time: '23:00', stadium: 'San Francisco', phase: 'Fase de Grupos', group: 'Grupo J' },
  { id: '71', matchNumber: 71, homeTeam: 'Argelia',      awayTeam: 'Austria',      homeCode: 'ALG', awayCode: 'AUT', date: '27 Jun', isoDate: '2026-06-27', time: '22:00', stadium: 'Kansas City',   phase: 'Fase de Grupos', group: 'Grupo J' },
  { id: '72', matchNumber: 72, homeTeam: 'Jordania',     awayTeam: 'Argentina',    homeCode: 'JOR', awayCode: 'ARG', date: '27 Jun', isoDate: '2026-06-27', time: '22:00', stadium: 'Dallas',        phase: 'Fase de Grupos', group: 'Grupo J' },

  // ── GRUPO K ──
  { id: '21', matchNumber: 21, homeTeam: 'Portugal',     awayTeam: 'Rep. del Congo',homeCode: 'POR', awayCode: 'CGO', date: '17 Jun', isoDate: '2026-06-17', time: '13:00', stadium: 'Houston',      phase: 'Fase de Grupos', group: 'Grupo K' },
  { id: '24', matchNumber: 24, homeTeam: 'Uzbekistán',   awayTeam: 'Colombia',     homeCode: 'UZB', awayCode: 'COL', date: '17 Jun', isoDate: '2026-06-17', time: '22:00', stadium: 'Ciudad de México',phase: 'Fase de Grupos', group: 'Grupo K' },
  { id: '45', matchNumber: 45, homeTeam: 'Portugal',     awayTeam: 'Uzbekistán',   homeCode: 'POR', awayCode: 'UZB', date: '23 Jun', isoDate: '2026-06-23', time: '13:00', stadium: 'Houston',      phase: 'Fase de Grupos', group: 'Grupo K' },
  { id: '48', matchNumber: 48, homeTeam: 'Colombia',     awayTeam: 'Rep. del Congo',homeCode: 'COL', awayCode: 'CGO', date: '23 Jun', isoDate: '2026-06-23', time: '22:00', stadium: 'Guadalajara',  phase: 'Fase de Grupos', group: 'Grupo K' },
  { id: '69', matchNumber: 69, homeTeam: 'Colombia',     awayTeam: 'Portugal',     homeCode: 'COL', awayCode: 'POR', date: '27 Jun', isoDate: '2026-06-27', time: '19:30', stadium: 'Miami',        phase: 'Fase de Grupos', group: 'Grupo K' },
  { id: '70', matchNumber: 70, homeTeam: 'Rep. del Congo',awayTeam: 'Uzbekistán',  homeCode: 'CGO', awayCode: 'UZB', date: '27 Jun', isoDate: '2026-06-27', time: '19:30', stadium: 'Atlanta',      phase: 'Fase de Grupos', group: 'Grupo K' },

  // ── GRUPO L ──
  { id: '22', matchNumber: 22, homeTeam: 'Inglaterra',   awayTeam: 'Croacia',      homeCode: 'ENG', awayCode: 'CRO', date: '17 Jun', isoDate: '2026-06-17', time: '16:00', stadium: 'Dallas',       phase: 'Fase de Grupos', group: 'Grupo L' },
  { id: '23', matchNumber: 23, homeTeam: 'Ghana',        awayTeam: 'Panamá',       homeCode: 'GHA', awayCode: 'PAN', date: '17 Jun', isoDate: '2026-06-17', time: '19:00', stadium: 'Toronto',      phase: 'Fase de Grupos', group: 'Grupo L' },
  { id: '46', matchNumber: 46, homeTeam: 'Inglaterra',   awayTeam: 'Ghana',        homeCode: 'ENG', awayCode: 'GHA', date: '23 Jun', isoDate: '2026-06-23', time: '16:00', stadium: 'Boston',       phase: 'Fase de Grupos', group: 'Grupo L' },
  { id: '47', matchNumber: 47, homeTeam: 'Panamá',       awayTeam: 'Croacia',      homeCode: 'PAN', awayCode: 'CRO', date: '23 Jun', isoDate: '2026-06-23', time: '19:00', stadium: 'Toronto',      phase: 'Fase de Grupos', group: 'Grupo L' },
  { id: '67', matchNumber: 67, homeTeam: 'Panamá',       awayTeam: 'Inglaterra',   homeCode: 'PAN', awayCode: 'ENG', date: '27 Jun', isoDate: '2026-06-27', time: '17:00', stadium: 'Nueva York/NJ',phase: 'Fase de Grupos', group: 'Grupo L' },
  { id: '68', matchNumber: 68, homeTeam: 'Croacia',      awayTeam: 'Ghana',        homeCode: 'CRO', awayCode: 'GHA', date: '27 Jun', isoDate: '2026-06-27', time: '17:00', stadium: 'Filadelfia',   phase: 'Fase de Grupos', group: 'Grupo L' },
];

// ─── Partidos próximos (primeros 3 del fixture) ───────────────
export const upcomingMatches: MatchItem[] = fixtures.slice(0, 3);

// ─── Fases disponibles ────────────────────────────────────────
export const fixturePhases: MatchPhase[] = [
  'Fase de Grupos',
  'Dieciseisavos',
  'Octavos',
  'Cuartos',
  'Semifinales',
  'Final',
];

// ─── Grupos disponibles ───────────────────────────────────────
export const fixtureGroups = ['Grupo A','Grupo B','Grupo C','Grupo D','Grupo E','Grupo F','Grupo G','Grupo H','Grupo I','Grupo J','Grupo K','Grupo L'];

// ─── Banner data ──────────────────────────────────────────────
export const bannerData = {
  title: '¡Copa Mundial FIFA 2026!',
  description: 'Hacé tus pronósticos y sumá puntos.',
  actionLabel: 'Ver Fixture',
};

// ─── Home position ────────────────────────────────────────────
export const homePosition = {
  position: 4,
  points: 2450,
  variation: 120,
};

// ─── Pronósticos mock ─────────────────────────────────────────
export const predictions: PredictionItem[] = [
  { id: 'p1', match: 'Argentina vs Argelia',  date: '16 Jun', time: '21:00', status: 'Pendiente', pick: 'ARG', score: '2-0' },
  { id: 'p2', match: 'España vs Cabo Verde',  date: '15 Jun', time: '12:00', status: 'Guardado',  pick: 'ESP', score: '3-0' },
  { id: 'p3', match: 'Brasil vs Marruecos',   date: '13 Jun', time: '18:00', status: 'Pendiente', pick: 'BRA', score: '1-0' },
  { id: 'p4', match: 'Francia vs Senegal',    date: '16 Jun', time: '15:00', status: 'Guardado',  pick: 'FRA', score: '2-1' },
];

// ─── Ranking data ─────────────────────────────────────────────
export const rankingData: PositionItem[] = [
  { id: 'r1', position: 1, name: 'Martín R.',   points: 2850, played: 12, diff: 18 },
  { id: 'r2', position: 2, name: 'Sofía L.',    points: 2620, played: 12, diff: 14 },
  { id: 'r3', position: 3, name: 'Lucas P.',    points: 2500, played: 12, diff: 9 },
  { id: 'r4', position: 4, name: 'Vos',         points: 2450, played: 12, diff: 7, isCurrent: true },
  { id: 'r5', position: 5, name: 'Pedro M.',    points: 2300, played: 12, diff: 2 },
  { id: 'r6', position: 6, name: 'Gabi T.',     points: 2150, played: 12, diff: -1 },
  { id: 'r7', position: 7, name: 'Nico S.',     points: 2100, played: 12, diff: -4 },
  { id: 'r8', position: 8, name: 'Facu G.',     points: 1900, played: 12, diff: -8 },
];

// ─── Profile data ─────────────────────────────────────────────
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

// ─── Helpers ──────────────────────────────────────────────────
export function getMatchById(matchId: string): MatchItem | undefined {
  return fixtures.find((m) => m.id === matchId);
}

export function getMatchesByPhase(phase: MatchPhase): MatchItem[] {
  return fixtures.filter((m) => m.phase === phase);
}

export function getMatchesByGroup(group: string): MatchItem[] {
  return fixtures.filter((m) => m.group === group);
}

export function makeMatchLabel(match: MatchItem): string {
  return `${match.homeTeam} vs ${match.awayTeam}`;
}

// Próximos partidos (desde hoy en adelante, o los primeros 5 si no hay fecha futura)
export function getUpcomingMatches(limit = 5): MatchItem[] {
  const today = new Date().toISOString().split('T')[0];
  const upcoming = fixtures.filter((m) => m.isoDate >= today);
  return (upcoming.length > 0 ? upcoming : fixtures).slice(0, limit);
}
