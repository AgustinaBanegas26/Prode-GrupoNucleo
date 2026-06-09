import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';

import { matchesQueryKey } from '../features/content/api/matches';
import { syncAllFixturesToDb } from '../features/content/api/matchResultsSync';

const FULL_SYNC_INTERVAL_MS = 6 * 60 * 60 * 1000;

export function useFixtureDbSync(enabled = true) {
  const qc = useQueryClient();
  const runningRef = useRef(false);

  useEffect(() => {
    if (!enabled) return;

    const run = async () => {
      if (runningRef.current) return;
      runningRef.current = true;
      try {
        const { updated } = await syncAllFixturesToDb();
        if (updated > 0) {
          await qc.invalidateQueries({ queryKey: matchesQueryKey });
        }
      } catch (e) {
        console.warn('[useFixtureDbSync]', e);
      } finally {
        runningRef.current = false;
      }
    };

    void run();
    const id = setInterval(() => { void run(); }, FULL_SYNC_INTERVAL_MS);
    return () => clearInterval(id);
  }, [enabled, qc]);
}
