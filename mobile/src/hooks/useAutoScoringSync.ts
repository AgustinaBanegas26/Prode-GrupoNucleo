import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';

import { syncFinishedMatchResults } from '../features/content/api/matchResultsSync';

const SYNC_INTERVAL_MS = 5 * 60 * 1000;

export function useAutoScoringSync(enabled = true) {
  const qc = useQueryClient();
  const runningRef = useRef(false);

  useEffect(() => {
    if (!enabled) return;

    const run = async () => {
      if (runningRef.current) return;
      runningRef.current = true;
      try {
        const { updated } = await syncFinishedMatchResults();
        if (updated > 0) {
          await qc.invalidateQueries({ queryKey: ['ranking'] });
          await qc.invalidateQueries({ queryKey: ['matches'] });
        }
      } catch (e) {
        console.warn('[useAutoScoringSync]', e);
      } finally {
        runningRef.current = false;
      }
    };

    void run();
    const id = setInterval(() => { void run(); }, SYNC_INTERVAL_MS);
    return () => clearInterval(id);
  }, [enabled, qc]);
}
