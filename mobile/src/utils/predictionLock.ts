export const PREDICTION_LOCK_MINUTES = 10;

export const PREDICTION_LOCKED_MESSAGE =
  'Las predicciones se cerraron 10 minutos antes del inicio del partido.';

export function getPredictionLockTime(matchDate: Date): number {
  return matchDate.getTime() - PREDICTION_LOCK_MINUTES * 60 * 1000;
}

export function isPredictionLocked(matchDate: Date | null | undefined, now = Date.now()): boolean {
  if (!matchDate || Number.isNaN(matchDate.getTime())) return false;
  return now >= getPredictionLockTime(matchDate);
}

export function buildMatchDate(isoDate: string, time: string): Date {
  return new Date(`${isoDate}T${time}:00`);
}
