import { useCallback, useEffect, useRef, useState } from 'react';

// Nota: este import asume que el cliente de Supabase está en mobile/src/lib/supabase.ts
// Si en tu proyecto está en otra ruta, ajustalo.
import { supabase } from '../lib/supabase';

export function useMatchResults() {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const channelRef = useRef(null);

  const applyUpsertLocal = useCallback((incoming) => {
    if (!incoming || typeof incoming.fixture_id !== 'number') return;

    setMatches((prev) => {
      const idx = prev.findIndex((m) => m.fixture_id === incoming.fixture_id);
      if (idx === -1) {
        const next = [...prev, incoming];
        next.sort((a, b) => new Date(a.match_date).getTime() - new Date(b.match_date).getTime());
        return next;
      }

      const next = [...prev];
      next[idx] = { ...next[idx], ...incoming };
      return next;
    });
  }, []);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: fetchError } = await supabase
        .from('matches')
        .select('*')
        .order('match_date', { ascending: true });

      if (fetchError) throw fetchError;
      setMatches(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();

    const channel = supabase
      .channel('matches-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'matches' },
        (payload) => applyUpsertLocal(payload.new),
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'matches' },
        (payload) => applyUpsertLocal(payload.new),
      )
      .subscribe((status) => {
        // opcional: log de estado de la suscripción
        // console.log('[useMatchResults] realtime status:', status);
      });

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [applyUpsertLocal, fetchAll]);

  return {
    matches,
    loading,
    error,
    refetch: fetchAll,
  };
}

