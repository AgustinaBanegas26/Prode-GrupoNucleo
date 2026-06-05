-- ═══════════════════════════════════════════════════════════════
-- MIGRACIÓN COMPLETA A SUPABASE
-- Ejecutar en: Supabase → SQL Editor
-- ═══════════════════════════════════════════════════════════════

-- ── 1. Agregar avatar_url a clientes ─────────────────────────
ALTER TABLE clientes
  ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- ── 2. Tabla activity_logs ───────────────────────────────────
CREATE TABLE IF NOT EXISTS activity_logs (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     TEXT        NOT NULL,
  cliente_id  TEXT,
  action      TEXT        NOT NULL,
  detail      TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id    ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_action     ON activity_logs(action);

-- ── 3. Tabla news ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS news (
  id          TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::text,
  title       TEXT        NOT NULL,
  description TEXT        NOT NULL DEFAULT '',
  image_url   TEXT,
  published   BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_news_published ON news(published);

-- ── 4. Tabla notifications ────────────────────────────────────
CREATE TABLE IF NOT EXISTS notifications (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  title           TEXT        NOT NULL,
  body            TEXT        NOT NULL,
  audience        TEXT        NOT NULL DEFAULT 'global'
                              CHECK (audience IN ('global','group','individual')),
  target_group    TEXT,
  target_user_id  TEXT,
  sent_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 5. Tabla slider_slides ────────────────────────────────────
CREATE TABLE IF NOT EXISTS slider_slides (
  id             TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::text,
  title          TEXT        NOT NULL,
  description    TEXT        NOT NULL DEFAULT '',
  image_path     TEXT        NOT NULL DEFAULT '',
  button_enabled BOOLEAN     NOT NULL DEFAULT FALSE,
  button_text    TEXT        NOT NULL DEFAULT '',
  internal_link  TEXT,
  external_link  TEXT,
  sort_order     INTEGER     NOT NULL DEFAULT 1,
  is_active      BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 6. Tabla rewards ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS rewards (
  id          TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name        TEXT        NOT NULL,
  description TEXT        NOT NULL DEFAULT '',
  image_url   TEXT,
  quantity    INTEGER     NOT NULL DEFAULT 0,
  status      TEXT        NOT NULL DEFAULT 'active'
                          CHECK (status IN ('active','inactive')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 7. RLS ───────────────────────────────────────────────────
ALTER TABLE activity_logs  ENABLE ROW LEVEL SECURITY;
ALTER TABLE news            ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications   ENABLE ROW LEVEL SECURITY;
ALTER TABLE slider_slides   ENABLE ROW LEVEL SECURITY;
ALTER TABLE rewards         ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas si ya existen para evitar duplicados
DO $$ BEGIN
  DROP POLICY IF EXISTS "read_activity_logs"       ON activity_logs;
  DROP POLICY IF EXISTS "insert_activity_logs"     ON activity_logs;
  DROP POLICY IF EXISTS "read_news"                ON news;
  DROP POLICY IF EXISTS "anon_manage_news"         ON news;
  DROP POLICY IF EXISTS "read_notifications"       ON notifications;
  DROP POLICY IF EXISTS "anon_manage_notifications"ON notifications;
  DROP POLICY IF EXISTS "read_slider_slides"       ON slider_slides;
  DROP POLICY IF EXISTS "anon_manage_slider"       ON slider_slides;
  DROP POLICY IF EXISTS "read_rewards"             ON rewards;
  DROP POLICY IF EXISTS "anon_manage_rewards"      ON rewards;
END $$;

-- activity_logs
CREATE POLICY "read_activity_logs"   ON activity_logs FOR SELECT TO anon USING (true);
CREATE POLICY "insert_activity_logs" ON activity_logs FOR INSERT TO anon WITH CHECK (true);

-- news
CREATE POLICY "read_news"            ON news FOR SELECT TO anon USING (published = true);
CREATE POLICY "anon_manage_news"     ON news FOR ALL    TO anon USING (true) WITH CHECK (true);

-- notifications
CREATE POLICY "read_notifications"        ON notifications FOR SELECT TO anon USING (true);
CREATE POLICY "anon_manage_notifications" ON notifications FOR ALL    TO anon USING (true) WITH CHECK (true);

-- slider_slides
CREATE POLICY "read_slider_slides"  ON slider_slides FOR SELECT TO anon USING (is_active = true);
CREATE POLICY "anon_manage_slider"  ON slider_slides FOR ALL    TO anon USING (true) WITH CHECK (true);

-- rewards
CREATE POLICY "read_rewards"        ON rewards FOR SELECT TO anon USING (status = 'active');
CREATE POLICY "anon_manage_rewards" ON rewards FOR ALL    TO anon USING (true) WITH CHECK (true);

-- ── 8. Storage bucket para fotos de perfil ───────────────────
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
