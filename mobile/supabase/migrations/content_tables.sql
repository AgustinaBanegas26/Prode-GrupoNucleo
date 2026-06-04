-- ═══════════════════════════════════════════════════════════════
-- TABLAS DE CONTENIDO: news, rewards, notifications, activity_logs
-- Ejecutar en: Supabase → SQL Editor
-- ═══════════════════════════════════════════════════════════════

-- ── 1. News ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS news (
  id           TEXT        PRIMARY KEY,
  title        TEXT        NOT NULL,
  description  TEXT        NOT NULL DEFAULT '',
  image_url    TEXT,
  published    BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE news ENABLE ROW LEVEL SECURITY;

-- Lectura pública de noticias publicadas
CREATE POLICY "news_read_published" ON news
  FOR SELECT TO anon USING (published = true);

-- Admins pueden leer todo y escribir (service_role)
CREATE POLICY "news_all_service" ON news
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Anon puede leer todo (para que admin sin auth de Supabase pueda listar)
CREATE POLICY "news_read_all_anon" ON news
  FOR SELECT TO anon USING (true);

-- Anon puede insertar/actualizar/eliminar (usamos anon key desde el cliente admin)
CREATE POLICY "news_write_anon" ON news
  FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "news_update_anon" ON news
  FOR UPDATE TO anon USING (true) WITH CHECK (true);

CREATE POLICY "news_delete_anon" ON news
  FOR DELETE TO anon USING (true);

-- ── 2. Rewards ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS rewards (
  id           TEXT        PRIMARY KEY,
  name         TEXT        NOT NULL,
  description  TEXT        NOT NULL DEFAULT '',
  image_url    TEXT,
  quantity     INTEGER     NOT NULL DEFAULT 0,
  status       TEXT        NOT NULL DEFAULT 'active'
                           CHECK (status IN ('active', 'inactive')),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE rewards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "rewards_read_all" ON rewards
  FOR SELECT TO anon USING (true);

CREATE POLICY "rewards_write_anon" ON rewards
  FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "rewards_update_anon" ON rewards
  FOR UPDATE TO anon USING (true) WITH CHECK (true);

CREATE POLICY "rewards_delete_anon" ON rewards
  FOR DELETE TO anon USING (true);

CREATE POLICY "rewards_all_service" ON rewards
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ── 3. Notifications ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notifications (
  id              TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::text,
  title           TEXT        NOT NULL,
  body            TEXT        NOT NULL,
  audience        TEXT        NOT NULL DEFAULT 'global'
                              CHECK (audience IN ('global', 'group', 'individual')),
  target_group    TEXT,
  target_user_id  TEXT,
  sent_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notifications_read_all" ON notifications
  FOR SELECT TO anon USING (true);

CREATE POLICY "notifications_write_anon" ON notifications
  FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "notifications_delete_anon" ON notifications
  FOR DELETE TO anon USING (true);

CREATE POLICY "notifications_all_service" ON notifications
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ── 4. Activity Logs ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS activity_logs (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     TEXT        NOT NULL,
  cliente_id  TEXT,
  action      TEXT        NOT NULL,
  detail      TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id   ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_action    ON activity_logs(action);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created   ON activity_logs(created_at DESC);

ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- Solo service_role puede leer logs
CREATE POLICY "activity_logs_read_service" ON activity_logs
  FOR SELECT TO service_role USING (true);

-- Cualquier usuario autenticado (anon key) puede insertar
CREATE POLICY "activity_logs_insert_anon" ON activity_logs
  FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "activity_logs_all_service" ON activity_logs
  FOR ALL TO service_role USING (true) WITH CHECK (true);
