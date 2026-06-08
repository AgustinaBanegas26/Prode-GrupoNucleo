-- ═══════════════════════════════════════════════════════════════
-- MIGRACIÓN FINAL — basada en el schema REAL de Supabase
-- Ejecutar en: Supabase → SQL Editor
-- Seguro para ejecutar múltiples veces (idempotente)
-- ═══════════════════════════════════════════════════════════════

-- ── 1. Columnas faltantes en tablas existentes ───────────────

-- clientes
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- predictions (schema real: id, cliente_id, fixture_id, pick_winner,
--   score_home, score_away, points_earned, locked, submitted_at, created_at, updated_at)
ALTER TABLE predictions ADD COLUMN IF NOT EXISTS locked       BOOLEAN     DEFAULT FALSE;
ALTER TABLE predictions ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE predictions ADD COLUMN IF NOT EXISTS status       TEXT        DEFAULT 'pending';
ALTER TABLE predictions ADD COLUMN IF NOT EXISTS updated_at   TIMESTAMPTZ DEFAULT NOW();

-- ranking (schema real: id, cliente_id, nombre, total_points, total_played,
--   correct_exact, correct_winner, position, updated_at)
ALTER TABLE ranking ADD COLUMN IF NOT EXISTS correct_winner INTEGER DEFAULT 0;

-- matches
ALTER TABLE matches ADD COLUMN IF NOT EXISTS home_logo  TEXT;
ALTER TABLE matches ADD COLUMN IF NOT EXISTS away_logo  TEXT;
ALTER TABLE matches ADD COLUMN IF NOT EXISTS round      TEXT;
ALTER TABLE matches ADD COLUMN IF NOT EXISTS venue      TEXT;
ALTER TABLE matches ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- news (schema real: id, title, content, image_url, published, created_at)
-- Agregar description como alias de content para compatibilidad
ALTER TABLE news ADD COLUMN IF NOT EXISTS description TEXT DEFAULT '';
UPDATE news SET description = content WHERE description = '' AND content IS NOT NULL AND content != '';

-- notifications (schema real: id, title, message, target_role, created_at)
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS body     TEXT DEFAULT '';
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS audience TEXT DEFAULT 'global';
UPDATE notifications SET body = message WHERE body = '' AND message IS NOT NULL AND message != '';

-- activity_logs (schema real: id, cliente_id, action, metadata jsonb, created_at)
ALTER TABLE activity_logs ADD COLUMN IF NOT EXISTS metadata JSONB;

-- ── 2. Índices ────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_predictions_cliente_id ON predictions(cliente_id);
CREATE INDEX IF NOT EXISTS idx_predictions_fixture_id ON predictions(fixture_id);
CREATE INDEX IF NOT EXISTS idx_ranking_total_points   ON ranking(total_points DESC);
CREATE INDEX IF NOT EXISTS idx_ranking_cliente_id     ON ranking(cliente_id);
CREATE INDEX IF NOT EXISTS idx_matches_match_date     ON matches(match_date ASC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created  ON activity_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_news_published         ON news(published);

-- ── 3. Unique constraint en ranking.cliente_id ───────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'ranking_cliente_id_key'
    AND conrelid = 'ranking'::regclass
  ) THEN
    ALTER TABLE ranking ADD CONSTRAINT ranking_cliente_id_key UNIQUE (cliente_id);
  END IF;
END $$;

-- ── 4. RLS — habilitar y recrear políticas limpias ───────────

ALTER TABLE predictions   ENABLE ROW LEVEL SECURITY;
ALTER TABLE ranking        ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches        ENABLE ROW LEVEL SECURITY;
ALTER TABLE news           ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications  ENABLE ROW LEVEL SECURITY;
ALTER TABLE rewards        ENABLE ROW LEVEL SECURITY;
ALTER TABLE slider_slides  ENABLE ROW LEVEL SECURITY;
ALTER TABLE clientes       ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs  ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas existentes para recrearlas limpias
DO $$ DECLARE pol RECORD;
BEGIN
  FOR pol IN SELECT policyname, tablename FROM pg_policies
    WHERE schemaname = 'public'
    AND tablename IN ('predictions','ranking','matches','news','notifications',
                      'rewards','slider_slides','clientes','activity_logs')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', pol.policyname, pol.tablename);
  END LOOP;
END $$;

-- clientes
CREATE POLICY "clientes_read"   ON clientes FOR SELECT TO anon USING (true);
CREATE POLICY "clientes_update" ON clientes FOR UPDATE TO anon USING (true) WITH CHECK (true);

-- matches
CREATE POLICY "matches_read"  ON matches FOR SELECT TO anon USING (true);
CREATE POLICY "matches_write" ON matches FOR ALL    TO anon USING (true) WITH CHECK (true);

-- predictions
CREATE POLICY "pred_read"   ON predictions FOR SELECT TO anon USING (true);
CREATE POLICY "pred_insert" ON predictions FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "pred_update" ON predictions FOR UPDATE TO anon USING (true) WITH CHECK (true);

-- ranking
CREATE POLICY "rank_read"   ON ranking FOR SELECT TO anon USING (true);
CREATE POLICY "rank_write"  ON ranking FOR ALL    TO anon USING (true) WITH CHECK (true);

-- news
CREATE POLICY "news_read"   ON news FOR SELECT TO anon USING (true);
CREATE POLICY "news_write"  ON news FOR ALL    TO anon USING (true) WITH CHECK (true);

-- notifications
CREATE POLICY "notif_read"  ON notifications FOR SELECT TO anon USING (true);
CREATE POLICY "notif_write" ON notifications FOR ALL    TO anon USING (true) WITH CHECK (true);

-- rewards
CREATE POLICY "rewards_read"  ON rewards FOR SELECT TO anon USING (true);
CREATE POLICY "rewards_write" ON rewards FOR ALL    TO anon USING (true) WITH CHECK (true);

-- slider_slides
CREATE POLICY "slider_read"  ON slider_slides FOR SELECT TO anon USING (true);
CREATE POLICY "slider_write" ON slider_slides FOR ALL    TO anon USING (true) WITH CHECK (true);

-- activity_logs
CREATE POLICY "activity_read"   ON activity_logs FOR SELECT TO anon USING (true);
CREATE POLICY "activity_insert" ON activity_logs FOR INSERT TO anon WITH CHECK (true);

-- ── 5. Storage bucket avatars ─────────────────────────────────
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

DO $$ BEGIN
  DROP POLICY IF EXISTS "avatars_read"   ON storage.objects;
  DROP POLICY IF EXISTS "avatars_upload" ON storage.objects;
  DROP POLICY IF EXISTS "avatars_update" ON storage.objects;
END $$;

CREATE POLICY "avatars_read"   ON storage.objects FOR SELECT TO anon USING (bucket_id = 'avatars');
CREATE POLICY "avatars_upload" ON storage.objects FOR INSERT TO anon WITH CHECK (bucket_id = 'avatars');
CREATE POLICY "avatars_update" ON storage.objects FOR UPDATE TO anon USING (bucket_id = 'avatars') WITH CHECK (bucket_id = 'avatars');

-- ── 6. Función recalcular ranking (usa schema real) ──────────
CREATE OR REPLACE FUNCTION recalculate_ranking()
RETURNS void AS $$
BEGIN
  INSERT INTO ranking (cliente_id, nombre, total_points, total_played,
                       correct_exact, correct_winner, position, updated_at)
  SELECT
    p.cliente_id,
    c.nombre,
    COALESCE(SUM(p.points_earned), 0),
    COUNT(*),
    COUNT(*) FILTER (WHERE p.status = 'correct'),
    COUNT(*) FILTER (WHERE p.status IN ('correct','partial')),
    0,
    NOW()
  FROM predictions p
  JOIN clientes c ON c.cliente_id = p.cliente_id
  GROUP BY p.cliente_id, c.nombre
  ON CONFLICT (cliente_id) DO UPDATE SET
    nombre         = EXCLUDED.nombre,
    total_points   = EXCLUDED.total_points,
    total_played   = EXCLUDED.total_played,
    correct_exact  = EXCLUDED.correct_exact,
    correct_winner = EXCLUDED.correct_winner,
    updated_at     = NOW();

  WITH ranked AS (
    SELECT cliente_id,
           ROW_NUMBER() OVER (ORDER BY total_points DESC, correct_exact DESC) AS pos
    FROM ranking
  )
  UPDATE ranking r SET position = ranked.pos
  FROM ranked WHERE r.cliente_id = ranked.cliente_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── 7. Función calcular puntos por partido ───────────────────
CREATE OR REPLACE FUNCTION score_prediction(
  p_fixture_id  INTEGER,
  p_home_result INTEGER,
  p_away_result INTEGER
)
RETURNS void AS $$
DECLARE
  real_winner TEXT;
  pred        RECORD;
  pts         INTEGER;
  st          TEXT;
BEGIN
  real_winner := CASE
    WHEN p_home_result > p_away_result THEN 'home'
    WHEN p_home_result < p_away_result THEN 'away'
    ELSE 'draw'
  END;

  FOR pred IN
    SELECT * FROM predictions
    WHERE fixture_id = p_fixture_id AND (status = 'pending' OR status IS NULL)
  LOOP
    pts := 0; st := 'incorrect';
    IF pred.score_home = p_home_result AND pred.score_away = p_away_result THEN
      pts := 3; st := 'correct';
    ELSIF pred.pick_winner = real_winner THEN
      pts := 1; st := 'partial';
    END IF;
    UPDATE predictions
    SET points_earned = pts, status = st, updated_at = NOW()
    WHERE id = pred.id;
  END LOOP;

  PERFORM recalculate_ranking();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
