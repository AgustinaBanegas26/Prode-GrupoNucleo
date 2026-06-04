-- ═══════════════════════════════════════════════════════════════
-- TABLAS PARA PRONÓSTICOS Y RANKING
-- Ejecutar en: Supabase → SQL Editor
-- ═══════════════════════════════════════════════════════════════

-- ── 1. Pronósticos ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS predictions (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       TEXT        NOT NULL,      -- client.id (UUID interno de la tabla clientes)
  cliente_id    TEXT        NOT NULL,      -- número de cliente visible
  fixture_id    INTEGER     NOT NULL,      -- ID de API-Football o del fixture local
  pick_winner   TEXT        NOT NULL CHECK (pick_winner IN ('home','draw','away')),
  score_home    INTEGER,
  score_away    INTEGER,
  overtime      BOOLEAN     NOT NULL DEFAULT FALSE,
  penalties     BOOLEAN     NOT NULL DEFAULT FALSE,
  points_earned INTEGER     NOT NULL DEFAULT 0,
  status        TEXT        NOT NULL DEFAULT 'pending'
                            CHECK (status IN ('pending','correct','incorrect','partial')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, fixture_id)   -- un pronóstico por partido por usuario
);

CREATE INDEX IF NOT EXISTS idx_predictions_user_id    ON predictions(user_id);
CREATE INDEX IF NOT EXISTS idx_predictions_fixture_id ON predictions(fixture_id);
CREATE INDEX IF NOT EXISTS idx_predictions_status     ON predictions(status);

-- ── 2. Ranking (calculado por trigger, o manual) ─────────────
CREATE TABLE IF NOT EXISTS ranking (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       TEXT        NOT NULL UNIQUE,
  cliente_id    TEXT        NOT NULL,
  nombre        TEXT        NOT NULL,
  total_points  INTEGER     NOT NULL DEFAULT 0,
  total_played  INTEGER     NOT NULL DEFAULT 0,
  correct_exact INTEGER     NOT NULL DEFAULT 0,  -- resultado exacto
  correct_winner INTEGER    NOT NULL DEFAULT 0,  -- ganador correcto
  position      INTEGER,
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ranking_total_points ON ranking(total_points DESC);
CREATE INDEX IF NOT EXISTS idx_ranking_user_id      ON ranking(user_id);

-- ── 3. RLS ───────────────────────────────────────────────────
ALTER TABLE predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ranking     ENABLE ROW LEVEL SECURITY;

-- Lectura pública del ranking
CREATE POLICY "ranking_read_all" ON ranking
  FOR SELECT TO anon USING (true);

-- Escritura del ranking solo por service_role (trigger/edge function)
CREATE POLICY "ranking_write_service" ON ranking
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Pronósticos: cualquiera puede leer (para ranking)
CREATE POLICY "predictions_read_all" ON predictions
  FOR SELECT TO anon USING (true);

-- Pronósticos: cualquiera puede insertar/actualizar (anon key)
CREATE POLICY "predictions_write_anon" ON predictions
  FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "predictions_update_anon" ON predictions
  FOR UPDATE TO anon USING (true) WITH CHECK (true);

-- ── 4. Función para recalcular ranking ───────────────────────
CREATE OR REPLACE FUNCTION recalculate_ranking()
RETURNS void AS $$
BEGIN
  -- Upsert ranking desde pronósticos
  INSERT INTO ranking (user_id, cliente_id, nombre, total_points, total_played, correct_exact, correct_winner, position, updated_at)
  SELECT
    p.user_id,
    p.cliente_id,
    c.nombre,
    COALESCE(SUM(p.points_earned), 0)              AS total_points,
    COUNT(*)                                        AS total_played,
    COUNT(*) FILTER (WHERE p.status = 'correct')   AS correct_exact,
    COUNT(*) FILTER (WHERE p.status IN ('correct','partial')) AS correct_winner,
    0,
    NOW()
  FROM predictions p
  JOIN clientes c ON c.id::TEXT = p.user_id
  GROUP BY p.user_id, p.cliente_id, c.nombre
  ON CONFLICT (user_id) DO UPDATE SET
    nombre         = EXCLUDED.nombre,
    total_points   = EXCLUDED.total_points,
    total_played   = EXCLUDED.total_played,
    correct_exact  = EXCLUDED.correct_exact,
    correct_winner = EXCLUDED.correct_winner,
    updated_at     = NOW();

  -- Actualizar posiciones
  WITH ranked AS (
    SELECT user_id, ROW_NUMBER() OVER (ORDER BY total_points DESC, correct_exact DESC) AS pos
    FROM ranking
  )
  UPDATE ranking r SET position = ranked.pos
  FROM ranked WHERE r.user_id = ranked.user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── 5. Función para calcular puntos de un pronóstico ─────────
-- Llamar desde la app o un edge function cuando se carguen resultados
CREATE OR REPLACE FUNCTION score_prediction(
  p_fixture_id  INTEGER,
  p_home_result INTEGER,   -- goles locales del resultado real
  p_away_result INTEGER    -- goles visitante del resultado real
)
RETURNS void AS $$
DECLARE
  real_winner TEXT;
  pred        RECORD;
  pts         INTEGER;
  st          TEXT;
BEGIN
  -- Determinar ganador real
  real_winner := CASE
    WHEN p_home_result > p_away_result  THEN 'home'
    WHEN p_home_result < p_away_result  THEN 'away'
    ELSE 'draw'
  END;

  -- Iterar sobre pronósticos de este partido
  FOR pred IN
    SELECT * FROM predictions WHERE fixture_id = p_fixture_id AND status = 'pending'
  LOOP
    pts := 0;
    st  := 'incorrect';

    -- Resultado exacto: 3 puntos
    IF pred.score_home = p_home_result AND pred.score_away = p_away_result THEN
      pts := 3;
      st  := 'correct';
    -- Ganador correcto: 1 punto
    ELSIF pred.pick_winner = real_winner THEN
      pts := 1;
      st  := 'partial';
    END IF;

    UPDATE predictions
    SET points_earned = pts, status = st, updated_at = NOW()
    WHERE id = pred.id;
  END LOOP;

  -- Recalcular ranking
  PERFORM recalculate_ranking();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
