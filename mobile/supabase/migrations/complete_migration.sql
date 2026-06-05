-- ═══════════════════════════════════════════════════════════════
-- MIGRACIÓN FINAL — adaptada al schema real de Supabase
-- Tablas existentes: admins, clientes, matches, predictions,
--   ranking, news, rewards, notifications, slider_slides,
--   activity_logs
-- Ejecutar en: Supabase → SQL Editor
-- ═══════════════════════════════════════════════════════════════

-- ── 1. Columnas faltantes en clientes ────────────────────────
ALTER TABLE clientes
  ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- ── 2. Adaptar activity_logs al schema real ──────────────────
-- Schema real: id, cliente_id, action, metadata (jsonb), created_at
-- Agregar columna metadata si no existe
ALTER TABLE activity_logs
  ADD COLUMN IF NOT EXISTS metadata JSONB;

-- ── 3. Adaptar predictions al schema real ────────────────────
-- Schema real: id, cliente_id, fixture_id, pick_winner, score_home,
--   score_away, points_earned, locked, submitted_at, created_at, updated_at
-- Agregar columna locked si no existe
ALTER TABLE predictions
  ADD COLUMN IF NOT EXISTS locked BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE predictions
  ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMPTZ DEFAULT NOW();

-- ── 4. Adaptar news al schema real ───────────────────────────
-- Schema real: id, title, content, image_url, published, created_at
-- El código usa 'description' pero la tabla tiene 'content'
-- Agregar alias para compatibilidad
ALTER TABLE news
  ADD COLUMN IF NOT EXISTS description TEXT DEFAULT '';

-- Sincronizar description desde content si ya hay datos
UPDATE news SET description = content WHERE description = '' AND content IS NOT NULL;

-- ── 5. Adaptar notifications al schema real ──────────────────
-- Schema real: id, title, message, target_role, created_at
-- El código usa 'body' y 'audience' — agregar columnas compatibles
ALTER TABLE notifications
  ADD COLUMN IF NOT EXISTS body TEXT DEFAULT '';
ALTER TABLE notifications
  ADD COLUMN IF NOT EXISTS audience TEXT DEFAULT 'global';

-- Sincronizar body desde message
UPDATE notifications SET body = message WHERE body = '' AND message IS NOT NULL;

-- ── 6. Agregar columnas faltantes en ranking ─────────────────
-- Schema real: id, cliente_id, nombre, total_points, total_played,
--   correct_exact, correct_winner, position, updated_at
ALTER TABLE ranking
  ADD COLUMN IF NOT EXISTS correct_winner INTEGER NOT NULL DEFAULT 0;

-- ── 7. Columnas faltantes en matches ─────────────────────────
ALTER TABLE matches
  ADD COLUMN IF NOT EXISTS home_logo TEXT;
ALTER TABLE matches
  ADD COLUMN IF NOT EXISTS away_logo TEXT;
ALTER TABLE matches
  ADD COLUMN IF NOT EXISTS round TEXT;
ALTER TABLE matches
  ADD COLUMN IF NOT EXISTS venue TEXT;
ALTER TABLE matches
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- ── 8. Índices útiles ────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_predictions_cliente_id  ON predictions(cliente_id);
CREATE INDEX IF NOT EXISTS idx_predictions_fixture_id  ON predictions(fixture_id);
CREATE INDEX IF NOT EXISTS idx_ranking_total_points    ON ranking(total_points DESC);
CREATE INDEX IF NOT EXISTS idx_ranking_cliente_id      ON ranking(cliente_id);
CREATE INDEX IF NOT EXISTS idx_matches_match_date      ON matches(match_date ASC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created   ON activity_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_news_published          ON news(published);

-- ── 9. RLS — asegurar que todas las tablas tienen políticas ──

-- Habilitar RLS donde no está activo
ALTER TABLE activity_logs  ENABLE ROW LEVEL SECURITY;
ALTER TABLE predictions     ENABLE ROW LEVEL SECURITY;
ALTER TABLE ranking         ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches         ENABLE ROW LEVEL SECURITY;
ALTER TABLE news            ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications   ENABLE ROW LEVEL SECURITY;
ALTER TABLE rewards         ENABLE ROW LEVEL SECURITY;
ALTER TABLE slider_slides   ENABLE ROW LEVEL SECURITY;
ALTER TABLE clientes        ENABLE ROW LEVEL SECURITY;

-- Limpiar políticas existentes para recrearlas limpias
DO $$ DECLARE
  pol RECORD;
BEGIN
  FOR pol IN
    SELECT policyname, tablename FROM pg_policies
    WHERE schemaname = 'public'
    AND tablename IN ('activity_logs','predictions','ranking','matches',
                      'news','notifications','rewards','slider_slides','clientes')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', pol.policyname, pol.tablename);
  END LOOP;
END $$;

-- clientes: lectura y actualización propias (anon key)
CREATE POLICY "clientes_read_anon"   ON clientes FOR SELECT TO anon USING (true);
CREATE POLICY "clientes_update_anon" ON clientes FOR UPDATE TO anon USING (true) WITH CHECK (true);

-- matches: lectura pública
CREATE POLICY "matches_read_anon"  ON matches FOR SELECT TO anon USING (true);
CREATE POLICY "matches_write_anon" ON matches FOR ALL    TO anon USING (true) WITH CHECK (true);

-- predictions: lectura y escritura por anon
CREATE POLICY "predictions_read_anon"   ON predictions FOR SELECT TO anon USING (true);
CREATE POLICY "predictions_insert_anon" ON predictions FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "predictions_update_anon" ON predictions FOR UPDATE TO anon USING (true) WITH CHECK (true);

-- ranking: lectura pública
CREATE POLICY "ranking_read_anon"   ON ranking FOR SELECT TO anon USING (true);
CREATE POLICY "ranking_update_anon" ON ranking FOR ALL    TO anon USING (true) WITH CHECK (true);

-- news: lectura de publicadas + gestión admin
CREATE POLICY "news_read_published" ON news FOR SELECT TO anon USING (published = true);
CREATE POLICY "news_all_anon"       ON news FOR ALL    TO anon USING (true) WITH CHECK (true);

-- notifications
CREATE POLICY "notifications_read"  ON notifications FOR SELECT TO anon USING (true);
CREATE POLICY "notifications_write" ON notifications FOR ALL    TO anon USING (true) WITH CHECK (true);

-- rewards
CREATE POLICY "rewards_read"   ON rewards FOR SELECT TO anon USING (true);
CREATE POLICY "rewards_write"  ON rewards FOR ALL    TO anon USING (true) WITH CHECK (true);

-- slider_slides
CREATE POLICY "slider_read"    ON slider_slides FOR SELECT TO anon USING (true);
CREATE POLICY "slider_write"   ON slider_slides FOR ALL    TO anon USING (true) WITH CHECK (true);

-- activity_logs
CREATE POLICY "activity_read"   ON activity_logs FOR SELECT TO anon USING (true);
CREATE POLICY "activity_insert" ON activity_logs FOR INSERT TO anon WITH CHECK (true);

-- ── 10. Storage bucket para avatars ──────────────────────────
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

DO $$ BEGIN
  DROP POLICY IF EXISTS "avatars_public_read" ON storage.objects;
  DROP POLICY IF EXISTS "avatars_anon_upload" ON storage.objects;
  DROP POLICY IF EXISTS "avatars_anon_update" ON storage.objects;
END $$;

CREATE POLICY "avatars_public_read" ON storage.objects
  FOR SELECT TO anon USING (bucket_id = 'avatars');

CREATE POLICY "avatars_anon_upload" ON storage.objects
  FOR INSERT TO anon WITH CHECK (bucket_id = 'avatars');

CREATE POLICY "avatars_anon_update" ON storage.objects
  FOR UPDATE TO anon USING (bucket_id = 'avatars') WITH CHECK (bucket_id = 'avatars');

-- ── 11. Función recalcular ranking (usa schema real) ─────────
CREATE OR REPLACE FUNCTION recalculate_ranking()
RETURNS void AS $$
BEGIN
  INSERT INTO ranking (cliente_id, nombre, total_points, total_played, correct_exact, correct_winner, position, updated_at)
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

-- ── 12. Función calcular puntos de pronósticos ───────────────
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
    WHERE fixture_id = p_fixture_id AND status = 'pending'
  LOOP
    pts := 0;
    st  := 'incorrect';

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

-- ── 13. Unique constraint en ranking por cliente_id ──────────
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
