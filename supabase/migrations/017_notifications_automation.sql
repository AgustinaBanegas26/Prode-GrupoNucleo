-- 17) Automated Notifications & User Reads

-- Create table to track which users have read which notifications
CREATE TABLE IF NOT EXISTS public.notification_reads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  notification_id UUID NOT NULL REFERENCES public.notifications(id) ON DELETE CASCADE,
  read_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, notification_id)
);

CREATE INDEX IF NOT EXISTS idx_notification_reads_user ON public.notification_reads(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_reads_notif ON public.notification_reads(notification_id);

-- Enable RLS and set policies
ALTER TABLE public.notification_reads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "notification_reads_select" ON public.notification_reads;
CREATE POLICY "notification_reads_select" ON public.notification_reads FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS "notification_reads_insert" ON public.notification_reads;
CREATE POLICY "notification_reads_insert" ON public.notification_reads FOR INSERT TO anon WITH CHECK (true);

DROP POLICY IF EXISTS "notification_reads_delete" ON public.notification_reads;
CREATE POLICY "notification_reads_delete" ON public.notification_reads FOR DELETE TO anon USING (true);

-- Ensure table notifications has proper publications for Realtime
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'notifications'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'notification_reads'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notification_reads;
  END if;
END $$;

-- Triggers for automated notifications

-- A) News published trigger
CREATE OR REPLACE FUNCTION public.trg_news_insert_notification()
RETURNS trigger AS $$
BEGIN
  IF new.published = true AND (old IS NULL OR old.published = false) THEN
    INSERT INTO public.notifications (title, body, audience, sent_at)
    VALUES (
      '📰 Nueva noticia publicada',
      new.title,
      'global',
      now()
    );
  END IF;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_news_insert_notification ON public.news;
CREATE TRIGGER trg_news_insert_notification
AFTER INSERT OR UPDATE ON public.news
FOR EACH ROW EXECUTE FUNCTION public.trg_news_insert_notification();

-- B) Match result updated trigger
CREATE OR REPLACE FUNCTION public.trg_matches_insert_notification()
RETURNS trigger AS $$
BEGIN
  IF new.home_goals IS NOT NULL AND new.away_goals IS NOT NULL
     AND (old IS NULL OR old.home_goals IS DISTINCT FROM new.home_goals OR old.away_goals IS DISTINCT FROM new.away_goals) THEN
     
    INSERT INTO public.notifications (title, body, audience, sent_at)
    VALUES (
      '⚽ Resultado cargado',
      format('Resultado final: %s %s - %s %s', new.home_team, new.home_goals, new.away_goals, new.away_team),
      'global',
      now()
    );
  END IF;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_matches_insert_notification ON public.matches;
CREATE TRIGGER trg_matches_insert_notification
AFTER UPDATE ON public.matches
FOR EACH ROW EXECUTE FUNCTION public.trg_matches_insert_notification();

-- C) New match loaded trigger
CREATE OR REPLACE FUNCTION public.trg_matches_new_notification()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.notifications (title, body, audience, sent_at)
  VALUES (
    '📅 Nuevo partido disponible',
    format('Nuevo partido cargado: %s vs %s', new.home_team, new.away_team),
    'global',
    now()
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_matches_new_notification ON public.matches;
CREATE TRIGGER trg_matches_new_notification
AFTER INSERT ON public.matches
FOR EACH ROW EXECUTE FUNCTION public.trg_matches_new_notification();
