-- ─────────────────────────────────────────────────────────────
-- Tabla de caché de partidos del Mundial 2026
-- Ejecutar en: Supabase → SQL Editor
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS wc2026_fixtures (
  id            INTEGER PRIMARY KEY,   -- fixture id de API-Football
  home_team     TEXT    NOT NULL,
  away_team     TEXT    NOT NULL,
  home_logo     TEXT,
  away_logo     TEXT,
  home_code     TEXT,
  away_code     TEXT,
  home_score    INTEGER,
  away_score    INTEGER,
  iso_date      DATE    NOT NULL,
  match_time    TEXT,                  -- "15:00"
  stadium       TEXT,
  city          TEXT,
  status        TEXT    NOT NULL DEFAULT 'NS',
  status_long   TEXT,
  elapsed       INTEGER,
  round         TEXT,
  match_group   TEXT,                  -- "Grupo A"
  phase         TEXT,                  -- "Fase de Grupos"
  is_live       BOOLEAN NOT NULL DEFAULT FALSE,
  is_finished   BOOLEAN NOT NULL DEFAULT FALSE,
  raw_json      JSONB,                 -- respuesta completa de la API
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices para búsquedas frecuentes
CREATE INDEX IF NOT EXISTS idx_wc2026_iso_date   ON wc2026_fixtures(iso_date);
CREATE INDEX IF NOT EXISTS idx_wc2026_phase       ON wc2026_fixtures(phase);
CREATE INDEX IF NOT EXISTS idx_wc2026_group       ON wc2026_fixtures(match_group);
CREATE INDEX IF NOT EXISTS idx_wc2026_is_live     ON wc2026_fixtures(is_live);
CREATE INDEX IF NOT EXISTS idx_wc2026_is_finished ON wc2026_fixtures(is_finished);

-- RLS: permitir lectura pública (anon)
ALTER TABLE wc2026_fixtures ENABLE ROW LEVEL SECURITY;

CREATE POLICY "allow_read_wc2026_fixtures" ON wc2026_fixtures
  FOR SELECT TO anon USING (true);

CREATE POLICY "allow_all_wc2026_fixtures" ON wc2026_fixtures
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Función para upsert masivo desde la app / edge function
CREATE OR REPLACE FUNCTION upsert_wc2026_fixtures(fixtures JSONB)
RETURNS void AS $$
BEGIN
  INSERT INTO wc2026_fixtures
  SELECT
    (f->>'id')::INTEGER,
    f->>'home_team', f->>'away_team',
    f->>'home_logo', f->>'away_logo',
    f->>'home_code', f->>'away_code',
    (f->>'home_score')::INTEGER, (f->>'away_score')::INTEGER,
    (f->>'iso_date')::DATE,
    f->>'match_time', f->>'stadium', f->>'city',
    f->>'status', f->>'status_long',
    (f->>'elapsed')::INTEGER,
    f->>'round', f->>'match_group', f->>'phase',
    (f->>'is_live')::BOOLEAN,
    (f->>'is_finished')::BOOLEAN,
    f::JSONB,
    NOW()
  FROM jsonb_array_elements(fixtures) AS f
  ON CONFLICT (id) DO UPDATE SET
    home_score  = EXCLUDED.home_score,
    away_score  = EXCLUDED.away_score,
    status      = EXCLUDED.status,
    status_long = EXCLUDED.status_long,
    elapsed     = EXCLUDED.elapsed,
    is_live     = EXCLUDED.is_live,
    is_finished = EXCLUDED.is_finished,
    raw_json    = EXCLUDED.raw_json,
    updated_at  = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
